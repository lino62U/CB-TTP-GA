#!/usr/bin/env python3
"""
ga_timetabling_unsa.py

Algoritmo Genético para University Course Timetabling (CB-UCTP / UNSA).
Lee un JSON de entrada con la plantilla que generamos y busca un horario minimizando
penalizaciones dadas por restricciones duras y blandas.

Uso:
    python3 main.py --input input.json

Notas:
- Cada bloque en los cursos se modela como 1 "slot" (duración: 50 min).
- El número de bloques por curso = teoricas + practicas + laboratorio (tal como están en el JSON).
- El script intenta asignar bloques de tipo LAB ó TEOR (T).
"""

import json
import random
import argparse
import copy
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Any

# ---------------------------
# Parámetros GA (puedes tunear)
# ---------------------------
POP_SIZE = 120
GENERATIONS = 600
TOURNAMENT_K = 3
CROSSOVER_PROB = 0.85
MUTATION_PROB = 0.25
SEED = 42
random.seed(SEED)

# ---------------------------
# Utilidades y tipos
# ---------------------------
Period = str
AulaID = str
CourseCode = str
Professor = str

# ---------------------------
# Carga y preprocesamiento
# ---------------------------
def load_input(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # build quick lookup structures
    # aulas: flatten into list of dicts with type field
    aulas = []
    for t in data.get('aulas', {}).get('teoricas', []):
        aulas.append({'id': t['id'], 'tipo': 'T', 'capacidad': t.get('capacidad', 40)})
    for lab in data.get('aulas', {}).get('laboratorios', []):
        aulas.append({'id': lab['id'], 'tipo': 'LAB', 'capacidad': lab.get('capacidad', 25)})
    data['_aulas_list'] = aulas

    # map professors availability into set of periods for fast check
    profs = {}
    profs_raw = data.get('profesores', {})
    # input may be either dict or list—support both:
    if isinstance(profs_raw, dict):
        for name, info in profs_raw.items():
            profs[name] = info
    else:
        # list
        for info in profs_raw:
            name = info.get('nombre') or info.get('id') or info.get('correo', '')
            profs[name] = info
    data['_profs_map'] = profs

    # courses
    courses = {}
    for c in data.get('cursos', []):
        # compute total blocks required
        hrs = c.get('horas') or {}
        # support older field names
        teor = hrs.get('teoricas') or hrs.get('teoria') or hrs.get('teor') or 0
        prac = hrs.get('practicas') or hrs.get('practica') or hrs.get('prac') or 0
        lab = hrs.get('laboratorio') or hrs.get('lab') or 0
        total_blocks = int(round(teor + prac + lab))  # each "hora" is a block in our model
        c['_blocks_needed'] = max(1, total_blocks)
        c['_teor'] = int(teor)
        c['_prac'] = int(prac)
        c['_lab'] = int(lab)
        courses[c['codigo']] = c
    data['_courses_map'] = courses

    # curriculos
    data['_curriculos_map'] = data.get('curriculos', {})

    # create quick mapping course->curriculo(s)
    course_to_currs = defaultdict(list)
    for curr_name, course_list in data['_curriculos_map'].items():
        for cc in course_list:
            course_to_currs[cc].append(curr_name)
    data['_course_to_currs'] = dict(course_to_currs)

    # Opcional: Validar que cursos en profs['cursos'] coincidan (para consistencia)
    for prof_name, prof_info in profs.items():
        prof_courses = prof_info.get('cursos', [])
        for course_code in prof_courses:
            if course_code in courses:
                if courses[course_code].get('profesor') != prof_name:
                    print(f"Advertencia: Profesor {prof_name} listado para {course_code}, pero asignado a {courses[course_code].get('profesor')}")
    return data

# ---------------------------
# Representación de la solución
# ---------------------------
# Representamos una solución como:
#   dict course_code -> list of assignments (len == blocks_needed)
# where each assignment is (period, aula_id)
# e.g.
#   sol['1705265'] = [('LUN_08:50_09:40','LAB1'), ('MAR_09:40_10:30','LAB1'), ...]

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
# Helpers for constraints
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
# Fitness (cost) function
# ---------------------------

def evaluate(ind: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any]) -> float:
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
    # 1) H1: Conflicto de currículo: si dos cursos del mismo currículo en mismo periodo
    # Build per-period set of courses
    period_courses = defaultdict(list)
    for ccode, assigns in ind.items():
        for (p, a) in assigns:
            period_courses[p].append(ccode)
    # For each period, check curriculum conflicts
    for p, course_list in period_courses.items():
        # if two courses share a curriculum, penalize (hard)
        for i in range(len(course_list)):
            for j in range(i+1, len(course_list)):
                c1 = course_list[i]; c2 = course_list[j]
                currs1 = set(course_to_currs.get(c1, []))
                currs2 = set(course_to_currs.get(c2, []))
                if currs1 & currs2:
                    cost_hard += w_H['H1']
                    diagnostics['H1_conflict'] += 1

    # 2) H2: Conflicto de profesor: same professor two classes same period
    # build professor->period->count
    prof_period_cnt = defaultdict(lambda: defaultdict(int))
    for ccode, assigns in ind.items():
        prof_name = course_map[ccode].get('profesor')
        for (p, a) in assigns:
            prof_period_cnt[prof_name][p] += 1
    for prof, permap in prof_period_cnt.items():
        for p, cnt in permap.items():
            if cnt > 1:
                # each extra class beyond 1 is a conflict
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

    # 4) H4: Conflicto de aula (aula occupied twice same period)
    aula_period_cnt = defaultdict(lambda: defaultdict(int))
    for ccode, assigns in ind.items():
        for (p, a) in assigns:
            aula_period_cnt[a][p] += 1
    for aula, permap in aula_period_cnt.items():
        for p, cnt in permap.items():
            if cnt > 1:
                cost_hard += (cnt - 1) * w_H['H4']
                diagnostics['H4_aula_conflict'] += (cnt - 1)

    # 5) H5: Capacidad de aula: for each assignment, check students <= capacity
    for ccode, assigns in ind.items():
        est = course_map[ccode].get('estudiantes', 30)
        for (p, a) in assigns:
            cap = aulas_map.get(a, {}).get('capacidad', 999)
            if est > cap:
                cost_hard += w_H['H5']
                diagnostics['H5_capacidad'] += 1

    # 6) H6: Tipo de aula requerido
    for ccode, assigns in ind.items():
        required = course_map[ccode].get('aula_tipo', None)  # 'LAB' or 'T'
        if required:
            for (p, a) in assigns:
                if a not in aulas_map:
                    cost_hard += w_H['H6']; diagnostics['H6_missing_aula'] += 1; continue
                atype = aulas_map[a]['tipo']
                if required == 'LAB' and atype != 'LAB':
                    cost_hard += w_H['H6']; diagnostics['H6_tipo_mismatch'] += 1
                if required == 'T' and atype != 'T':
                    # if required T but assigned lab => allowed but penalize as soft? we treat as hard
                    cost_hard += w_H['H6']; diagnostics['H6_tipo_mismatch'] += 1

    # 7) H7: Carga horaria del curso => ensure exactly blocks assigned equals required
    for ccode, assigns in ind.items():
        needed = course_map[ccode]['_blocks_needed']
        assigned = len(assigns)
        if assigned != needed:
            cost_hard += abs(assigned - needed) * w_H['H7']
            diagnostics['H7_blocks_mismatch'] += abs(assigned - needed)

    # ----------------------------
    # Soft constraints approximations
    # ----------------------------
    # Precompute curriculum schedules: for each currículo and day, collect periods assigned
    curr_sched = defaultdict(lambda: defaultdict(list))  # curr -> day -> list periods
    # also count aula usages
    aula_usage = defaultdict(int)
    # per course sessions list of periods
    course_periods = {}
    for ccode, assigns in ind.items():
        course_periods[ccode] = [p for (p,a) in assigns]
        for (p,a) in assigns:
            # curriculum mapping
            currs = course_to_currs.get(ccode, [])
            for curr in currs:
                day = get_day_of_period(p)
                curr_sched[curr][day].append(p)
            aula_usage[a] += 1

    # S1: horarios compactos por currículo (minimizar huecos)
    # For each curr, each day: compute min-max count and subtract number of assigned blocks => count gaps
    # approximate mapping period->index per day
    day_order = {}
    # build order index map for each day for quick arithmetics
    for p in data['periodos']:
        day = get_day_of_period(p)
        if day not in day_order:
            day_order[day] = []
        # use full period string as order
        day_order[day].append(p)
    # ensure order preserved as in data['periodos']
    for d in day_order:
        # keep original ordering appearing in data['periodos']
        order = [x for x in data['periodos'] if get_day_of_period(x) == d]
        day_order[d] = {v:i for i,v in enumerate(order)}
    # now count gaps
    for curr, days in curr_sched.items():
        for day, plist in days.items():
            if not plist: continue
            idxs = sorted(day_order[day].get(p,0) for p in plist)
            if not idxs: continue
            span = idxs[-1] - idxs[0] + 1
            gaps = span - len(idxs)
            cost_soft += gaps * w_S['S1']
            diagnostics['S1_gaps'] += gaps

    # S2: preferencia de bloque (mañana/tarde) por currículo
    pref_turno = data.get('preferencias', {}).get('turno_preferido', 'mañana')
    for curr, days in curr_sched.items():
        p_m = 0; p_t = 0
        for day, plist in days.items():
            for p in plist:
                if is_morning_period(p): p_m += 1
                else: p_t += 1
        # penaliza mezcla: min(p_m,p_t) * w2
        cost_soft += min(p_m, p_t) * w_S['S2']
        diagnostics['S2_mixed'] += min(p_m,p_t)

    # S3: preferencia del profesor (ya H3 penaliza indisponibilidad).
    # Additionally penalize if assignment is in same day as blocked preference? We approximate by penalizing if assignment time not in pref set (if prof defines 'preferencia' in data)
    for ccode, assigns in ind.items():
        prof = course_map[ccode].get('profesor')
        prof_info = prof_map.get(prof, {})
        pref = prof_info.get('preferencia', None)
        for (p,a) in assigns:
            if pref:
                if pref == 'mañana' and not is_morning_period(p):
                    cost_soft += w_S['S3']; diagnostics['S3_prof_pref'] += 1
                if pref == 'tarde' and is_morning_period(p):
                    cost_soft += w_S['S3']; diagnostics['S3_prof_pref'] += 1

    # S4: evitar concentración de carga diaria: if hours per curriculum per day > limite, penalizar
    DAILY_LIMIT = 4  # blocks per day as soft limit
    for curr, days in curr_sched.items():
        for day, plist in days.items():
            hours_day = len(plist)
            if hours_day > DAILY_LIMIT:
                cost_soft += (hours_day - DAILY_LIMIT) * w_S['S4']
                diagnostics['S4_daily_over'] += (hours_day - DAILY_LIMIT)

    # S5: balance de aulas / uso infra: penalizar overuse relative to ideal
    total_blocks = sum(len(v) for v in ind.values())
    ideal_per_aula = max(1, total_blocks / max(1, len(data['_aulas_list'])))
    for a, usos in aula_usage.items():
        overuse = max(0, usos - ideal_per_aula)
        cost_soft += overuse * w_S['S5']
        diagnostics['S5_overuse'] += overuse

    # S6: evitar franjas extremas (first and last block)
    first_blocks = set()
    last_blocks = set()
    # determine first and last block per day from period lists
    for day, mapping in day_order.items():
        rev = {v:k for k,v in mapping.items()}
        # if mapping empty skip
        if not mapping: continue
        min_idx = min(mapping.values()); max_idx = max(mapping.values())
        first_blocks.add(rev[min_idx]); last_blocks.add(rev[max_idx])
    extremas = 0
    for ccode, assigns in ind.items():
        for (p,a) in assigns:
            if p in first_blocks or p in last_blocks:
                extremas += 1
    cost_soft += extremas * w_S['S6']
    diagnostics['S6_extremas'] = extremas

    # S7: continuidad del curso: penalizar separación entre sesiones de un mismo curso
    for ccode, plist in course_periods.items():
        if not plist: continue
        # convert periods to (day,index) and compute gaps in index units (~blocks)
        idxs = []
        for p in plist:
            day = get_day_of_period(p)
            idx = day_order.get(day, {}).get(p, None)
            if idx is not None:
                # encode combined index as day_index + offset per day to measure across day boundaries in hours (approx)
                # For simplicity, use idx as is and penalize large gaps within same day
                idxs.append((day, idx))
        # compute gaps within same day
        idxs_by_day = defaultdict(list)
        for day, idx in idxs:
            idxs_by_day[day].append(idx)
        total_gap = 0
        for day, arr in idxs_by_day.items():
            arr_sorted = sorted(arr)
            for i in range(1, len(arr_sorted)):
                gap = arr_sorted[i] - arr_sorted[i-1] - 1
                if gap > 0:
                    total_gap += gap
        cost_soft += total_gap * w_S['S7']
        diagnostics['S7_gaps'] += total_gap

    # S8: preferencia estudiantes por horario concentrado (favor morning)
    # count classes of curriculum outside preferred shift
    turno_pref = data.get('preferencias', {}).get('turno_preferido', 'mañana')
    fuori = 0
    for curr, days in curr_sched.items():
        for day, plist in days.items():
            for p in plist:
                is_m = is_morning_period(p)
                if turno_pref == 'mañana' and not is_m:
                    fuori += 1
                if turno_pref == 'tarde' and is_m:
                    fuori += 1
    cost_soft += fuori * w_S['S8']
    diagnostics['S8_fuera_bloque'] = fuori

    # S9: minimizar número total de días con clases por currículo
    dias_ideal = 3
    for curr, days in curr_sched.items():
        dias_con_clase = sum(1 for d, ps in days.items() if ps)
        if dias_con_clase > dias_ideal:
            cost_soft += (dias_con_clase - dias_ideal) * w_S['S9']
            diagnostics['S9_dias_extra'] += (dias_con_clase - dias_ideal)

    fitness = cost_hard + cost_soft
    diagnostics['hard'] = cost_hard
    diagnostics['soft'] = cost_soft
    diagnostics['fitness'] = fitness
    return fitness, diagnostics

