#!/usr/bin/env python3
import json
import sys
import random
import copy
import argparse
from collections import defaultdict
from typing import Dict, List, Tuple, Any

# Parámetros del GA
POP_SIZE = 100
GENERATIONS = 200
TOURNAMENT_K = 3
CROSSOVER_PROB = 0.8
MUTATION_PROB = 0.2

# Type aliases
Period = str
AulaID = str
CourseCode = str

def convert_input_format(new_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convierte el JSON de entrada al formato interno del GA."""
    data = {}
    
    # 1. Generar lista de periodos
    periods_list = []
    for period in new_data['periods']:
        day = period['day_of_week']
        start = period['start_time']
        end = period['end_time']
        period_str = f"{day}_{start}_{end}"
        periods_list.append(period_str)
    
    data['periodos'] = periods_list
    
    # 2. Convertir aulas
    classroom_type_map = {"THEORY": "T", "LAB": "LAB"}
    aulas_list = []
    for room in new_data['classrooms']:
        aulas_list.append({
            'id': room['room_code'],
            'nombre': room.get('room_name', room['room_code']),
            'tipo': classroom_type_map.get(room['room_type'], room['room_type']),
            'capacidad': room['capacity']
        })
    data['_aulas_list'] = aulas_list
    
    # 3. Convertir profesores
    profs_map = {}
    for prof in new_data['professors']:
        disponibilidad = []
        for avail in prof['availabilities']:
            day = avail['day_of_week']
            for p in periods_list:
                if p.startswith(day + "_"):
                    parts = p.split("_")
                    p_start = parts[1]
                    p_end = parts[2]
                    if avail['start_time'] <= p_start and p_end <= avail['end_time']:
                        disponibilidad.append(p)
        # Cambiar la clave a 'professor_id'
        profs_map[prof['professor_id']] = {
            'id': prof['professor_id'],
            'nombre': prof['name'],
            'disponibilidad': disponibilidad
        }
    data['_profs_map'] = profs_map

    # 4. Convertir cursos (dividiendo teoría y lab)
    courses_map = {}
    for course in new_data['courses']:
        theory_hours = course.get('theory_hours', 0)
        lab_hours = course.get('lab_hours', 0)
        # Obtener lista de profesores (IDs)
        prof_ids = course.get('professors', [])
        # Usar directamente los IDs
        if theory_hours > 0:
            course_code_theory = f"{course['course_code']}_T"
            courses_map[course_code_theory] = {
                'codigo': course_code_theory,
                'nombre': f"{course['course_name']} (Teoría)",
                'creditos': course['credits'],
                'estudiantes': 30,  # Valor por defecto
                'profesores': prof_ids,  # Usar IDs
                'aula_tipo': 'T',
                '_blocks_needed': theory_hours,
                'prerequisitos': course.get('prerequisites', []),
                'original_code': course['course_code'],
                'year': course['year']
            }
        if lab_hours > 0:
            course_code_lab = f"{course['course_code']}_LAB"
            courses_map[course_code_lab] = {
                'codigo': course_code_lab,
                'nombre': f"{course['course_name']} (Laboratorio)",
                'creditos': course['credits'],
                'estudiantes': 30,  # Valor por defecto
                'profesores': prof_ids,  # Usar IDs
                'aula_tipo': 'LAB',
                '_blocks_needed': lab_hours,
                'prerequisitos': course.get('prerequisites', []),
                'original_code': course['course_code'],
                'year': course['year']
            }
    data['_courses_map'] = courses_map
    
    # 5. Preferencias
    data['preferencias'] = {
        'turno_preferido': new_data['preferences']['preferred_shift'].lower(),
        'dias_preferidos': new_data['preferences'].get('preferred_days', []),
        'franjas_preferidas': new_data['preferences'].get('preferred_slots', [])
    }
    
    # 6. Pesos (valores por defecto si no se proporcionan)
    data['pesos'] = {
        'M': 1000000,
        'restricciones_duras': {
            'no_solapamiento_profesor': 1000000,
            'disponibilidad_profesor': 1000000,
            'no_solapamiento_aula': 1000000,
            'capacidad_aula': 1000000,
            'tipo_aula': 1000000,
            'carga_horaria': 1000000
        },
        'restricciones_blandas': {
            'minimizacion_huecos': 5,
            'turno_preferido_estudiante': 3,
            'preferencia_profesor': 2,
            'franjas_extremas': 1
        }
    }
    
    # 7. Metadatos
    data['metadata'] = new_data['metadata']
    
    return data

def random_assignment_for_course(course: Dict[str, Any], data: Dict[str, Any]) -> List[Tuple[Period, AulaID, str]]:
    """Genera una asignación aleatoria para un curso (periodo, aula, profesor)."""
    blocks = course['_blocks_needed']
    aula_type = course.get('aula_tipo', 'T')
    periods = data['periodos']
    aulas = data['_aulas_list']
    profesores = course.get('profesores', [])  # IDs
    
    # Filtrar aulas por tipo
    aulas_filtradas = [a for a in aulas if a['tipo'] == aula_type]
    if not aulas_filtradas:
        aulas_filtradas = aulas
    
    assignments = []
    for b in range(blocks):
        chosen_aula = random.choice(aulas_filtradas)['id']
        chosen_period = random.choice(periods)
        chosen_prof = random.choice(profesores) if profesores else ""
        assignments.append((chosen_period, chosen_aula, chosen_prof))
    
    return assignments

def random_individual(data: Dict[str, Any]) -> Dict[CourseCode, List[Tuple[Period, AulaID, str]]]:
    """Genera un individuo aleatorio (solución inicial)."""
    ind = {}
    for code, course in data['_courses_map'].items():
        ind[code] = random_assignment_for_course(course, data)
    return ind

def is_morning_period(period: Period) -> bool:
    """Verifica si un periodo es por la mañana."""
    try:
        timepart = period.split('_')[1]
        hour = int(timepart.split(':')[0])
        return hour < 12
    except:
        return True

def get_day_of_period(period: Period) -> str:
    """Extrae el día de un periodo."""
    return period.split('_')[0]

def evaluate(ind: Dict[str, List[Tuple[Period, AulaID, str]]], data: Dict[str, Any]) -> Tuple[float, Dict]:
    """Calcula el fitness de una solución."""
    M = data['pesos'].get('M', 1000000)
    hard_weights = data.get('pesos', {}).get('restricciones_duras', {})
    soft_weights = data.get('pesos', {}).get('restricciones_blandas', {})

    w_H = {
        'H2': hard_weights.get('no_solapamiento_profesor', M),
        'H3': hard_weights.get('disponibilidad_profesor', M),
        'H4': hard_weights.get('no_solapamiento_aula', M),
        'H5': hard_weights.get('capacidad_aula', M),
        'H6': hard_weights.get('tipo_aula', M),
        'H7': hard_weights.get('carga_horaria', M)
    }
    w_S = {
        'S1': soft_weights.get('minimizacion_huecos', 5),
        'S2': soft_weights.get('turno_preferido_estudiante', 3),
        'S6': soft_weights.get('franjas_extremas', 1)
    }

    cost_hard = 0
    cost_soft = 0
    diagnostics = defaultdict(int)

    course_map = data['_courses_map']
    prof_map = data['_profs_map']
    aulas_map = {a['id']: a for a in data['_aulas_list']}
    
    # H2: Conflicto de profesor
    prof_period_cnt = defaultdict(lambda: defaultdict(int))
    for ccode, assigns in ind.items():
        for (p, a, prof) in assigns:
            if prof:
                prof_period_cnt[prof][p] += 1
    
    for prof, permap in prof_period_cnt.items():
        for p, cnt in permap.items():
            if cnt > 1:
                cost_hard += (cnt - 1) * w_H['H2']
                diagnostics['H2_prof_conflict'] += (cnt - 1)

    # H3: Disponibilidad profesor
    for ccode, assigns in ind.items():
        for (p, a, prof) in assigns:
            if prof and prof in prof_map:
                available = set(prof_map[prof].get('disponibilidad', []))
                if available and p not in available:
                    cost_hard += w_H['H3']
                    diagnostics['H3_prof_unavailable'] += 1

    # H4: Conflicto de aula
    aula_period_cnt = defaultdict(lambda: defaultdict(int))
    for ccode, assigns in ind.items():
        for (p, a, prof) in assigns:
            aula_period_cnt[a][p] += 1
    
    for aula, permap in aula_period_cnt.items():
        for p, cnt in permap.items():
            if cnt > 1:
                cost_hard += (cnt - 1) * w_H['H4']
                diagnostics['H4_aula_conflict'] += (cnt - 1)

    # H5: Capacidad de aula
    for ccode, assigns in ind.items():
        est = course_map[ccode].get('estudiantes', 30)
        for (p, a, prof) in assigns:
            cap = aulas_map.get(a, {}).get('capacidad', 999)
            if est > cap:
                cost_hard += w_H['H5']
                diagnostics['H5_capacidad'] += 1

    # H6: Tipo de aula requerido
    for ccode, assigns in ind.items():
        required = course_map[ccode].get('aula_tipo', None)
        if required:
            for (p, a, prof) in assigns:
                if a not in aulas_map:
                    cost_hard += w_H['H6']
                    diagnostics['H6_missing_aula'] += 1
                    continue
                atype = aulas_map[a]['tipo']
                if required != atype:
                    cost_hard += w_H['H6']
                    diagnostics['H6_tipo_mismatch'] += 1

    # H7: Carga horaria del curso
    for ccode, assigns in ind.items():
        needed = course_map[ccode]['_blocks_needed']
        assigned = len(assigns)
        if assigned != needed:
            cost_hard += abs(assigned - needed) * w_H['H7']
            diagnostics['H7_blocks_mismatch'] += abs(assigned - needed)

    # Restricciones blandas
    # S1: Minimización de huecos por profesor
    prof_schedule = defaultdict(lambda: defaultdict(list))
    for ccode, assigns in ind.items():
        for (p, a, prof) in assigns:
            if prof:
                day = get_day_of_period(p)
                prof_schedule[prof][day].append(p)
    
    day_order = {}
    for p in data['periodos']:
        day = get_day_of_period(p)
        if day not in day_order:
            day_order[day] = []
        day_order[day].append(p)
    
    for d in day_order:
        order = [x for x in data['periodos'] if get_day_of_period(x) == d]
        day_order[d] = {v: i for i, v in enumerate(order)}
    
    for prof, days in prof_schedule.items():
        for day, plist in days.items():
            if not plist or day not in day_order:
                continue
            idxs = sorted(day_order[day].get(p, 0) for p in plist)
            if not idxs:
                continue
            span = idxs[-1] - idxs[0] + 1
            gaps = span - len(idxs)
            cost_soft += gaps * w_S['S1']
            diagnostics['S1_gaps'] += gaps

    # S2: Turno preferido
    pref_shift = data['preferencias'].get('turno_preferido', 'morning')
    for ccode, assigns in ind.items():
        for (p, a, prof) in assigns:
            if pref_shift == 'morning' and not is_morning_period(p):
                cost_soft += w_S['S2']
                diagnostics['S2_wrong_shift'] += 1

    fitness = cost_hard + cost_soft
    diagnostics['hard'] = cost_hard
    diagnostics['soft'] = cost_soft
    diagnostics['fitness'] = fitness
    return fitness, diagnostics

def repair(ind: Dict[str, List[Tuple[Period, AulaID, str]]], data: Dict[str, Any]) -> Dict[str, List[Tuple[Period, AulaID, str]]]:
    """Repara violaciones de restricciones duras."""
    new = copy.deepcopy(ind)
    aulas = data['_aulas_list']
    courses = data['_courses_map']

    # Reparar conflictos de aula
    aula_period = defaultdict(lambda: defaultdict(list))
    for ccode, assigns in new.items():
        for idx, (p, a, prof) in enumerate(assigns):
            aula_period[a][p].append((ccode, idx))
    
    for aula, permap in aula_period.items():
        for p, lst in permap.items():
            if len(lst) <= 1:
                continue
            
            a_type = None
            for a in aulas:
                if a['id'] == aula:
                    a_type = a['tipo']
                    break
            
            candidates = [aa['id'] for aa in aulas if aa['tipo'] == a_type and aa['id'] != aula]
            
            for (ccode, idx) in lst[1:]:
                if candidates:
                    new_a = random.choice(candidates)
                    old_p, old_a, old_prof = new[ccode][idx]
                    new[ccode][idx] = (old_p, new_a, old_prof)

    return new

def tournament_selection(pop: List[Dict], fitnesses: List[float], k=TOURNAMENT_K) -> Dict:
    """Selección por torneo."""
    i = random.randrange(len(pop))
    best = i
    best_fit = fitnesses[i]
    for _ in range(k - 1):
        j = random.randrange(len(pop))
        if fitnesses[j] < best_fit:
            best = j
            best_fit = fitnesses[j]
    return copy.deepcopy(pop[best])

def crossover(parent1: Dict, parent2: Dict, data: Dict[str, Any]) -> Tuple[Dict, Dict]:
    """Operador de cruce."""
    child1 = {}
    child2 = {}
    for ccode in data['_courses_map'].keys():
        if random.random() < 0.5:
            child1[ccode] = copy.deepcopy(parent1[ccode])
            child2[ccode] = copy.deepcopy(parent2[ccode])
        else:
            child1[ccode] = copy.deepcopy(parent2[ccode])
            child2[ccode] = copy.deepcopy(parent1[ccode])
    return child1, child2

def mutate(ind: Dict, data: Dict[str, Any], mut_prob=MUTATION_PROB) -> Dict:
    """Operador de mutación."""
    new = copy.deepcopy(ind)
    periods = data['periodos']
    aulas = data['_aulas_list']
    
    for ccode in new.keys():
        if random.random() < mut_prob:
            assigns = new[ccode]
            if not assigns:
                continue
            
            idx = random.randrange(len(assigns))
            typ = random.choice([1, 2, 3])
            old_p, old_a, old_prof = assigns[idx]
            if typ == 3:  # Cambiar profesor
                course_info = data['_courses_map'][ccode]
                profs = course_info.get('profesores', [])  # IDs
                if profs:
                    new_prof = random.choice(profs)
                    new[ccode][idx] = (old_p, old_a, new_prof)
    return new

def run_ga(data: Dict[str, Any]):
    """Ejecuta el algoritmo genético."""
    population = [random_individual(data) for _ in range(POP_SIZE)]
    population = [repair(ind, data) for ind in population]
    
    fitnesses = []
    diagnostics_list = []
    for ind in population:
        f, d = evaluate(ind, data)
        fitnesses.append(f)
        diagnostics_list.append(d)
    
    best_idx = min(range(len(population)), key=lambda i: fitnesses[i])
    best = copy.deepcopy(population[best_idx])
    best_fit = fitnesses[best_idx]
    
    print(f"Init best fitness: {best_fit}, diag: {diagnostics_list[best_idx]}", file=sys.stderr)

    for gen in range(1, GENERATIONS + 1):
        newpop = [copy.deepcopy(best)]
        
        while len(newpop) < POP_SIZE:
            p1 = tournament_selection(population, fitnesses)
            p2 = tournament_selection(population, fitnesses)
            
            if random.random() < CROSSOVER_PROB:
                c1, c2 = crossover(p1, p2, data)
            else:
                c1, c2 = copy.deepcopy(p1), copy.deepcopy(p2)
            
            c1 = mutate(c1, data)
            c2 = mutate(c2, data)
            c1 = repair(c1, data)
            c2 = repair(c2, data)
            
            newpop.append(c1)
            if len(newpop) < POP_SIZE:
                newpop.append(c2)
        
        population = newpop
        fitnesses = []
        diagnostics_list = []
        for ind in population:
            f, d = evaluate(ind, data)
            fitnesses.append(f)
            diagnostics_list.append(d)
        
        cur_best_idx = min(range(len(population)), key=lambda i: fitnesses[i])
        if fitnesses[cur_best_idx] < best_fit:
            best_fit = fitnesses[cur_best_idx]
            best = copy.deepcopy(population[cur_best_idx])
            print(f"[Gen {gen}] New best fitness: {best_fit}", file=sys.stderr)
        
        if gen % 50 == 0:
            avg = sum(fitnesses) / len(fitnesses)
            print(f"Gen {gen}: best {best_fit}, avg {avg:.2f}", file=sys.stderr)
    
    f_best, d_best = evaluate(best, data)
    print("FINAL BEST fitness:", f_best, file=sys.stderr)
    print("Diagnostics:", dict(d_best), file=sys.stderr)
    return best, d_best

def convert_solution_to_json(sol: Dict[str, List[Tuple[Period, AulaID, str]]], data: Dict[str, Any]) -> Dict[str, Any]:
    """Convierte la solución al formato JSON de salida."""
    course_map = data['_courses_map']
    aulas_map = {a['id']: a for a in data['_aulas_list']}
    
    schedule_entries = []
    
    for ccode, assigns in sol.items():
        course_info = course_map[ccode]
        
        for (period, aula, profesor) in assigns:
            # Parsear el periodo "DIA_HH:MM_HH:MM"
            parts = period.split("_")
            day = parts[0]
            start_time = parts[1]
            end_time = parts[2]
            
            # Determinar tipo de salón
            aula_info = aulas_map.get(aula, {})
            room_type = "THEORY" if aula_info.get('tipo') == 'T' else "LAB"
            
            entry = {
                "course_code": course_info.get('original_code', ccode),
                "course_name": course_info['nombre'],
                "year": course_info['year'],
                "day_of_week": day,
                "start_time": start_time,
                "end_time": end_time,
                "classroom_code": aula,
                "classroom_type": room_type,
                "professor_id": profesor,  # Usar ID
                "student_count": course_info.get('estudiantes', 0)
            }
            schedule_entries.append(entry)
    
    # Ordenar por día y hora
    day_order = {"LUN": 1, "MAR": 2, "MIE": 3, "JUE": 4, "VIE": 5, "SAB": 6, "DOM": 7}
    schedule_entries.sort(key=lambda x: (day_order.get(x['day_of_week'], 8), x['start_time'], x['course_code']))
    
    return {
        "metadata": data.get('metadata', {}),
        "schedule": schedule_entries,
        "statistics": {
            "total_courses": len(set(course_map[c].get('original_code', c) for c in sol.keys())),
            "total_sessions": sum(len(assigns) for assigns in sol.values())
        }
    }

def main():
    global POP_SIZE, GENERATIONS
    parser = argparse.ArgumentParser()
    parser.add_argument('--pop', type=int, default=POP_SIZE)
    parser.add_argument('--gens', type=int, default=GENERATIONS)
    args = parser.parse_args()
    
    POP_SIZE = args.pop
    GENERATIONS = args.gens
    
    # Leer JSON desde stdin
    input_data = json.load(sys.stdin)
    
    # Convertir al formato interno
    data = convert_input_format(input_data)
    
    # Ejecutar GA
    best, diag = run_ga(data)
    
    # Convertir solución a JSON
    output_json = convert_solution_to_json(best, data)
    
    # Imprimir JSON a stdout
    print(json.dumps(output_json, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()