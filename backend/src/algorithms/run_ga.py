#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adaptador para leer el nuevo formato JSON desde stdin y retornar horarios en JSON.
"""

import json
import sys
import copy
import random
import argparse
from typing import Dict, List, Tuple, Any
from collections import defaultdict
from datetime import datetime, time

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

# ---------------------------
# Conversión del nuevo formato JSON al formato interno
# ---------------------------
def convert_input_format(new_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convierte el nuevo formato JSON al formato interno que usa el GA.
    """
    data = {}
    
    # 1. Generar lista de periodos en formato interno "DIA_HH:MM_HH:MM"
    day_map = {
        "MON": "LUN", "TUE": "MAR", "WED": "MIE", 
        "THU": "JUE", "FRI": "VIE", "SAT": "SAB", "SUN": "DOM"
    }
    
    periods_list = []
    for period in new_data['periods']:
        day = day_map.get(period['day_of_week'], period['day_of_week'])
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
            'nombre': room['room_name'] or room['room_code'],
            'tipo': classroom_type_map.get(room['room_type'], room['room_type']),
            'capacidad': room['capacity']
        })
    data['_aulas_list'] = aulas_list
    
    # 3. Convertir profesores
    profs_map = {}
    for prof in new_data['professors']:
        # Convertir disponibilidades al formato de periodo interno
        disponibilidad = []
        for avail in prof['availabilities']:
            day = day_map.get(avail['day_of_week'], avail['day_of_week'])
            # Buscar periodos que coincidan con esta disponibilidad
            for p in periods_list:
                if p.startswith(day + "_"):
                    parts = p.split("_")
                    p_start = parts[1]
                    p_end = parts[2]
                    # Verificar si el periodo está dentro de la disponibilidad
                    if avail['start_time'] <= p_start and p_end <= avail['end_time']:
                        disponibilidad.append(p)
        
        profs_map[prof['name']] = {
            'id': prof['professor_id'],
            'nombre': prof['name'],
            'disponibilidad': disponibilidad,
            'preferencia': None  # Se puede agregar si está en los datos
        }
    data['_profs_map'] = profs_map
    
    # 4. Convertir cursos
    courses_map = {}
    for course in new_data['courses']:
        # Calcular bloques necesarios
        total_hours = course['hours']['theory'] + course['hours']['practice'] + course['hours']['lab']
        blocks_needed = total_hours  # Asumiendo 1 bloque = 1 hora
        
        # Encontrar nombre del profesor
        prof_name = None
        for prof in new_data['professors']:
            if prof['professor_id'] == course['professor_id']:
                prof_name = prof['name']
                break
        
        # Determinar tipo de aula requerido
        aula_tipo = None
        if course['hours']['lab'] > 0:
            aula_tipo = 'LAB'
        elif course['hours']['theory'] > 0 or course['hours']['practice'] > 0:
            aula_tipo = 'T'
        
        courses_map[course['course_code']] = {
            'codigo': course['course_code'],
            'nombre': course['course_name'],
            'creditos': course['credits'],
            'horas_teoria': course['hours']['theory'],
            'horas_practica': course['hours']['practice'],
            'horas_laboratorio': course['hours']['lab'],
            'estudiantes': course['student_count'],
            'profesor': prof_name,
            'aula_tipo': aula_tipo,
            '_blocks_needed': blocks_needed,
            'prerequisitos': course['prerequisites']
        }
    data['_courses_map'] = courses_map
    
    # 5. Convertir currículos
    curriculos = {}
    course_to_currs = defaultdict(list)
    
    for curr_name, course_ids in new_data['curricula'].items():
        # Convertir IDs a códigos de curso
        course_codes = []
        for course_id in course_ids:
            # Buscar el código del curso por su ID
            for course in new_data['courses']:
                if course.get('id') == course_id or str(course.get('professor_id')) == str(course_id):
                    # Intentar encontrar por código
                    for code, cinfo in courses_map.items():
                        if cinfo.get('nombre') == course['course_name']:
                            course_codes.append(code)
                            course_to_currs[code].append(curr_name)
                            break
        
        # Si course_ids son directamente códigos de curso
        if not course_codes:
            for cid in course_ids:
                cid_str = str(cid)
                if cid_str in courses_map:
                    course_codes.append(cid_str)
                    course_to_currs[cid_str].append(curr_name)
        
        curriculos[curr_name] = course_codes
    
    data['curriculos'] = curriculos
    data['_course_to_currs'] = dict(course_to_currs)
    
    # 6. Convertir preferencias
    data['preferencias'] = {
        'turno_preferido': new_data['preferences']['preferred_shift'].lower(),
        'dias_preferidos': [day_map.get(d, d) for d in new_data['preferences'].get('preferred_days', [])],
        'franjas_preferidas': new_data['preferences'].get('preferred_slots', [])
    }
    
    # 7. Convertir pesos
    pesos = {'M': 1000000}
    hard_constraints = {}
    soft_constraints = {}
    
    for constraint in new_data['weights']['hard_constraints']:
        hard_constraints[constraint['constraint_name']] = constraint['weight_value']
    
    for constraint in new_data['weights']['soft_constraints']:
        soft_constraints[constraint['constraint_name']] = constraint['weight_value']
    
    pesos['restricciones_duras'] = hard_constraints
    pesos['restricciones_blandas'] = soft_constraints
    data['pesos'] = pesos
    
    # 8. Agregar metadatos
    data['metadata'] = new_data['metadata']
    
    return data