# ---------------------------
# Repair operator (greedy & simple)
# ---------------------------
def repair(ind: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any]) -> Dict[str, List[Tuple[Period, AulaID]]]:
    """
    Aplica reglas greedy para reducir violaciones duras:
    - Si un aula está duplicada en un periodo, intenta mover una asignación a otra aula disponible del mismo tipo.
    - Si profesor no disponible en un periodo, intenta mover esa asignación a otro periodo disponible for that professor.
    - Si aula capacity < estudiantes, try change to larger aula.
    Nota: no garantiza corregir todo, pero mejora la factibilidad.
    """
    new = copy.deepcopy(ind)
    aulas = data['_aulas_list']
    aulas_by_type = defaultdict(list)
    for a in aulas:
        aulas_by_type[a['tipo']].append(a)
    courses = data['_courses_map']
    profs = data['_profs_map']

    # 1) fix aula conflicts per period: for each period, find aulas with >1 assignment
    aula_period = defaultdict(lambda: defaultdict(list))  # aula->period->list of (course, index)
    for ccode, assigns in new.items():
        for idx, (p,a) in enumerate(assigns):
            aula_period[a][p].append((ccode, idx))
    for aula, permap in aula_period.items():
        for p, lst in permap.items():
            if len(lst) <= 1: continue
            # need to move all but one to other aulas same tipo
            a_type = None
            for a in aulas:
                if a['id'] == aula:
                    a_type = a['tipo']; break
            # candidate aulas of same type that are free at p
            candidates = [aa for aa in aulas_by_type[a_type] if aa['id'] != aula]
            free_candidates = []
            for c in candidates:
                # check if c['id'] is used at p anywhere
                used = any( (p == assign_p and c['id'] == assign_a) for cc, assigns in new.items() for (assign_p,assign_a) in assigns)
                if not used:
                    free_candidates.append(c['id'])
            # move excess to free candidates
            moved = 0
            for (ccode, idx) in lst[1:]:
                if free_candidates:
                    new_a = free_candidates.pop(0)
                    new[ccode][idx] = (p, new_a)
                    moved += 1
                else:
                    # try change period to other period where aula is free
                    for p2 in data['periodos']:
                        if p2 == p: continue
                        # is aula free at p2?
                        used = any( (p2 == assign_p and aula == assign_a) for cc, assigns in new.items() for (assign_p,assign_a) in assigns)
                        if not used:
                            # check professor availability
                            prof = courses[ccode].get('profesor')
                            prof_av = profs.get(prof, {}).get('disponibilidad', [])
                            if prof_av and p2 not in prof_av:
                                continue
                            # assign to p2 at same aula
                            new[ccode][idx] = (p2, aula)
                            moved += 1
                            break

    # 2) fix professor unavailable: move to available period if possible
    for ccode, assigns in list(new.items()):
        prof = courses[ccode].get('profesor')
        prof_av = set(profs.get(prof, {}).get('disponibilidad', []))
        if not prof_av: 
            continue
        for idx, (p,a) in enumerate(assigns):
            if p not in prof_av:
                # try find p2 in prof_av where aula 'a' is free
                assigned = False
                for p2 in prof_av:
                    # check aula free at p2
                    used = any( (p2 == assign_p and a == assign_a) for cc, assigns in new.items() for (assign_p,assign_a) in assigns)
                    if not used:
                        new[ccode][idx] = (p2, a)
                        assigned = True
                        break
                if not assigned:
                    # try other aula at some available p2
                    for p2 in prof_av:
                        for aa in aulas_by_type.get('T', []) + aulas_by_type.get('LAB', []):
                            aid = aa['id']
                            used = any( (p2 == assign_p and aid == assign_a) for cc, assigns in new.items() for (assign_p,assign_a) in assigns)
                            if not used:
                                new[ccode][idx] = (p2, aid)
                                assigned = True
                                break
                        if assigned: break

    # 3) fix capacity: try change aula for bigger one
    for ccode, assigns in new.items():
        est = courses[ccode].get('estudiantes', 30)
        for idx, (p,a) in enumerate(assigns):
            cap = next((x['capacidad'] for x in aulas if x['id'] == a), None)
            if cap is None: continue
            if est > cap:
                # find larger aula free at p
                candidates = sorted([x for x in aulas if x['capacidad'] >= est], key=lambda x: x['capacidad'])
                for cand in candidates:
                    used = any( (p == assign_p and cand['id'] == assign_a) for cc, assigns2 in new.items() for (assign_p,assign_a) in assigns2)
                    if not used:
                        new[ccode][idx] = (p, cand['id'])
                        break
    return new

# ---------------------------
# Genetic operators
# ---------------------------
def tournament_selection(pop: List[Dict], fitnesses: List[float], k=TOURNAMENT_K) -> Dict:
    i = random.randrange(len(pop))
    best = i; best_fit = fitnesses[i]
    for _ in range(k-1):
        j = random.randrange(len(pop))
        if fitnesses[j] < best_fit:
            best = j; best_fit = fitnesses[j]
    return copy.deepcopy(pop[best])

def crossover(parent1: Dict[str, List[Tuple[Period, AulaID]]], parent2: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any]) -> Tuple[Dict, Dict]:
    # Simple course-based crossover: for each course, swap with prob 0.5
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

def mutate(ind: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any], mut_prob=MUTATION_PROB) -> Dict[str, List[Tuple[Period, AulaID]]]:
    new = copy.deepcopy(ind)
    periods = data['periodos']
    aulas = data['_aulas_list']
    for ccode in new.keys():
        if random.random() < mut_prob:
            # randomly choose mutation type: move one block period, swap aula, relocate block
            assigns = new[ccode]
            if not assigns: continue
            idx = random.randrange(len(assigns))
            typ = random.choice([1,2,3])
            if typ == 1:
                # change period to random (keep aula)
                new_period = random.choice(periods)
                new[ccode][idx] = (new_period, assigns[idx][1])
            elif typ == 2:
                # change aula to another of same tipo if possible
                a_current = assigns[idx][1]
                a_tipo = next((x['tipo'] for x in aulas if x['id']==a_current), 'T')
                candidates = [x['id'] for x in aulas if x['tipo'] == a_tipo and x['id'] != a_current]
                if candidates:
                    new_a = random.choice(candidates)
                    new[ccode][idx] = (assigns[idx][0], new_a)
            else:
                # relocate block entirely (period + aula)
                new_period = random.choice(periods)
                new_aula = random.choice(aulas)['id']
                new[ccode][idx] = (new_period, new_aula)
    return new