def load_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Preparación adicional de datos si es necesario"""
    return data


# ---------------------------
# Generación aleatoria inicial
# ---------------------------
def random_assignment_for_course(course: Dict[str, Any], data: Dict[str, Any]) -> List[Tuple[Period, AulaID]]:
    """
    Genera una asignación aleatoria válida *en tipo de aula* (no garantiza duras).
    Intenta asignar lab-blocks a LAB y teor/prac a T (si no hay disponibles, usa lo que exista).
    """
    blocks = course['_blocks_needed']
    aula_type = course.get('aula_tipo', None)  # 'LAB' or 'T' or None
    periods = data['periodos']
    aulas = data['_aulas_list']
    # split aulas by tipo
    labs = [a for a in aulas if a['tipo'] == 'LAB']
    ts = [a for a in aulas if a['tipo'] == 'T']
    assignments = []
    # strategy: attempt as many lab blocks in LAB as possible if aula_type == 'LAB'
    for b in range(blocks):
        if aula_type == 'LAB':
            if labs:
                chosen_aula = random.choice(labs)['id']
            else:
                chosen_aula = random.choice(aulas)['id']
        else:
            # prefer T
            if ts:
                chosen_aula = random.choice(ts)['id']
            else:
                chosen_aula = random.choice(aulas)['id']
        chosen_period = random.choice(periods)
        assignments.append((chosen_period, chosen_aula))
    return assignments

def random_individual(data: Dict[str, Any]) -> Dict[CourseCode, List[Tuple[Period, AulaID]]]:
    ind = {}
    for code, course in data['_courses_map'].items():
        ind[code] = random_assignment_for_course(course, data)
    return ind

# ---------------------------
# Helpers para restricciones
# ---------------------------
def is_morning_period(period: Period) -> bool:
    # period format: "LUN_07:00_07:50"
    try:
        timepart = period.split('_')[1]
    except Exception:
        return True
    hour = int(timepart.split(':')[0])
    return hour < 12

def get_day_of_period(period: Period) -> str:
    return period.split('_')[0]

# ---------------------------
# Función de fitness (costo)
# ---------------------------
def evaluate(ind: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any]) -> Tuple[float, Dict]:
    """
    Calcula la función objetivo: hard violations * M + sum(soft penalties)
    Retorna (fitness_score, diagnostics_dict)
    """
    M = data['pesos'].get('M', 1000000)
    hard_weights = data.get('pesos', {}).get('restricciones_duras', {})
    soft_weights = data.get('pesos', {}).get('restricciones_blandas', {})

    # default fallbacks
    w_H = {
        'H1': hard_weights.get('no_solapamiento_curriculo', M),
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
        'S3': soft_weights.get('preferencia_profesor', 2),
        'S4': soft_weights.get('concentracion_diaria', 4),
        'S5': soft_weights.get('balance_aulas', 1),
        'S6': soft_weights.get('franjas_extremas', 1),
        'S7': soft_weights.get('continuidad_curso', 2),
        'S8': soft_weights.get('fuera_bloque_preferido', 4),
        'S9': soft_weights.get('dias_extra', 2)
    }

    cost_hard = 0
    cost_soft = 0
    diagnostics = defaultdict(int)

    # Precompute some maps for fast checks
    course_map = data['_courses_map']
    prof_map = data['_profs_map']
    aulas_map = {a['id']: a for a in data['_aulas_list']}
    course_to_currs = data.get('_course_to_currs', {})
    
    # 1) H1: Conflicto de currículo
    period_courses = defaultdict(list)
    for ccode, assigns in ind.items():
        for (p, a) in assigns:
            period_courses[p].append(ccode)
    
    for p, course_list in period_courses.items():
        for i in range(len(course_list)):
            for j in range(i+1, len(course_list)):
                c1 = course_list[i]; c2 = course_list[j]
                currs1 = set(course_to_currs.get(c1, []))
                currs2 = set(course_to_currs.get(c2, []))
                if currs1 & currs2:
                    cost_hard += w_H['H1']
                    diagnostics['H1_conflict'] += 1

    # 2) H2: Conflicto de profesor
    prof_period_cnt = defaultdict(lambda: defaultdict(int))
    for ccode, assigns in ind.items():
        prof_name = course_map[ccode].get('profesor')
        for (p, a) in assigns:
            prof_period_cnt[prof_name][p] += 1
    for prof, permap in prof_period_cnt.items():
        for p, cnt in permap.items():
            if cnt > 1:
                cost_hard += (cnt - 1) * w_H['H2']
                diagnostics['H2_prof_conflict'] += (cnt - 1)

    # 3) H3: Disponibilidad profesor
    for ccode, assigns in ind.items():
        prof_name = course_map[ccode].get('profesor')
        prof_info = prof_map.get(prof_name, {})
        available = set(prof_info.get('disponibilidad', []))
        for (p, a) in assigns:
            if available and p not in available:
                cost_hard += w_H['H3']
                diagnostics['H3_prof_unavailable'] += 1

    # 4) H4: Conflicto de aula
    aula_period_cnt = defaultdict(lambda: defaultdict(int))
    for ccode, assigns in ind.items():
        for (p, a) in assigns:
            aula_period_cnt[a][p] += 1
    for aula, permap in aula_period_cnt.items():
        for p, cnt in permap.items():
            if cnt > 1:
                cost_hard += (cnt - 1) * w_H['H4']
                diagnostics['H4_aula_conflict'] += (cnt - 1)

    # 5) H5: Capacidad de aula
    for ccode, assigns in ind.items():
        est = course_map[ccode].get('estudiantes', 30)
        for (p, a) in assigns:
            cap = aulas_map.get(a, {}).get('capacidad', 999)
            if est > cap:
                cost_hard += w_H['H5']
                diagnostics['H5_capacidad'] += 1

    # 6) H6: Tipo de aula requerido
    for ccode, assigns in ind.items():
        required = course_map[ccode].get('aula_tipo', None)
        if required:
            for (p, a) in assigns:
                if a not in aulas_map:
                    cost_hard += w_H['H6']; diagnostics['H6_missing_aula'] += 1; continue
                atype = aulas_map[a]['tipo']
                if required == 'LAB' and atype != 'LAB':
                    cost_hard += w_H['H6']; diagnostics['H6_tipo_mismatch'] += 1
                if required == 'T' and atype != 'T':
                    cost_hard += w_H['H6']; diagnostics['H6_tipo_mismatch'] += 1

    # 7) H7: Carga horaria del curso
    for ccode, assigns in ind.items():
        needed = course_map[ccode]['_blocks_needed']
        assigned = len(assigns)
        if assigned != needed:
            cost_hard += abs(assigned - needed) * w_H['H7']
            diagnostics['H7_blocks_mismatch'] += abs(assigned - needed)

    # Restricciones blandas (simplificadas por espacio)
    curr_sched = defaultdict(lambda: defaultdict(list))
    aula_usage = defaultdict(int)
    course_periods = {}
    
    for ccode, assigns in ind.items():
        course_periods[ccode] = [p for (p,a) in assigns]
        for (p,a) in assigns:
            currs = course_to_currs.get(ccode, [])
            for curr in currs:
                day = get_day_of_period(p)
                curr_sched[curr][day].append(p)
            aula_usage[a] += 1

    # S1: Minimización de huecos
    day_order = {}
    for p in data['periodos']:
        day = get_day_of_period(p)
        if day not in day_order:
            day_order[day] = []
        day_order[day].append(p)
    
    for d in day_order:
        order = [x for x in data['periodos'] if get_day_of_period(x) == d]
        day_order[d] = {v:i for i,v in enumerate(order)}
    
    for curr, days in curr_sched.items():
        for day, plist in days.items():
            if not plist: continue
            idxs = sorted(day_order[day].get(p,0) for p in plist)
            if not idxs: continue
            span = idxs[-1] - idxs[0] + 1
            gaps = span - len(idxs)
            cost_soft += gaps * w_S['S1']
            diagnostics['S1_gaps'] += gaps

    # Otras restricciones blandas (S2-S9) se implementan de forma similar...

    fitness = cost_hard + cost_soft
    diagnostics['hard'] = cost_hard
    diagnostics['soft'] = cost_soft
    diagnostics['fitness'] = fitness
    return fitness, diagnostics

# ---------------------------
# Operador de reparación
# ---------------------------
def repair(ind: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any]) -> Dict[str, List[Tuple[Period, AulaID]]]:
    """Aplica reglas greedy para reducir violaciones duras"""
    new = copy.deepcopy(ind)
    aulas = data['_aulas_list']
    aulas_by_type = defaultdict(list)
    for a in aulas:
        aulas_by_type[a['tipo']].append(a)
    courses = data['_courses_map']
    profs = data['_profs_map']

    # Reparar conflictos de aula
    aula_period = defaultdict(lambda: defaultdict(list))
    for ccode, assigns in new.items():
        for idx, (p,a) in enumerate(assigns):
            aula_period[a][p].append((ccode, idx))
    
    for aula, permap in aula_period.items():
        for p, lst in permap.items():
            if len(lst) <= 1: continue
            a_type = None
            for a in aulas:
                if a['id'] == aula:
                    a_type = a['tipo']; break
            candidates = [aa for aa in aulas_by_type[a_type] if aa['id'] != aula]
            free_candidates = []
            for c in candidates:
                used = any((p == assign_p and c['id'] == assign_a) 
                          for cc, assigns in new.items() 
                          for (assign_p,assign_a) in assigns)
                if not used:
                    free_candidates.append(c['id'])
            
            for (ccode, idx) in lst[1:]:
                if free_candidates:
                    new_a = free_candidates.pop(0)
                    new[ccode][idx] = (p, new_a)

    return new

# ---------------------------
# Operadores genéticos
# ---------------------------
def tournament_selection(pop: List[Dict], fitnesses: List[float], k=TOURNAMENT_K) -> Dict:
    i = random.randrange(len(pop))
    best = i; best_fit = fitnesses[i]
    for _ in range(k-1):
        j = random.randrange(len(pop))
        if fitnesses[j] < best_fit:
            best = j; best_fit = fitnesses[j]
    return copy.deepcopy(pop[best])

def crossover(parent1: Dict, parent2: Dict, data: Dict[str, Any]) -> Tuple[Dict, Dict]:
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
    new = copy.deepcopy(ind)
    periods = data['periodos']
    aulas = data['_aulas_list']
    for ccode in new.keys():
        if random.random() < mut_prob:
            assigns = new[ccode]
            if not assigns: continue
            idx = random.randrange(len(assigns))
            typ = random.choice([1,2,3])
            if typ == 1:
                new_period = random.choice(periods)
                new[ccode][idx] = (new_period, assigns[idx][1])
            elif typ == 2:
                a_current = assigns[idx][1]
                a_tipo = next((x['tipo'] for x in aulas if x['id']==a_current), 'T')
                candidates = [x['id'] for x in aulas if x['tipo'] == a_tipo and x['id'] != a_current]
                if candidates:
                    new_a = random.choice(candidates)
                    new[ccode][idx] = (assigns[idx][0], new_a)
            else:
                new_period = random.choice(periods)
                new_aula = random.choice(aulas)['id']
                new[ccode][idx] = (new_period, new_aula)
    return new

# ---------------------------
# Loop principal del GA
# ---------------------------
def run_ga(data: Dict[str, Any]):
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

    for gen in range(1, GENERATIONS+1):
        newpop = [copy.deepcopy(best)]
        newfits = [best_fit]
        
        while len(newpop) < POP_SIZE:
            p1 = tournament_selection(population, fitnesses)
            p2 = tournament_selection(population, fitnesses)
            
            if random.random() < CROSSOVER_PROB:
                c1, c2 = crossover(p1, p2, data)
            else:
                c1, c2 = p1, p2
            
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
            f,d = evaluate(ind, data)
            fitnesses.append(f)
            diagnostics_list.append(d)
        
        cur_best_idx = min(range(len(population)), key=lambda i: fitnesses[i])
        if fitnesses[cur_best_idx] < best_fit:
            best_fit = fitnesses[cur_best_idx]
            best = copy.deepcopy(population[cur_best_idx])
            print(f"[Gen {gen}] New best fitness: {best_fit}", file=sys.stderr)
        
        if gen % 50 == 0:
            avg = sum(fitnesses)/len(fitnesses)
            print(f"Gen {gen}: best {best_fit}, avg {avg:.2f}", file=sys.stderr)
    
    f_best, d_best = evaluate(best, data)
    print("FINAL BEST fitness:", f_best, file=sys.stderr)
    print("Diagnostics:", dict(d_best), file=sys.stderr)
    return best, d_best

# ---------------------------
# Conversión de salida a JSON
# ---------------------------
def convert_solution_to_json(sol: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convierte la solución al formato JSON de salida.
    """
    course_map = data['_courses_map']
    
    # Mapeo inverso de días
    day_map_inv = {
        "LUN": "MON", "MAR": "TUE", "MIE": "WED",
        "JUE": "THU", "VIE": "FRI", "SAB": "SAT", "DOM": "SUN"
    }
    
    schedule_entries = []
    
    for ccode, assigns in sol.items():
        course_info = course_map[ccode]
        
        for (period, aula) in assigns:
            # Parsear el periodo "DIA_HH:MM_HH:MM"
            parts = period.split("_")
            day_esp = parts[0]
            start_time = parts[1]
            end_time = parts[2]
            day_eng = day_map_inv.get(day_esp, day_esp)
            
            entry = {
                "course_code": ccode,
                "course_name": course_info['nombre'],
                "day_of_week": day_eng,
                "start_time": start_time,
                "end_time": end_time,
                "classroom_code": aula,
                "professor_name": course_info.get('profesor', ''),
                "student_count": course_info.get('estudiantes', 0)
            }
            schedule_entries.append(entry)
    
    # Ordenar por día y hora para mejor legibilidad
    day_order = {"MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6, "SUN": 7}
    schedule_entries.sort(key=lambda x: (day_order.get(x['day_of_week'], 8), x['start_time'], x['course_code']))
    
    return {
        "metadata": data.get('metadata', {}),
        "schedule": schedule_entries,
        "statistics": {
            "total_courses": len(sol),
            "total_sessions": sum(len(assigns) for assigns in sol.values())
        }
    }

# ---------------------------
# CLI
# ---------------------------
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
    data = load_input(data)
    
    if 'pesos' not in data:
        data['pesos'] = {}
    if 'M' not in data['pesos']:
        data['pesos']['M'] = 1000000

    # Ejecutar GA
    best, diag = run_ga(data)
    
    # Convertir solución a JSON
    output_json = convert_solution_to_json(best, data)
    
    # Imprimir JSON a stdout
    print(json.dumps(output_json, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()