# ---------------------------
# GA main loop
# ---------------------------
def run_ga(data: Dict[str, Any]):
    # init population
    population = [random_individual(data) for _ in range(POP_SIZE)]
    # optionally repair initial population
    population = [repair(ind, data) for ind in population]
    # evaluate
    fitnesses = []
    diagnostics_list = []
    for ind in population:
        f, d = evaluate(ind, data)
        fitnesses.append(f); diagnostics_list.append(d)
    best_idx = min(range(len(population)), key=lambda i: fitnesses[i])
    best = copy.deepcopy(population[best_idx])
    best_fit = fitnesses[best_idx]
    print(f"Init best fitness: {best_fit}, diag: {diagnostics_list[best_idx]}")

    for gen in range(1, GENERATIONS+1):
        newpop = []
        newfits = []
        # Elitism: carry best
        newpop.append(copy.deepcopy(best))
        newfits.append(best_fit)
        while len(newpop) < POP_SIZE:
            p1 = tournament_selection(population, fitnesses)
            p2 = tournament_selection(population, fitnesses)
            # crossover
            if random.random() < CROSSOVER_PROB:
                c1, c2 = crossover(p1, p2, data)
            else:
                c1, c2 = p1, p2
            # mutate
            c1 = mutate(c1, data)
            c2 = mutate(c2, data)
            # repair
            c1 = repair(c1, data)
            c2 = repair(c2, data)
            # append
            newpop.append(c1)
            if len(newpop) < POP_SIZE:
                newpop.append(c2)
        # evaluate newpop
        population = newpop
        fitnesses = []
        diagnostics_list = []
        for ind in population:
            f,d = evaluate(ind, data)
            fitnesses.append(f); diagnostics_list.append(d)
        # update best
        cur_best_idx = min(range(len(population)), key=lambda i: fitnesses[i])
        if fitnesses[cur_best_idx] < best_fit:
            best_fit = fitnesses[cur_best_idx]
            best = copy.deepcopy(population[cur_best_idx])
            print(f"[Gen {gen}] New best fitness: {best_fit} diag: {diagnostics_list[cur_best_idx]}")
        # occasional status
        if gen % 50 == 0:
            avg = sum(fitnesses)/len(fitnesses)
            print(f"Gen {gen}: best {best_fit}, avg {avg:.2f}")
    # final evaluate best with diagnostics
    f_best, d_best = evaluate(best, data)
    print("FINAL BEST fitness:", f_best)
    print("Diagnostics:", dict(d_best))
    return best, d_best

# ---------------------------
# Export to JSON
# ---------------------------
def save_schedule_as_json(sol: Dict[str, List[Tuple[Period, AulaID]]], data: Dict[str, Any], diag: Dict[str, Any], out_path="best_schedule.json"):
    """
    Exporta el horario global y por currículo a un solo archivo JSON estructurado.
    """
    course_map = data['_courses_map']
    curriculos = data.get('curriculos', {})
    
    # Horario global: dict de course_code -> list de dicts {"period": str, "aula": str}
    global_schedule = {}
    for ccode, assigns in sol.items():
        if ccode in course_map:
            global_schedule[ccode] = [{"period": p, "aula": a} for p, a in assigns]
    
    # Horario por currículo: nested dict curr_name -> course_code -> list de dicts
    per_curriculum = {}
    for curr_name, course_codes in curriculos.items():
        per_curriculum[curr_name] = {}
        for ccode in sorted(course_codes):
            if ccode in sol:
                per_curriculum[curr_name][ccode] = [{"period": p, "aula": a} for p, a in sol[ccode]]
            else:
                per_curriculum[curr_name][ccode] = []  # Marca como no asignado
    
    # Estructura JSON final
    output = {
        "metadata": {
            "fitness": diag.get('fitness', 0),
            "hard_violations": diag.get('hard', 0),
            "soft_penalties": diag.get('soft', 0),
            "total_diagnostics": {k: v for k, v in diag.items() if k not in ['hard', 'soft', 'fitness']}
        },
        "global_schedule": global_schedule,
        "per_curriculum": per_curriculum
    }
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"Se guardó el horario en {out_path}")

# ---------------------------
# CLI
# ---------------------------
def main():
    global POP_SIZE, GENERATIONS  # 👈 mover esto al inicio
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='JSON input file (plantilla)')
    parser.add_argument('--pop', type=int, default=POP_SIZE)
    parser.add_argument('--gens', type=int, default=GENERATIONS)
    args = parser.parse_args()
    
    POP_SIZE = args.pop
    GENERATIONS = args.gens

    data = load_input(args.input)
    # ensure we have an 'M' in pesos for heavy penalization
    if 'pesos' not in data:
        data['pesos'] = {}
    if 'M' not in data['pesos']:
        data['pesos']['M'] = 1000000

    best, diag = run_ga(data)
    save_schedule_as_json(best, data, diag)
    print("Se guardó el horario completo en formato JSON: best_schedule.json")

if __name__ == "__main__":
    main()