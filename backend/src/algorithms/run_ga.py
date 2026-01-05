# Your first line of Python code
#!/usr/bin/env python3
"""
Algoritmo Genético para Programación de Horarios Académicos (CB-TTP-GA)
Implementa TSSP (Time-Slot Selection Problem) con restricciones mejoradas

Características principales:
- Separación obligatoria entre teoría y laboratorio/práctica
- Mínimo 2 bloques por curso
- Algoritmo TSSP para inicialización inteligente
- Restricciones duras y blandas optimizadas
"""

import json
import sys
import random
import copy
import argparse
from collections import defaultdict
from typing import Dict, List, Tuple, Any, Set

# ============================================================================
# CONFIGURACIÓN Y PARÁMETROS GLOBALES
# ============================================================================

# Parámetros del Algoritmo Genético
POP_SIZE = 100
GENERATIONS = 200
TOURNAMENT_K = 3
CROSSOVER_PROB = 0.8
MUTATION_PROB = 0.2

# Aliases de tipos para mayor claridad
Period = str        # Formato: "DIA_HH:MM_HH:MM"
AulaID = str        # Identificador del aula
CourseCode = str    # Código del curso (ej: "CS101_T", "CS101_LAB")

# Estructuras globales para el algoritmo TSSP
# Rastrean conflictos durante la construcción secuencial
global_prof_period_cnt = defaultdict(lambda: defaultdict(int))
global_aula_period_cnt = defaultdict(lambda: defaultdict(int))
global_aula_map = {}

# Constantes para separación teoría-laboratorio
MIN_SEPARATION_HOURS = 4    # Mínimo 4 horas entre teoría y laboratorio
MIN_BLOCKS_PER_COURSE = 2   # Mínimo 2 bloques por curso

# Constantes para bloques consecutivos y agrupación inteligente
MIN_CONSECUTIVE_BLOCKS = 2  # Mínimo bloques consecutivos
MAX_CONSECUTIVE_BLOCKS = 2  # Máximo bloques consecutivos

# Configuración para agrupación de horas impares
ALLOW_SINGLE_BLOCK = True   # Permitir un bloque suelto si las horas son impares
PREFER_BLOCK_GROUPING = True # Priorizar agrupación por tipo de curso


# ============================================================================
# CONVERSIÓN DE DATOS DE ENTRADA
# ============================================================================

def convert_input_format(new_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convierte el JSON de entrada al formato interno del GA.
    
    Args:
        new_data: Datos en formato JSON de entrada
        
    Returns:
        dict: Datos convertidos al formato interno con prioridades TSSP calculadas
    """
    global global_aula_map
    data = {}
    
    # 1. Procesar períodos de tiempo
    periods_list = []
    for period in new_data['periods']:
        day = period['day_of_week']
        start = period['start_time']
        end = period['end_time']
        period_str = f"{day}_{start}_{end}"
        periods_list.append(period_str)
    
    data['periodos'] = sorted(periods_list)  # Ordenar para mejor manejo
    
    # 2. Procesar aulas/salones
    classroom_type_map = {"THEORY": "T", "LAB": "LAB"}
    aulas_list = []
    
    for room in new_data['classrooms']:
        aula_data = {
            'id': room['room_code'],
            'nombre': room.get('room_name', room['room_code']),
            'tipo': classroom_type_map.get(room['room_type'], room['room_type']),
            'capacidad': room['capacity']
        }
        aulas_list.append(aula_data)
        global_aula_map[aula_data['id']] = aula_data  # Registro global para TSSP
    
    data['_aulas_list'] = aulas_list
    data['_aulas_map'] = global_aula_map
    
    # 3. Procesar profesores y su disponibilidad
    profs_map = {}
    for prof in new_data['professors']:
        disponibilidad = set()  # Usar set desde el inicio para eficiencia O(1)
        
        for avail in prof['availabilities']:
            day = avail['day_of_week']
            for p in periods_list:
                if p.startswith(day + "_"):
                    parts = p.split("_")
                    p_start = parts[1]
                    p_end = parts[2]
                    
                    # Verificar si el período está dentro del rango de disponibilidad
                    if avail['start_time'] <= p_start and p_end <= avail['end_time']:
                        disponibilidad.add(p)
        
        profs_map[prof['professor_id']] = {
            'id': prof['professor_id'],
            'nombre': prof['name'],
            'disponibilidad': disponibilidad
        }
    
    data['_profs_map'] = profs_map

    # 4. Calcular recursos disponibles para prioridades TSSP
    aulas_teoria_aptas = [a for a in aulas_list if a['tipo'] == 'T']
    aulas_lab_aptas = [a for a in aulas_list if a['tipo'] == 'LAB']
    
    # Pesos para la fórmula de prioridad TSSP
    W_R, W_B, W_Y = 3, 2, 1  # Rigidez, Bloques, Año

    # 5. Procesar cursos (separando teoría y laboratorio)
    courses_map = {}
    
    for course in new_data['courses']:
        theory_hours = course.get('theory_hours', 0)
        lab_hours = course.get('lab_hours', 0)
        prof_ids = course.get('professors', [])
        num_profs = len(prof_ids) if prof_ids else 1
        year = course['year']
        
        # Validar mínimo de bloques totales
        total_hours = theory_hours + lab_hours
        if total_hours < MIN_BLOCKS_PER_COURSE:
            print(f"Advertencia: Curso {course['course_code']} tiene menos de {MIN_BLOCKS_PER_COURSE} bloques", 
                  file=sys.stderr)
        
        # Procesar componente de teoría
        if theory_hours > 0:
            course_code_theory = f"{course['course_code']}_T"
            
            # Calcular prioridad TSSP para teoría
            num_aulas = len(aulas_teoria_aptas) if aulas_teoria_aptas else 1
            factor_rigidez = 1 / (num_profs * num_aulas)
            score_teoria = (W_R * factor_rigidez) + (W_B * theory_hours) + (W_Y * year)
            
            courses_map[course_code_theory] = {
                'codigo': course_code_theory,
                'nombre': f"{course['course_name']} (Teoría)",
                'creditos': course['credits'],
                'estudiantes': 30,
                'profesores': prof_ids,
                'aula_tipo': 'T',
                '_blocks_needed': max(theory_hours, 1),  # Mínimo 1 bloque
                'prerequisitos': course.get('prerequisites', []),
                'original_code': course['course_code'],
                'year': year,
                '_tssp_priority_score': score_teoria,
                '_course_component': 'teoria'  # Nueva marca para separación
            }
        
        # Procesar componente de laboratorio/práctica
        if lab_hours > 0:
            course_code_lab = f"{course['course_code']}_LAB"
            
            # Calcular prioridad TSSP para laboratorio
            num_aulas = len(aulas_lab_aptas) if aulas_lab_aptas else 1
            factor_rigidez = 1 / (num_profs * num_aulas)
            score_lab = (W_R * factor_rigidez) + (W_B * lab_hours) + (W_Y * year)
            
            courses_map[course_code_lab] = {
                'codigo': course_code_lab,
                'nombre': f"{course['course_name']} (Laboratorio)",
                'creditos': course['credits'],
                'estudiantes': 30,
                'profesores': prof_ids,
                'aula_tipo': 'LAB',
                '_blocks_needed': max(lab_hours, 1),  # Mínimo 1 bloque
                'prerequisitos': course.get('prerequisites', []),
                'original_code': course['course_code'],
                'year': year,
                '_tssp_priority_score': score_lab,
                '_course_component': 'laboratorio'  # Nueva marca para separación
            }
    
    data['_courses_map'] = courses_map
    
    # 6. Configurar preferencias del usuario
    data['preferencias'] = {
        'turno_preferido': new_data['preferences']['preferred_shift'].lower(),
        'dias_preferidos': new_data['preferences'].get('preferred_days', []),
        'franjas_preferidas': new_data['preferences'].get('preferred_slots', [])
    }
    
    # 7. Definir pesos de restricciones (incluye nuevas restricciones)
    data['pesos'] = {
        'M': 1000000,  # Multiplicador para restricciones duras
        'restricciones_duras': {
            'no_solapamiento_profesor': 1000000,
            'disponibilidad_profesor': 1000000,
            'no_solapamiento_aula': 1000000,
            'capacidad_aula': 1000000,
            'tipo_aula': 1000000,
            'carga_horaria': 1000000,
            'minimo_bloques_curso': 1000000,      # H8: Nueva restricción
            'separacion_teoria_lab': 500000,      # H9: Nueva restricción
            'bloques_consecutivos': 1000000       # H10: Bloques consecutivos (2-4)
        },
        'restricciones_blandas': {
            'minimizacion_huecos': 5,
            'turno_preferido_estudiante': 3,
            'preferencia_profesor': 2,
            'franjas_extremas': 1,
            'distribucion_semanal': 4,            # S3: Nueva restricción
            'evitar_sesiones_consecutivas': 3     # S4: Nueva restricción
        }
    }
    
    # 8. Preservar metadatos originales
    data['metadata'] = new_data['metadata']
    
    return data

def convert_spanish_input_format(spanish_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convierte el formato español (data.json) al formato interno del GA.
    """
    global global_aula_map
    data = {}
    
    # 1. Periodos (ya vienen procesados como strings)
    data['periodos'] = sorted(spanish_data['periodos'])
    
    # 2. Aulas
    aulas_list = []
    # Flattear las listas de teoricas, practicas, laboratorios
    for categoria, lista_aulas in spanish_data['aulas'].items():
        tipo_normalizado = "LAB" if categoria == "laboratorios" else "T"
        for aula in lista_aulas:
            aula_data = {
                'id': aula['id'],
                'nombre': aula.get('nombre', aula['id']),
                'tipo': tipo_normalizado,
                'capacidad': aula['capacidad']
            }
            aulas_list.append(aula_data)
            global_aula_map[aula_data['id']] = aula_data
            
    data['_aulas_list'] = aulas_list
    data['_aulas_map'] = global_aula_map
    
    # 3. Profesores
    profs_map = {}
    for nombre_prof, info_prof in spanish_data['profesores'].items():
        # Info prof es un objeto con 'cursos', 'disponibilidad'
        # Necesitamos normalizar disponibilidad a formato interno si es necesario o filtrar
        # En data.json disponibilidad ya es lista de strings "DIA_HH:MM_HH:MM"
        
        prof_id = nombre_prof # Usar nombre como ID
        disponibilidad = set(info_prof['disponibilidad'])
        
        profs_map[prof_id] = {
            'id': prof_id,
            'nombre': nombre_prof,
            'disponibilidad': disponibilidad,
            'preferencia': info_prof.get('preferencia', 'mañana')
        }
    data['_profs_map'] = profs_map
    
    # 4. Cursos (Estructura anidada)
    courses_map = {}
    
    # Helper para procesar listas de cursos
    def procesar_curso(curso_raw, año=1):
        # Mapear campos del JSON español a lo que necesita el GA
        theory_hours = curso_raw.get('horas_teoria', 0)
        lab_hours = curso_raw.get('horas_lab', 0)
        practica_hours = curso_raw.get('horas_practica', 0)
        
        # Nota: Data actual separa practica como si fuera teoría o lab?
        # Asumiremos practica -> teoria si no es explicito, o podemos sumarlo
        # En data.json hay horas_teoria, horas_practica, horas_lab
        # El sistema actual solo soporta T y LAB.
        # Sumaremos practica a teoria o lab dependiendo de la naturaleza?
        # Lo más seguro es tratar practica como horas de 'aula normal' (T)
        
        theory_hours += practica_hours 
        
        # Buscar profesores para este curso
        profesores_asignados = []
        for pid, pdata in profs_map.items():
            if curso_raw['codigo'] in spanish_data['profesores'][pid]['cursos']:
                profesores_asignados.append(pid)
        
        # Prioridades
        aulas_teoria_aptas = [a for a in aulas_list if a['tipo'] == 'T']
        aulas_lab_aptas = [a for a in aulas_list if a['tipo'] == 'LAB']
        W_R, W_B, W_Y = 3, 2, 1
        num_profs = len(profesores_asignados) if profesores_asignados else 1
        
        # Componente Teoría (+ Práctica)
        if theory_hours > 0:
            course_code_theory = f"{curso_raw['codigo']}_T"
            num_aulas = len(aulas_teoria_aptas) or 1
            factor_rigidez = 1 / (num_profs * num_aulas)
            score = (W_R * factor_rigidez) + (W_B * theory_hours) + (W_Y * año)
            
            courses_map[course_code_theory] = {
                'codigo': course_code_theory,
                'nombre': f"{curso_raw['nombre']} (Teoria)",
                'creditos': curso_raw.get('creditos', 0),
                'estudiantes': 30, # Default
                'profesores': profesores_asignados,
                'aula_tipo': 'T',
                '_blocks_needed': int(max(theory_hours, 1)),
                'original_code': curso_raw['codigo'],
                'year': año,
                '_tssp_priority_score': score,
                '_course_component': 'teoria'
            }
            
        # Componente Laboratorio
        if lab_hours > 0:
            course_code_lab = f"{curso_raw['codigo']}_LAB"
            num_aulas = len(aulas_lab_aptas) or 1
            factor_rigidez = 1 / (num_profs * num_aulas)
            score = (W_R * factor_rigidez) + (W_B * lab_hours) + (W_Y * año)
            
            courses_map[course_code_lab] = {
                'codigo': course_code_lab,
                'nombre': f"{curso_raw['nombre']} (Laboratorio)",
                'creditos': curso_raw.get('creditos', 0),
                'estudiantes': 30,
                'profesores': profesores_asignados,
                'aula_tipo': 'LAB',
                '_blocks_needed': int(max(lab_hours, 1)),
                'original_code': curso_raw['codigo'],
                'year': año,
                '_tssp_priority_score': score,
                '_course_component': 'laboratorio'
            }

    # Recorrer estructura anidada
    # cursos es una lista de objetos que tienen claves como "primer_ano", "segundo_ano"...
    # a veces es una lista directa? data.json muestra:
    # "cursos": [ { "primer_ano": { ... } }, { "segundo_ano": { ... } } ]
    
    for item in spanish_data['cursos']:
        for key_ano, content_ano in item.items():
            # key_ano es "primer_ano", etc.
            # Intento de parsear año
            ano_num = 1
            if "segundo" in key_ano: ano_num = 2
            elif "tercer" in key_ano: ano_num = 3
            elif "cuarto" in key_ano: ano_num = 4
            elif "quinto" in key_ano: ano_num = 5
            
            # content_ano es dict con "primer_semestre": [...]
            for key_sem, lista_cursos in content_ano.items():
                for c in lista_cursos:
                    procesar_curso(c, ano_num)
                    
    data['_courses_map'] = courses_map
    
    # 5. Configurar preferencias y pesos
    data['preferencias'] = spanish_data.get('preferencias', {})
    data['pesos'] = spanish_data.get('pesos', {})
    data['metadata'] = spanish_data.get('metadata', {})
    
    return data

# ============================================================================
# FUNCIONES AUXILIARES PARA MANEJO DE PERÍODOS
# ============================================================================

def obtener_dia_periodo(period: Period) -> str:
    """Extrae el día de la semana de un período."""
    return period.split('_')[0]

def obtener_hora_inicio(period: Period) -> str:
    """Extrae la hora de inicio de un período."""
    return period.split('_')[1]

def calcular_diferencia_horas(period1: Period, period2: Period) -> int:
    """Calcula la diferencia en horas entre dos períodos."""
    try:
        hora1 = int(period1.split('_')[1].split(':')[0])
        hora2 = int(period2.split('_')[1].split(':')[0])
        return abs(hora2 - hora1)
    except:
        return 0

def es_periodo_matutino(period: Period) -> bool:
    """Verifica si un período es por la mañana (antes de las 12:00)."""
    try:
        hora = int(period.split('_')[1].split(':')[0])
        return hora < 12
    except:
        return True

def obtener_periodos_consecutivos(periodos: List[Period], data: Dict[str, Any]) -> List[List[Period]]:
    """
    Agrupa períodos en bloques consecutivos por día.
    
    Args:
        periodos: Lista de períodos a agrupar
        data: Datos del problema con todos los períodos disponibles
        
    Returns:
        Lista de listas, cada una conteniendo períodos consecutivos
    """
    if not periodos:
        return []
    
    # Agrupar por día
    por_dia = defaultdict(list)
    for p in periodos:
        dia = obtener_dia_periodo(p)
        por_dia[dia].append(p)
    
    bloques_consecutivos = []
    
    for dia, periodos_dia in por_dia.items():
        # Obtener todos los períodos del día ordenados
        todos_periodos_dia = [x for x in data['periodos'] if obtener_dia_periodo(x) == dia]
        indices_map = {p: i for i, p in enumerate(todos_periodos_dia)}
        
        # Ordenar períodos del curso por índice
        periodos_ordenados = sorted(periodos_dia, key=lambda x: indices_map.get(x, 0))
        
        # Agrupar períodos consecutivos
        if not periodos_ordenados:
            continue
            
        bloque_actual = [periodos_ordenados[0]]
        
        for i in range(1, len(periodos_ordenados)):
            idx_actual = indices_map.get(periodos_ordenados[i], 0)
            idx_anterior = indices_map.get(periodos_ordenados[i-1], 0)
            
            # Si son consecutivos, añadir al bloque actual
            if idx_actual == idx_anterior + 1:
                bloque_actual.append(periodos_ordenados[i])
            else:
                # Inicio de nuevo bloque
                if bloque_actual:
                    bloques_consecutivos.append(bloque_actual)
                bloque_actual = [periodos_ordenados[i]]
        
        # Añadir el último bloque
        if bloque_actual:
            bloques_consecutivos.append(bloque_actual)
    
    return bloques_consecutivos

# ============================================================================
# FUNCIONES DE AGRUPACIÓN INTELIGENTE DE BLOQUES
# ============================================================================

def calcular_agrupacion_optima_bloques(total_horas: int, tipo_curso: str) -> List[int]:
    """
    Calcula la agrupación óptima de bloques según las horas totales y tipo de curso.
    
    Reglas:
    - Si total_horas es par: dividir en bloques de 2
    - Si total_horas es impar: n-1 bloques de 2 + 1 bloque suelto
    - Respetar límites MIN_CONSECUTIVE_BLOCKS y MAX_CONSECUTIVE_BLOCKS
    
    Args:
        total_horas: Número total de horas del curso
        tipo_curso: 'teoria', 'laboratorio', 'practica'
        
    Returns:
        Lista con los tamaños de bloques óptimos
    """
    if total_horas <= 0:
        return []
    
    # Caso especial: 1 hora - permitir solo si ALLOW_SINGLE_BLOCK es True
    if total_horas == 1:
        if ALLOW_SINGLE_BLOCK:
            return [1]
        else:
            return [2]  # Forzar mínimo 2 bloques
    
    bloques = []
    horas_restantes = total_horas
    
    # Estrategia principal: crear bloques de 2 horas
    while horas_restantes >= 2:
        if horas_restantes == 3:
            # Caso especial: 3 horas = 2 + 1
            bloques.extend([2, 1])
            horas_restantes = 0
        elif horas_restantes >= 4:
            # Crear bloques de 2-4 horas según disponibilidad
            tamaño_bloque = min(4, horas_restantes, MAX_CONSECUTIVE_BLOCKS)
            if tamaño_bloque >= 2:
                bloques.append(tamaño_bloque)
                horas_restantes -= tamaño_bloque
        else:
            # 2 horas exactas
            bloques.append(2)
            horas_restantes -= 2
    
    # Si queda 1 hora y está permitido
    if horas_restantes == 1 and ALLOW_SINGLE_BLOCK:
        bloques.append(1)
    elif horas_restantes == 1 and not ALLOW_SINGLE_BLOCK:
        # Redistribuir: convertir último bloque
        if bloques:
            ultimo_bloque = bloques.pop()
            if ultimo_bloque == 2:
                bloques.append(3)  # 2 + 1 restante = 3
            else:
                bloques.extend([ultimo_bloque, 1])
    
    return bloques

def calcular_coherencia_horaria_profesor(horarios_profesor: Dict[str, List[Period]], 
                                       orden_dias: Dict[str, Dict[Period, int]]) -> Tuple[float, Dict]:
    """
    Calcula la coherencia horaria de un profesor (evitar horarios extremos).
    
    Args:
        horarios_profesor: Diccionario día -> lista de períodos del profesor
        orden_dias: Mapeo de días y períodos a índices ordenados
        
    Returns:
        Tuple[float, Dict]: (penalizacion, diagnosticos)
    """
    penalizacion = 0.0
    diagnosticos = {
        'dias_con_huecos': 0,
        'huecos_totales': 0,
        'cambios_extremos': 0,
        'carga_muy_dispersa': 0
    }
    
    for dia, periodos in horarios_profesor.items():
        if not periodos or dia not in orden_dias:
            continue
            
        # Obtener índices ordenados de los períodos
        indices = sorted([orden_dias[dia].get(p, 0) for p in periodos])
        
        if len(indices) < 2:
            continue
            
        # 1. Calcular huecos entre clases
        rango_total = indices[-1] - indices[0] + 1
        huecos = rango_total - len(indices)
        
        if huecos > 0:
            diagnosticos['dias_con_huecos'] += 1
            diagnosticos['huecos_totales'] += huecos
            penalizacion += huecos * 10  # Penalizar huecos
        
        # 2. Detectar cambios extremos (mañana a noche)
        primer_periodo = min(indices)
        ultimo_periodo = max(indices)
        
        # Definir umbrales (ajustar según la estructura de períodos)
        UMBRAL_MATUTINO = 4   # Primeros 4 períodos del día (mañana)
        UMBRAL_VESPERTINO = 8 # Después del período 8 (noche)
        
        if primer_periodo <= UMBRAL_MATUTINO and ultimo_periodo >= UMBRAL_VESPERTINO:
            diagnosticos['cambios_extremos'] += 1
            penalizacion += 50  # Penalización alta por horario "polo a polo"
        
        # 3. Verificar dispersión excesiva (más de 6 períodos de diferencia)
        if (ultimo_periodo - primer_periodo) > 6 and len(indices) <= 3:
            diagnosticos['carga_muy_dispersa'] += 1
            penalizacion += 25  # Penalizar carga muy dispersa con pocas clases
    
    return penalizacion, diagnosticos

def ajustar_parametros_convergencia_rapida():
    """
    Ajusta los parámetros del AG para convergencia en menos de 50 generaciones.
    """
    global POP_SIZE, GENERATIONS, TOURNAMENT_K, CROSSOVER_PROB, MUTATION_PROB
    
    # Configuración optimizada para convergencia rápida
    POP_SIZE = 60           # Población más pequeña pero diversa
    GENERATIONS = 50        # Máximo 50 generaciones
    TOURNAMENT_K = 5        # Torneo más selectivo
    CROSSOVER_PROB = 0.9    # Mayor probabilidad de cruzamiento
    MUTATION_PROB = 0.15    # Mutación moderada para exploración
    
    print(f"🚀 Parámetros ajustados para convergencia rápida:", file=sys.stderr)
    print(f"   Población: {POP_SIZE}, Generaciones: {GENERATIONS}", file=sys.stderr)
    print(f"   Torneo: {TOURNAMENT_K}, Cruce: {CROSSOVER_PROB}, Mutación: {MUTATION_PROB}", file=sys.stderr)

def validar_agrupacion_curso(asignaciones: List[Tuple[Period, AulaID, str]], 
                           curso: Dict[str, Any], 
                           data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Valida si las asignaciones de un curso respetan las reglas de agrupación óptima.
    
    Args:
        asignaciones: Lista de asignaciones del curso (período, aula, profesor)
        curso: Información del curso
        data: Datos del problema
        
    Returns:
        Tuple[bool, List[str]]: (es_valido, lista_de_errores)
    """
    errores = []
    
    if not asignaciones:
        errores.append("Curso sin asignaciones")
        return False, errores
    
    # Obtener información del curso
    total_horas = curso.get('_blocks_needed', 0)
    tipo_curso = curso.get('_course_component', 'teoria')
    
    # Calcular agrupación esperada
    agrupacion_esperada = calcular_agrupacion_optima_bloques(total_horas, tipo_curso)
    
    # Obtener períodos asignados
    periodos = [periodo for periodo, _, _ in asignaciones]
    
    # Agrupar períodos consecutivos
    bloques_actuales = obtener_periodos_consecutivos(periodos, data)
    
    # Validar que los bloques cumplan con restricciones básicas
    # En lugar de forzar una única "agrupación óptima", permitimos configuraciones válidas
    # Ejemplo: para 4 horas, [4] es válido, [2, 2] es válido.
    
    bloques_actuales_tamanos = [len(bloque) for bloque in bloques_actuales]
    num_bloques_unitarios = bloques_actuales_tamanos.count(1)

    # Validar si la suma total es correcta
    if sum(bloques_actuales_tamanos) != total_horas:
         errores.append(f"Suma de horas incorrecta: esperado {total_horas}, actual {sum(bloques_actuales_tamanos)}")
    
    # Validar bloques unitarios según paridad
    if total_horas % 2 == 0:
        if num_bloques_unitarios > 0:
            errores.append(f"Bloques unitarios no permitidos para curso con horas pares ({total_horas})")
    else:
        # Horas impares: permitir máximo un bloque unitario
        if num_bloques_unitarios > 1:
            errores.append(f"Máximo 1 bloque unitario permitido para curso con horas impares ({total_horas})")
    
    # Validar límites de bloques consecutivos (excluyendo el unitario permitido)
    for tamano_bloque in bloques_actuales_tamanos:
        if tamano_bloque == 1:
            if total_horas % 2 == 0:
                pass # Ya reportado arriba
            continue # Si es impar y hay 1, es válido. Si hay >1, ya reportado.
            
        if tamano_bloque > MAX_CONSECUTIVE_BLOCKS:
            errores.append(f"Bloque de {tamano_bloque} períodos excede el máximo permitido ({MAX_CONSECUTIVE_BLOCKS})")
        elif tamano_bloque < MIN_CONSECUTIVE_BLOCKS and tamano_bloque > 0:
            if not (tamano_bloque == 1 and ALLOW_SINGLE_BLOCK):
                errores.append(f"Bloque de {tamano_bloque} períodos es menor al mínimo permitido ({MIN_CONSECUTIVE_BLOCKS})")
    
    es_valido = len(errores) == 0
    return es_valido, errores

# ============================================================================
# ALGORITMO TSSP (TIME-SLOT SELECTION PROBLEM)
# ============================================================================

def verificar_restricciones_duras_slot(period: Period, aula: AulaID, prof: str, 
                                      course: Dict[str, Any], data: Dict[str, Any],
                                      asignaciones_actuales: List[Tuple[Period, AulaID, str]] = None) -> bool:
    """
    Verifica si un slot (período, aula, profesor) viola restricciones duras.
    
    Args:
        period: Período de tiempo propuesto
        aula: ID del aula propuesta
        prof: ID del profesor propuesto
        course: Información del curso
        data: Datos del problema
        asignaciones_actuales: Asignaciones ya realizadas para el curso actual
        
    Returns:
        bool: True si el slot es válido, False si viola restricciones
    """
    
    # H2: Conflicto de profesor (ya asignado en este período)
    if prof and global_prof_period_cnt[prof][period] > 0:
        return False
        
    # H3: Disponibilidad del profesor
    if prof:
        disponibilidad = data['_profs_map'].get(prof, {}).get('disponibilidad', set())
        if disponibilidad and period not in disponibilidad:
            return False
            
    # H4: Conflicto de aula (ya asignada en este período)
    if global_aula_period_cnt[aula][period] > 0:
        return False
        
    # H5: Capacidad del aula
    estudiantes = course.get('estudiantes', 30)
    capacidad = global_aula_map.get(aula, {}).get('capacidad', 0)
    if estudiantes > capacidad:
        return False
        
    # H6: Tipo de aula requerido
    tipo_requerido = course.get('aula_tipo', None)
    tipo_actual = global_aula_map.get(aula, {}).get('tipo', None)
    if tipo_requerido and tipo_actual != tipo_requerido:
        return False
        
    # H9: Separación teoría-laboratorio (NUEVA RESTRICCIÓN)
    if asignaciones_actuales:
        dia_actual = obtener_dia_periodo(period)
        componente_actual = course.get('_course_component', '')
        codigo_original = course.get('original_code', '')
        
        # Verificar separación con otros componentes del mismo curso
        for periodo_asignado, _, _ in asignaciones_actuales:
            dia_asignado = obtener_dia_periodo(periodo_asignado)
            
            # No permitir teoría y laboratorio el mismo día
            if dia_actual == dia_asignado:
                # Buscar si hay un componente diferente del mismo curso base
                for otro_codigo, otro_curso in data['_courses_map'].items():
                    if (otro_curso.get('original_code') == codigo_original and 
                        otro_curso.get('_course_component') != componente_actual):
                        return False
            
            # Verificar separación mínima de horas
            diferencia_horas = calcular_diferencia_horas(period, periodo_asignado)
            if diferencia_horas < MIN_SEPARATION_HOURS and dia_actual == dia_asignado:
                return False
        
    return True

def calcular_costo_restricciones_blandas_slot(period: Period, aula: AulaID, prof: str, 
                                            course: Dict[str, Any], data: Dict[str, Any],
                                            asignaciones_actuales: List[Tuple[Period, AulaID, str]] = None) -> float:
    """
    Calcula el costo de restricciones blandas para un slot específico.
    
    Args:
        period: Período propuesto
        aula: Aula propuesta
        prof: Profesor propuesto
        course: Información del curso
        data: Datos del problema
        asignaciones_actuales: Asignaciones ya realizadas
        
    Returns:
        float: Costo total de restricciones blandas
    """
    costo = 0
    pesos_blandas = data.get('pesos', {}).get('restricciones_blandas', {})
    
    # S2: Turno preferido por estudiantes
    turno_preferido = data['preferencias'].get('turno_preferido', 'morning')
    if turno_preferido == 'morning' and not es_periodo_matutino(period):
        costo += pesos_blandas.get('turno_preferido_estudiante', 3)
    
    # S4: Evitar sesiones consecutivas (ELIMINADO)
    pass
    
    # S6: Penalizar franjas extremas (primera y última del día)
    # Simplificado: penalizar horas muy tempranas o muy tardías
    try:
        hora = int(period.split('_')[1].split(':')[0])
        if hora <= 7 or hora >= 19:  # Antes de 7 AM o después de 7 PM
            costo += pesos_blandas.get('franjas_extremas', 1)
    except:
        pass
    
    return costo

def asignar_curso_tssp(course: Dict[str, Any], data: Dict[str, Any]) -> List[Tuple[Period, AulaID, str]]:
    """
    Genera asignaciones para un curso usando la lógica secuencial del TSSP.
    Implementa separación teoría-laboratorio y distribución inteligente.
    
    Args:
        course: Información del curso a asignar
        data: Datos del problema
        
    Returns:
        List[Tuple[Period, AulaID, str]]: Lista de asignaciones (período, aula, profesor)
    """
    bloques_necesarios = course['_blocks_needed']
    asignaciones = []
    
    # Configurar profesores disponibles
    profesores_disponibles = course.get('profesores', [])
    if not profesores_disponibles:
        profesores_disponibles = [""]  # Permitir asignación sin profesor
    
    # Filtrar aulas por tipo requerido
    tipo_aula = course.get('aula_tipo', 'T')
    aulas_filtradas = [a['id'] for a in data['_aulas_list'] if a['tipo'] == tipo_aula]
    
    if not aulas_filtradas:
        # Fallback: usar cualquier aula disponible
        aulas_filtradas = [a['id'] for a in data['_aulas_list']]
        print(f"Advertencia: No hay aulas del tipo {tipo_aula} para curso {course['codigo']}", 
              file=sys.stderr)

    # Obtener composición de bloques ideal
    total_horas = course.get('_blocks_needed', 1)
    tipo_curso = course.get('_course_component', 'teoria')
    composicion_bloques = calcular_agrupacion_optima_bloques(total_horas, tipo_curso)
    
    # Asignar cada bloque de la composición
    # Para evitar que bloques separados (ej: [2, 2]) se peguen y formen uno de 4,
    # mantenemos un registro de lo asignado en este curso.
    asignados_curso_actual = set()
    
    indices_periodos = list(range(len(data['periodos']))) # Define indices_periodos here
    
    for tamano_bloque in composicion_bloques:
        slots_validos = []
        
        # Evaluar todas las combinaciones posibles de inicio de bloque
        random.shuffle(indices_periodos) # Randomizar búsqueda para variedad
        
        for i_p in indices_periodos:
            # Optimización: si ya fallamos muchas veces, break? No, TSSP debe encontrar si existe.
            if len(slots_validos) > 50: break # Suficientes candidatos
            
            periodo = data['periodos'][i_p]
            
            # Verificar geometría del bloque
            candidatos = []
            bloque_valido = True
            dia_ref = obtener_dia_periodo(periodo)
            
            for k in range(tamano_bloque):
                if i_p + k >= len(data['periodos']):
                    bloque_valido = False; break
                p_cand = data['periodos'][i_p + k]
                
                # Mismo dia
                if obtener_dia_periodo(p_cand) != dia_ref:
                    bloque_valido = False; break
                
                # Consecutivos en tiempo
                if k > 0:
                    prev = data['periodos'][i_p + k - 1]
                    if calcular_diferencia_horas(prev, p_cand) != 1:
                        bloque_valido = False; break
                
                # H11 CHECK: No pegar con lo ya asignado a este curso
                # Adyacencia inmediata anterior
                idx_cand = i_p + k
                if idx_cand > 0:
                     prev_global = data['periodos'][idx_cand - 1]
                     if prev_global in asignados_curso_actual and obtener_dia_periodo(prev_global) == dia_ref:
                         bloque_valido = False; break
                # Adyacencia inmediata posterior (difícil porque vamos en orden, pero por si acaso si el orden fuera aleatorio)
                if idx_cand < len(data['periodos']) - 1:
                     post_global = data['periodos'][idx_cand + 1]
                     if post_global in asignados_curso_actual and obtener_dia_periodo(post_global) == dia_ref:
                         bloque_valido = False; break
                
                candidatos.append(p_cand)
            
            if not bloque_valido: continue
            
            # Verificar restricciones duras para todo el bloque
            bloque_propuesto = []
            costo_blando_acumulado = 0
            
            # ... (selección de aula/profesor para el bloque)
            # Simplificación: validar hard constraints para el primer slot y asumir consistencia o chequear todos
            # Para TSSP estricto, debemos encontrar aula que sirva para TODO el bloque
            
            # Filtrar aulas válidas para TODOS los periodos del bloque
            aulas_candidatas_bloque = list(aulas_filtradas)
            # ... (lógica de filtrado iterativo)
            
            # Por simplicidad y performance, usaremos la lógica existente slot-a-slot pero aplicada al bloque
            # Si encontramos un aula que funcione para todos, genial.
            
            # ... (código original de selección de candidato) ...
            
            # REIMPLEMENTACIÓN RÁPIDA DE SELECCIÓN DE AULA PARA BLOQUE
            # Buscar intersección de aulas disponibles en todos los slots
            
            # Pre-calcular disponibilidad para este bloque
            slots_con_opciones = []
            for p_cand in candidatos:
                opciones_p = []
                for aula_id in aulas_filtradas:
                     if global_aula_period_cnt[aula_id][p_cand] == 0:
                         # chequear capacidad hard constraint
                         # H5: Capacidad del aula
                         estudiantes = course.get('estudiantes', 30)
                         capacidad = global_aula_map.get(aula_id, {}).get('capacidad', 0)
                         if estudiantes <= capacidad:
                             # H6: Tipo de aula requerido (ya filtrado por aulas_filtradas)
                             opciones_p.append(aula_id)
                slots_con_opciones.append(set(opciones_p))
            
            if not slots_con_opciones: bloque_valido = False
            
            if bloque_valido:
                # Intersección de aulas disponibles en todos los slots
                aulas_comunes = set.intersection(*slots_con_opciones) if slots_con_opciones else set()
                
                if aulas_comunes:
                    aula_elegida = random.choice(list(aulas_comunes))
                    prof_elegido = random.choice(profesores_disponibles) if profesores_disponibles else ""
                    
                    # Verificar disponibilidad prof hard (H2, H3)
                    prof_ok = True
                    if prof_elegido:
                         for p_cand in candidatos:
                             if global_prof_period_cnt[prof_elegido][p_cand] > 0: # H2
                                 prof_ok = False; break
                             # Chequear disponibilidad horaria prof (H3)
                             prof_disponibilidad = data['_profs_map'].get(prof_elegido, {}).get('disponibilidad', set())
                             if prof_disponibilidad and p_cand not in prof_disponibilidad:
                                 prof_ok = False; break
                    
                    if prof_ok:
                        bloque_resuelto = []
                        for p_cand in candidatos:
                            bloque_resuelto.append((p_cand, aula_elegida, prof_elegido))
                        
                        # Score simple (no calculamos soft constraints aquí para simplificar la búsqueda inicial)
                        slots_validos.append((bloque_resuelto, 0))

        if slots_validos:
             # Elegir uno
             # Originalmente se ordenaba por costo y se elegía aleatoriamente entre los mejores.
             # Aquí, como el costo es 0 para todos los válidos, y los periodos ya fueron shuffled,
             # simplemente tomamos el primero.
             mejor_bloque, _ = slots_validos[0] 
             for slot in mejor_bloque:
                 asignaciones.append(slot)
                 p, a, prof = slot
                 asignados_curso_actual.add(p) # Track for H11
                 global_aula_period_cnt[a][p] += 1
                 if prof: global_prof_period_cnt[prof][p] += 1
                
        else:
            # Fallback de emergencia MEJORADO: Intentar asignar bloques en cualquier lugar disponible
            print(f"⚠️ Advertencia: No se encontró bloque continuo óptimo de tamaño {tamano_bloque} para {course['codigo']}. Intentando ajuste aleatorio.", 
                  file=sys.stderr)
            
            asignado_fallback = False
            # Intentar 20 veces encontrar un hueco válido para el bloque COMPLETO
            for _ in range(20):
                inicio_rand = random.randrange(len(data['periodos']) - tamano_bloque + 1)
                
                # Verificar geometría del bloque
                candidatos = []
                es_consecutivo = True
                dia_ref = obtener_dia_periodo(data['periodos'][inicio_rand])
                
                for k in range(tamano_bloque):
                    p = data['periodos'][inicio_rand + k]
                    if obtener_dia_periodo(p) != dia_ref:
                        es_consecutivo = False
                        break
                    if k > 0:
                        prev = data['periodos'][inicio_rand + k - 1]
                        if calcular_diferencia_horas(prev, p) != 1:
                            es_consecutivo = False
                            break
                    candidatos.append(p)
                
                if es_consecutivo:
                    # Encontró hueco geométrico, asignar (incluso si viola soft constraints)
                    aula = random.choice(aulas_filtradas)
                    prof = random.choice(profesores_disponibles) if profesores_disponibles else ""
                    
                    for p in candidatos:
                        asignaciones.append((p, aula, prof))
                        if prof:
                            global_prof_period_cnt[prof][p] += 1
                        global_aula_period_cnt[aula][p] += 1
                    asignado_fallback = True
                    break
            
            if not asignado_fallback:
                 # Si falla todo, asignar slot a slot (último recurso para no crashear)
                 print(f"❌ ERROR CRÍTICO: Fallback total para {course['codigo']}", file=sys.stderr)
                 for _ in range(tamano_bloque):
                    periodo = random.choice(data['periodos'])
                    aula = random.choice(aulas_filtradas)
                    prof = random.choice(profesores_disponibles) if profesores_disponibles else ""
                    asignaciones.append((periodo, aula, prof))

    return asignaciones

def generar_individuo_tssp(data: Dict[str, Any]) -> Dict[CourseCode, List[Tuple[Period, AulaID, str]]]:
    """
    Genera un individuo completo utilizando la construcción secuencial TSSP.
    
    Args:
        data: Datos del problema
        
    Returns:
        dict: Individuo con asignaciones para todos los cursos
    """
    
    # Reiniciar contadores globales para la construcción del nuevo individuo
    global global_prof_period_cnt, global_aula_period_cnt
    global_prof_period_cnt = defaultdict(lambda: defaultdict(int))
    global_aula_period_cnt = defaultdict(lambda: defaultdict(int))
    
    # Ordenar cursos por prioridad TSSP (mayor score = más difícil = primero)
    cursos_ordenados = sorted(
        data['_courses_map'].values(), 
        key=lambda c: c['_tssp_priority_score'], 
        reverse=True
    )
    
    individuo = {}
    
    # Asignar cursos secuencialmente según prioridad
    for course in cursos_ordenados:
        codigo = course['codigo']
        individuo[codigo] = asignar_curso_tssp(course, data)
        
    return individuo

def inicializar_poblacion_tssp(data: Dict[str, Any]) -> List[Dict]:
    """
    Genera la población inicial usando el algoritmo TSSP.
    
    Args:
        data: Datos del problema
        
    Returns:
        List[Dict]: Población inicial de individuos
    """
    print(f"🔄 Inicializando población con TSSP (tamaño: {POP_SIZE})", file=sys.stderr)
    poblacion = []
    
    for i in range(POP_SIZE):
        if i % 20 == 0 and i > 0:
            print(f"   Generados {i}/{POP_SIZE} individuos...", file=sys.stderr)
        
        # Cada llamada genera una solución con variaciones aleatorias
        individuo = generar_individuo_tssp(data)
        poblacion.append(individuo)
    
    print(f"✅ Población inicial generada exitosamente", file=sys.stderr)
    return poblacion

# ============================================================================
# FUNCIÓN DE EVALUACIÓN (FITNESS)
# ============================================================================

def evaluar_solucion(individuo: Dict[str, List[Tuple[Period, AulaID, str]]], 
                    data: Dict[str, Any]) -> Tuple[float, Dict]:
    """
    Calcula el fitness completo de una solución incluyendo nuevas restricciones.
    
    Args:
        individuo: Solución a evaluar
        data: Datos del problema
        
    Returns:
        Tuple[float, Dict]: (fitness_total, diagnosticos)
    """
    M = data['pesos'].get('M', 1000000)
    pesos_duras = data.get('pesos', {}).get('restricciones_duras', {})
    pesos_blandas = data.get('pesos', {}).get('restricciones_blandas', {})

    # Pesos de restricciones duras (incluyendo nuevas)
    w_H = {
        'H2': pesos_duras.get('no_solapamiento_profesor', M),
        'H3': pesos_duras.get('disponibilidad_profesor', M),
        'H4': pesos_duras.get('no_solapamiento_aula', M),
        'H5': pesos_duras.get('capacidad_aula', M),
        'H6': pesos_duras.get('tipo_aula', M),
        'H7': pesos_duras.get('carga_horaria', M),
        'H8': pesos_duras.get('minimo_bloques_curso', M),      # NUEVA
        'H9': pesos_duras.get('separacion_teoria_lab', M//2),  # NUEVA
        'H10': 10 * M,  # PRIORIDAD ABSOLUTA: Bloques inválidos prohibidos
        'H11': 5 * M    # Separación interna muy importante
    }
    
    # Pesos de restricciones blandas (incluyendo nuevas)
    w_S = {
        'S1': pesos_blandas.get('minimizacion_huecos', 5),
        'S2': pesos_blandas.get('turno_preferido_estudiante', 3),
        'S3': pesos_blandas.get('distribucion_semanal', 4),       # NUEVA
        'S4': pesos_blandas.get('evitar_sesiones_consecutivas', 3), # NUEVA
        'S6': pesos_blandas.get('franjas_extremas', 1)
    }

    costo_duro = 0
    costo_blando = 0
    diagnosticos = defaultdict(int)

    # Mapas de referencia
    mapa_cursos = data['_courses_map']
    mapa_profesores = data['_profs_map']
    mapa_aulas = {a['id']: a for a in data['_aulas_list']}
    
    # ========================================================================
    # EVALUACIÓN DE RESTRICCIONES DURAS
    # ========================================================================
    
    # H2: Conflicto de profesor
    contador_prof_periodo = defaultdict(lambda: defaultdict(int))
    for codigo_curso, asignaciones in individuo.items():
        for (periodo, aula, profesor) in asignaciones:
            if profesor:
                contador_prof_periodo[profesor][periodo] += 1
    
    for profesor, mapa_periodos in contador_prof_periodo.items():
        for periodo, contador in mapa_periodos.items():
            if contador > 1:
                costo_duro += (contador - 1) * w_H['H2']
                diagnosticos['H2_conflicto_profesor'] += (contador - 1)

    # H3: Disponibilidad profesor
    for codigo_curso, asignaciones in individuo.items():
        for (periodo, aula, profesor) in asignaciones:
            if profesor and profesor in mapa_profesores:
                disponibilidad = mapa_profesores[profesor].get('disponibilidad', set())
                if disponibilidad and periodo not in disponibilidad:
                    costo_duro += w_H['H3']
                    diagnosticos['H3_prof_no_disponible'] += 1

    # H4: Conflicto de aula
    contador_aula_periodo = defaultdict(lambda: defaultdict(int))
    for codigo_curso, asignaciones in individuo.items():
        for (periodo, aula, profesor) in asignaciones:
            contador_aula_periodo[aula][periodo] += 1
    
    for aula, mapa_periodos in contador_aula_periodo.items():
        for periodo, contador in mapa_periodos.items():
            if contador > 1:
                costo_duro += (contador - 1) * w_H['H4']
                diagnosticos['H4_conflicto_aula'] += (contador - 1)

    # H5: Capacidad de aula
    for codigo_curso, asignaciones in individuo.items():
        estudiantes = mapa_cursos[codigo_curso].get('estudiantes', 30)
        for (periodo, aula, profesor) in asignaciones:
            capacidad = mapa_aulas.get(aula, {}).get('capacidad', 999)
            if estudiantes > capacidad:
                costo_duro += w_H['H5']
                diagnosticos['H5_capacidad_excedida'] += 1

    # H6: Tipo de aula requerido
    for codigo_curso, asignaciones in individuo.items():
        tipo_requerido = mapa_cursos[codigo_curso].get('aula_tipo', None)
        if tipo_requerido:
            for (periodo, aula, profesor) in asignaciones:
                if aula not in mapa_aulas:
                    costo_duro += w_H['H6']
                    diagnosticos['H6_aula_inexistente'] += 1
                    continue
                tipo_actual = mapa_aulas[aula]['tipo']
                if tipo_requerido != tipo_actual:
                    costo_duro += w_H['H6']
                    diagnosticos['H6_tipo_incorrecto'] += 1

    # H7: Carga horaria del curso
    for codigo_curso, asignaciones in individuo.items():
        bloques_necesarios = mapa_cursos[codigo_curso]['_blocks_needed']
        bloques_asignados = len(asignaciones)
        if bloques_asignados != bloques_necesarios:
            costo_duro += abs(bloques_asignados - bloques_necesarios) * w_H['H7']
            diagnosticos['H7_carga_incorrecta'] += abs(bloques_asignados - bloques_necesarios)

    # H8: Mínimo bloques por curso (NUEVA RESTRICCIÓN)
    for codigo_curso, asignaciones in individuo.items():
        if len(asignaciones) < MIN_BLOCKS_PER_COURSE:
            deficit = MIN_BLOCKS_PER_COURSE - len(asignaciones)
            costo_duro += deficit * w_H['H8']
            diagnosticos['H8_bloques_insuficientes'] += deficit

    # H9: Separación teoría-laboratorio (NUEVA RESTRICCIÓN)
    cursos_por_base = defaultdict(list)
    for codigo_curso, asignaciones in individuo.items():
        codigo_base = mapa_cursos[codigo_curso].get('original_code', codigo_curso)
        cursos_por_base[codigo_base].append((codigo_curso, asignaciones))
    
    for codigo_base, lista_componentes in cursos_por_base.items():
        if len(lista_componentes) > 1:  # Curso con teoría y laboratorio
            for i, (codigo1, asig1) in enumerate(lista_componentes):
                for j, (codigo2, asig2) in enumerate(lista_componentes[i+1:], i+1):
                    # Verificar separación entre componentes
                    for (p1, a1, prof1) in asig1:
                        for (p2, a2, prof2) in asig2:
                            dia1, dia2 = obtener_dia_periodo(p1), obtener_dia_periodo(p2)
                            if dia1 == dia2:  # Mismo día
                                costo_duro += w_H['H9']
                                diagnosticos['H9_teoria_lab_mismo_dia'] += 1
                            elif calcular_diferencia_horas(p1, p2) < MIN_SEPARATION_HOURS:
                                costo_duro += w_H['H9'] // 2
                                diagnosticos['H9_separacion_insuficiente'] += 1

    # H10: Agrupación inteligente de bloques (NUEVA RESTRICCIÓN MEJORADA)
    for codigo_curso, asignaciones in individuo.items():
        if len(asignaciones) == 0:
            continue
            
        curso = mapa_cursos.get(codigo_curso, {})
        total_horas = curso.get('_blocks_needed', len(asignaciones))
        tipo_curso = curso.get('_course_component', 'teoria')
        
        # Calcular agrupación óptima esperada
        agrupacion_esperada = calcular_agrupacion_optima_bloques(total_horas, tipo_curso)
        
        # Obtener bloques actuales
        periodos = [periodo for periodo, _, _ in asignaciones]
        bloques_actuales = obtener_periodos_consecutivos(periodos, data)
        
        # Validar agrupación según tipo de curso
        es_valido, errores = validar_agrupacion_curso(asignaciones, curso, data)
        
        if not es_valido:
            # Penalizar según el tipo de error
            for error in errores:
                if "bloque unitario" in error and not ALLOW_SINGLE_BLOCK:
                    costo_duro += w_H['H10']
                    diagnosticos['H10_bloque_unitario_no_permitido'] += 1
                elif "número de grupos incorrecto" in error:
                    costo_duro += w_H['H10'] // 2
                    diagnosticos['H10_agrupacion_incorrecta'] += 1
                elif "tamaño incorrecto" in error:
                    costo_duro += w_H['H10'] // 4
                    diagnosticos['H10_tamaño_bloque_incorrecto'] += 1
                else:
                    # Penalizar cualquier otro error de agrupación (incluye "excede el máximo")
                    costo_duro += w_H['H10']
                    diagnosticos['H10_error_generico'] += 1
        
        # Validación específica: separar teoría y laboratorio del mismo curso
        if '_T' in codigo_curso or '_LAB' in codigo_curso:
            curso_base = curso.get('original_code', codigo_curso.split('_')[0])
            tipo_actual = curso.get('_course_component', 'teoria')
            
            # Buscar componente complementario
            codigo_complementario = None
            if tipo_actual == 'teoria':
                codigo_complementario = f"{curso_base}_LAB"
            elif tipo_actual == 'laboratorio':
                codigo_complementario = f"{curso_base}_T"
            
            if codigo_complementario and codigo_complementario in individuo:
                # Verificar separación temporal mínima entre teoría y laboratorio
                periodos_complementarios = [p for p, _, _ in individuo[codigo_complementario]]
                for p1 in periodos:
                    for p2 in periodos_complementarios:
                        if obtener_dia_periodo(p1) == obtener_dia_periodo(p2):
                            diferencia = abs(calcular_diferencia_horas(p1, p2))
                            if diferencia < MIN_SEPARATION_HOURS:
                                costo_duro += w_H['H9'] // 3
                                diagnosticos['H10_teoria_lab_muy_cerca'] += 1

    # ========================================================================
    # EVALUACIÓN DE RESTRICCIONES BLANDAS
    # ========================================================================
    
    # S1: Minimización de huecos por profesor
    horario_profesores = defaultdict(lambda: defaultdict(list))
    for codigo_curso, asignaciones in individuo.items():
        for (periodo, aula, profesor) in asignaciones:
            if profesor:
                dia = obtener_dia_periodo(periodo)
                horario_profesores[profesor][dia].append(periodo)
    
    # Crear orden de períodos por día
    orden_dias = {}
    for periodo in data['periodos']:
        dia = obtener_dia_periodo(periodo)
        if dia not in orden_dias:
            orden_dias[dia] = []
        orden_dias[dia].append(periodo)
    
    for dia in orden_dias:
        periodos_ordenados = [x for x in data['periodos'] if obtener_dia_periodo(x) == dia]
        orden_dias[dia] = {periodo: indice for indice, periodo in enumerate(periodos_ordenados)}
    
    # Calcular huecos por profesor Y coherencia horaria mejorada
    for profesor, dias in horario_profesores.items():
        # Calcular coherencia horaria usando la nueva función
        penalizacion_coherencia, diag_coherencia = calcular_coherencia_horaria_profesor(dias, orden_dias)
        costo_blando += penalizacion_coherencia
        
        # Agregar diagnósticos de coherencia
        diagnosticos['S1_coherencia_profesor'] += penalizacion_coherencia
        diagnosticos['S1_cambios_extremos'] += diag_coherencia['cambios_extremos']
        diagnosticos['S1_carga_dispersa'] += diag_coherencia['carga_muy_dispersa']
        
        # Mantener cálculo original de huecos
        for dia, lista_periodos in dias.items():
            if not lista_periodos or dia not in orden_dias:
                continue
            indices = sorted(orden_dias[dia].get(p, 0) for p in lista_periodos)
            if not indices:
                continue
            
            rango_total = indices[-1] - indices[0] + 1
            huecos = rango_total - len(indices)
            costo_blando += huecos * w_S['S1']
            diagnosticos['S1_huecos_profesor'] += huecos

    # S2: Turno preferido por estudiantes
    turno_preferido = data['preferencias'].get('turno_preferido', 'morning')
    for codigo_curso, asignaciones in individuo.items():
        for (periodo, aula, profesor) in asignaciones:
            if turno_preferido == 'morning' and not es_periodo_matutino(periodo):
                costo_blando += w_S['S2']
                diagnosticos['S2_turno_incorrecto'] += 1

    # S3: Distribución semanal equilibrada (NUEVA)
    for codigo_curso, asignaciones in individuo.items():
        dias_usados = set(obtener_dia_periodo(p) for p, _, _ in asignaciones)
        if len(asignaciones) > 1 and len(dias_usados) == 1:
            # Penalizar si todas las sesiones están en el mismo día
            costo_blando += w_S['S3'] * len(asignaciones)
            diagnosticos['S3_concentracion_un_dia'] += len(asignaciones)

    # S4: Evitar sesiones consecutivas del mismo curso (ya implementada en TSSP)
    # Se evalúa durante la construcción TSSP

    # S6: Franjas extremas
    for codigo_curso, asignaciones in individuo.items():
        for (periodo, aula, profesor) in asignaciones:
            try:
                hora = int(periodo.split('_')[1].split(':')[0])
                if hora <= 7 or hora >= 19:  # Franjas extremas
                    costo_blando += w_S['S6']
                    diagnosticos['S6_franja_extrema'] += 1
            except:
                pass

    # ========================================================================
    # CÁLCULO FINAL DEL FITNESS
    # ========================================================================
    
    fitness_total = costo_duro + costo_blando
    diagnosticos['costo_duro'] = costo_duro
    diagnosticos['costo_blando'] = costo_blando
    diagnosticos['fitness_total'] = fitness_total
    
    return fitness_total, diagnosticos

# ============================================================================
# OPERADORES DE REPARACIÓN
# ============================================================================

def reparar_fragmentacion_tiempo(individuo: Dict[str, List[Tuple[Period, AulaID, str]]], 
                               data: Dict[str, Any]) -> Dict[str, List[Tuple[Period, AulaID, str]]]:
    """
    Identifica cursos fragmentados y fuerza su reagrupación en bloques válidos.
    """
    nuevo_individuo = copy.deepcopy(individuo)
    periodos_disponibles = data['periodos']
    
    for codigo_curso, asignaciones in nuevo_individuo.items():
        if not asignaciones:
            continue
            
        curso = data['_courses_map'][codigo_curso]
        total_horas = curso.get('_blocks_needed', len(asignaciones))
        
        # Verificar si está fragmentado
        periodos = [p for p, _, _ in asignaciones]
        bloques = obtener_periodos_consecutivos(periodos, data)
        bloques_tamanos = [len(b) for b in bloques]
        bloques_tamanos.sort()
        
        tiene_fragmentacion = False
        if total_horas % 2 == 0 and 1 in bloques_tamanos:
            tiene_fragmentacion = True
        elif total_horas % 2 != 0 and bloques_tamanos.count(1) > 1:
            tiene_fragmentacion = True
        
        # NUEVA CONDICIÓN: Bloques demasiado grandes (>2)
        if any(b > 2 for b in bloques_tamanos):
            tiene_fragmentacion = True
            
        if tiene_fragmentacion:
             # Reconstrucción forzada del curso
             # 1. Borrar asignaciones actuales
             # 2. Reasignar usando lógica de bloques
             
             if asignaciones:
                 _, aula_base, prof_base = asignaciones[0] 
             else:
                 # Should not happen
                 aula_base, prof_base = "", ""
                 
             nuevas_asignaciones = []
             tipo_curso = curso.get('_course_component', 'teoria')
             composicion_ideal = calcular_agrupacion_optima_bloques(total_horas, tipo_curso)
             
             curso_reparado = True
             
             
             # Mantener registro de lo asignado en esta reparación
             asignados_en_reparacion = set()
             
             # Pre-filtrar aulas por tipo para no buscar en todas
             aulas_validas_tipo = []
             aulas_disponibles = data['_aulas_list']
             tipo_aula_req = curso.get('room_type', 'TEORIA') # O 'LAB'
             estudiantes = curso.get('estudiantes', 30)
             
             for aula_obj in aulas_disponibles:
                 a_id = aula_obj['id']
                 # Chequear tipo y capacidad (Hard Constraints estáticas)
                 # Mapa global de aulas está en data['_aulas_map']? No, necesitamos info.
                 # data['_aulas_list'] es lista de IDs.
                 # data.json tiene estructura completa.
                 # Asumimos que data['_aulas_map'] existe o lo reconstruimos rapido
                 # Pero 'run_ga' tiene 'global_aula_map' en scope global? Sí.
                 aula_info = global_aula_map.get(a_id, {})
                 if aula_info.get('tipo') == tipo_aula_req and aula_info.get('capacidad', 0) >= estudiantes:
                     aulas_validas_tipo.append(a_id)
             
             if not aulas_validas_tipo:
                  # Si no hay aulas del tipo, mantener la original como fallback
                  if asignaciones: aulas_validas_tipo = [asignaciones[0][1]]
                  else: aulas_validas_tipo = list(aulas_disponibles) # Panic
             
             for tamano in composicion_ideal:
                 bloque_resuelto = None # (candidatos_p, aula_elegida)
                 
                 # BÚSQUEDA EXHAUSTIVA (Shuffled)
                 indices_busqueda = list(range(len(periodos_disponibles) - tamano + 1))
                 random.shuffle(indices_busqueda)
                 
                 # Intentar encontrar hueco
                 for inicio in indices_busqueda:
                     candidatos = []
                     geo_ok = True
                     dia_ref = obtener_dia_periodo(periodos_disponibles[inicio])
                     
                     for k in range(tamano):
                         p = periodos_disponibles[inicio + k]
                         if obtener_dia_periodo(p) != dia_ref:
                             geo_ok = False; break
                         if k > 0:
                             prev = periodos_disponibles[inicio + k - 1]
                             if calcular_diferencia_horas(prev, p) != 1:
                                 geo_ok = False; break
                         candidatos.append(p)
                     
                     if not geo_ok: continue
                     
                     # VALIDACIÓN H11: Separación
                     separacion_ok = True
                     for p_cand in candidatos:
                         idx_cand = periodos_disponibles.index(p_cand)
                         if idx_cand > 0:
                             prev = periodos_disponibles[idx_cand - 1]
                             if prev in asignados_en_reparacion and obtener_dia_periodo(prev) == dia_ref:
                                 separacion_ok = False; break
                         if idx_cand < len(periodos_disponibles) - 1:
                             post = periodos_disponibles[idx_cand + 1]
                             if post in asignados_en_reparacion and obtener_dia_periodo(post) == dia_ref:
                                 separacion_ok = False; break
                     
                     if not separacion_ok: continue
                     
                     # VALIDACIÓN RECURSOS (Aula y Prof)
                     # Buscar UN aula válida para este bloque
                     aula_encontrada = None
                     
                     # Check Profesor availability first (optimization)
                     prof_ok = True
                     if prof_base:
                          disp = data['_profs_map'][prof_base].get('disponibilidad', [])
                          for p_test in candidatos:
                              # Chequear disponibilidad y ocupación
                              # Ocupación global se actualiza al final del individuo?
                              # Aquí 'asignaciones' viejas ya las ignoramos.
                              # Pero conflictos con OTROS cursos:
                              # NO tenemos el estado global de ocupación de profs ACTUALIZADO instante a instante
                              # porque 'run_ga' no pasa la "ocupación global actual del individuo" a las funcs de reparación de forma limpia.
                              # 'individuo' tiene todo.
                              # Calcular conflictos on-the-fly es caro.
                              # Asumimos que si reparamos fragmentación, ignoramos momentaneamente conflictos externos H2/H4
                              # O intentamos minimizarlos?
                              # Si verificamos H2, es O(N).
                              # POR AHORA: Ignorar conflictos con otros cursos (el GA lo arreglará luego)
                              # Solo chequear disponibilidad estática (time constraints)
                              if disp and p_test not in disp:
                                  prof_ok = False; break
                     
                     if not prof_ok: continue
                     
                     # Buscar aula
                     random.shuffle(aulas_validas_tipo)
                     for a_test in aulas_validas_tipo:
                         # Chequear ocupación interna?
                         # (Ya garantizamos que 'candidatos' son nuevos periodos, no chocan con 'asignados_en_reparacion')
                         # Ignorar conflictos externos H4.
                         aula_encontrada = a_test
                         break
                     
                     if aula_encontrada:
                         bloque_resuelto = (candidatos, aula_encontrada)
                         break
                 
                 if bloque_resuelto:
                     candidatos, aula_sel = bloque_resuelto
                     for p in candidatos:
                         nuevas_asignaciones.append((p, aula_sel, prof_base))
                         asignados_en_reparacion.add(p)
                 else:
                     # Fallback
                     count_tries = 0
                     aula_fallback = aulas_validas_tipo[0] if aulas_validas_tipo else "P1" # default
                     while count_tries < 20:
                         p_rand = random.choice(periodos_disponibles)
                         if p_rand not in asignados_en_reparacion:
                             nuevas_asignaciones.append((p_rand, aula_fallback, prof_base))
                             asignados_en_reparacion.add(p_rand)
                             break
                         count_tries += 1

            
             nuevo_individuo[codigo_curso] = nuevas_asignaciones
             
    return nuevo_individuo

def reparar_individuo(individuo: Dict[str, List[Tuple[Period, AulaID, str]]], 
                     data: Dict[str, Any]) -> Dict[str, List[Tuple[Period, AulaID, str]]]:
    """
    Repara violaciones críticas de restricciones duras en un individuo.
    
    Args:
        individuo: Solución a reparar
        data: Datos del problema
        
    Returns:
        dict: Individuo reparado
    """
    nuevo_individuo = copy.deepcopy(individuo)
    aulas_disponibles = data['_aulas_list']
    
    # Reparar conflictos de aula (H4) - más crítico
    conflictos_aula = defaultdict(lambda: defaultdict(list))
    for codigo_curso, asignaciones in nuevo_individuo.items():
        for indice, (periodo, aula, profesor) in enumerate(asignaciones):
            conflictos_aula[aula][periodo].append((codigo_curso, indice))
    
    # Resolver conflictos reasignando aulas
    for aula, mapa_periodos in conflictos_aula.items():
        for periodo, lista_conflictos in mapa_periodos.items():
            if len(lista_conflictos) <= 1:
                continue
            
            # Encontrar tipo de aula requerido
            tipo_aula = None
            for info_aula in aulas_disponibles:
                if info_aula['id'] == aula:
                    tipo_aula = info_aula['tipo']
                    break
            
            # Buscar aulas alternativas del mismo tipo
            aulas_alternativas = [
                a['id'] for a in aulas_disponibles 
                if a['tipo'] == tipo_aula and a['id'] != aula
            ]
            
            # Reasignar conflictos (mantener el primero, reasignar los demás)
            for codigo_curso, indice in lista_conflictos[1:]:
                if aulas_alternativas:
                    nueva_aula = random.choice(aulas_alternativas)
                    periodo_orig, aula_orig, prof_orig = nuevo_individuo[codigo_curso][indice]
                    nuevo_individuo[codigo_curso][indice] = (periodo_orig, nueva_aula, prof_orig)
                    
                    print(f"🔧 Reparación: {codigo_curso} reasignado de {aula_orig} a {nueva_aula}", 
                          file=sys.stderr)
    
    return nuevo_individuo

# ============================================================================
# OPERADORES GENÉTICOS
# ============================================================================

def seleccion_torneo(poblacion: List[Dict], fitness_values: List[float], 
                    k: int = TOURNAMENT_K) -> Dict:
    """
    Selección por torneo para elegir un padre.
    
    Args:
        poblacion: Lista de individuos
        fitness_values: Lista de valores de fitness (menor es mejor)
        k: Tamaño del torneo
        
    Returns:
        dict: Individuo seleccionado
    """
    participante_actual = random.randrange(len(poblacion))
    mejor_participante = participante_actual
    mejor_fitness = fitness_values[participante_actual]
    
    # Realizar torneo con k-1 participantes adicionales
    for _ in range(k - 1):
        nuevo_participante = random.randrange(len(poblacion))
        if fitness_values[nuevo_participante] < mejor_fitness:
            mejor_participante = nuevo_participante
            mejor_fitness = fitness_values[nuevo_participante]
    
    return copy.deepcopy(poblacion[mejor_participante])

def cruce_uniforme(padre1: Dict, padre2: Dict, data: Dict[str, Any]) -> Tuple[Dict, Dict]:
    """
    Operador de cruce uniforme que intercambia cursos completos entre padres.
    
    Args:
        padre1, padre2: Individuos padres
        data: Datos del problema
        
    Returns:
        Tuple[Dict, Dict]: Dos individuos hijos
    """
    hijo1, hijo2 = {}, {}
    
    # Para cada curso, elegir aleatoriamente de qué padre heredar
    for codigo_curso in data['_courses_map'].keys():
        if random.random() < 0.5:
            hijo1[codigo_curso] = copy.deepcopy(padre1[codigo_curso])
            hijo2[codigo_curso] = copy.deepcopy(padre2[codigo_curso])
        else:
            hijo1[codigo_curso] = copy.deepcopy(padre2[codigo_curso])
            hijo2[codigo_curso] = copy.deepcopy(padre1[codigo_curso])
    
    return hijo1, hijo2

def mutacion_adaptativa(individuo: Dict, data: Dict[str, Any], 
                       prob_mutacion: float = MUTATION_PROB) -> Dict:
    """
    Operador de mutación que puede cambiar período, aula, o profesor.
    Respeta las restricciones de tipo de aula y disponibilidad de profesores.
    
    Args:
        individuo: Individuo a mutar
        data: Datos del problema
        prob_mutacion: Probabilidad de mutación por curso
        
    Returns:
        dict: Individuo mutado
    """
    nuevo_individuo = copy.deepcopy(individuo)
    periodos_disponibles = data['periodos']
    aulas_disponibles = data['_aulas_list']
    
    for codigo_curso in nuevo_individuo.keys():
        if random.random() < prob_mutacion:
            asignaciones = nuevo_individuo[codigo_curso]
            if not asignaciones:
                continue
            
            tipo_mutacion = random.choice([1, 2, 3])  # 1: Período (Bloque), 2: Aula, 3: Profesor
            
            # Obtener bloques actuales para manipularlos como unidad
            periodos_asignados = [p for p, _, _ in asignaciones]
            bloques_periodos = obtener_periodos_consecutivos(periodos_asignados, data)
            
            # Mapear periodos a indices en la lista de asignaciones original
            mapa_indices = {} # periodo -> indice en asignaciones
            for i, (p, a, prof) in enumerate(asignaciones):
                mapa_indices[p] = i
            
            if tipo_mutacion == 1:  # Mover BLOQUE de tiempo completo
                if not bloques_periodos:
                    continue
                    
                # Elegir un bloque al azar
                bloque_a_mover = random.choice(bloques_periodos)
                tamano_bloque = len(bloque_a_mover)
                
                # Buscar nuevo inicio válido para el bloque
                # Intentos limitados para no bloquear
                for _ in range(10): 
                    inicio_idx = random.randrange(len(periodos_disponibles) - tamano_bloque + 1)
                    
                    # Verificar si los periodos candidatos son consecutivos y del mismo día
                    candidatos = []
                    es_valido = True
                    dia_ref = obtener_dia_periodo(periodos_disponibles[inicio_idx])
                    
                    for k in range(tamano_bloque):
                        p_cand = periodos_disponibles[inicio_idx + k]
                        if obtener_dia_periodo(p_cand) != dia_ref:
                            es_valido = False
                            break
                        # Verificar continuidad horaria (asumiendo lista ordenada)
                        if k > 0:
                            prev = periodos_disponibles[inicio_idx + k - 1]
                            if calcular_diferencia_horas(prev, p_cand) != 1:
                                es_valido = False
                                break
                        candidatos.append(p_cand)
                    
                    if es_valido:
                        # VERIFICAR COLISION CON OTROS BLOQUES DEL MISMO CURSO (H11 - Hard Mutation Check)
                        # Identificar periodos que NO se mueven
                        otros_periodos = set(periodos_asignados) - set(bloque_a_mover)
                        
                        # Verificar si alguno de los candidatos es adyacente a 'otros_periodos'
                        colision_interna = False
                        # Solo chequear adyacencia si hay otros bloques
                        if otros_periodos:
                            dia_candidato = obtener_dia_periodo(candidatos[0])
                            for p_cand in candidatos:
                                # Check neighbors
                                try:
                                    idx_cand = periodos_disponibles.index(p_cand)
                                except ValueError:
                                    continue # Should not happen
                                
                                # Prev
                                if idx_cand > 0:
                                    prev = periodos_disponibles[idx_cand - 1]
                                    if prev in otros_periodos and obtener_dia_periodo(prev) == dia_candidato:
                                        colision_interna = True; break
                                
                                # Next
                                if idx_cand < len(periodos_disponibles) - 1:
                                    post = periodos_disponibles[idx_cand + 1]
                                    if post in otros_periodos and obtener_dia_periodo(post) == dia_candidato:
                                        colision_interna = True; break
                        
                        if colision_interna:
                            es_valido = False
                            continue
                            
                        # Aplicar cambio a todo el bloque
                        for i_k, p_old in enumerate(bloque_a_mover):
                            idx_original = mapa_indices.get(p_old)
                            if idx_original is not None:
                                _, aula_old, prof_old = nuevo_individuo[codigo_curso][idx_original]
                                nuevo_individuo[codigo_curso][idx_original] = (candidatos[i_k], aula_old, prof_old)
                        break

            elif tipo_mutacion == 2:  # Cambiar aula (Consistente para el bloque si es posible)
                info_curso = data['_courses_map'][codigo_curso]
                tipo_aula_requerido = info_curso.get('aula_tipo', 'T')
                aulas_compatibles = [
                    a['id'] for a in aulas_disponibles 
                    if a['tipo'] == tipo_aula_requerido
                ]
                
                if aulas_compatibles:
                    nueva_aula = random.choice(aulas_compatibles)
                    # Aplicar a TODAS las asignaciones del curso para mantener consistencia de aula (opcional pero deseable)
                    # O aplicar a un bloque aleatorio
                    if bloques_periodos:
                        bloque_a_cambiar = random.choice(bloques_periodos)
                        for p in bloque_a_cambiar:
                             idx = mapa_indices.get(p)
                             if idx is not None:
                                 p_act, _, prof_act = nuevo_individuo[codigo_curso][idx]
                                 nuevo_individuo[codigo_curso][idx] = (p_act, nueva_aula, prof_act)
            
            elif tipo_mutacion == 3:  # Cambiar profesor
                info_curso = data['_courses_map'][codigo_curso]
                profesores_curso = info_curso.get('profesores', [])
                if profesores_curso:
                    nuevo_profesor = random.choice(profesores_curso)
                    # Cambiar profesor para TODO el curso
                    for i in range(len(asignaciones)):
                        p, a, _ = nuevo_individuo[codigo_curso][i]
                        nuevo_individuo[codigo_curso][i] = (p, a, nuevo_profesor)
    
    return nuevo_individuo


# ============================================================================
# ALGORITMO GENÉTICO PRINCIPAL
# ============================================================================

def ejecutar_algoritmo_genetico(data: Dict[str, Any]) -> Tuple[Dict, Dict]:
    """
    Ejecuta el algoritmo genético completo para resolver el problema de horarios.
    
    Args:
        data: Datos del problema procesados
        
    Returns:
        Tuple[Dict, Dict]: (mejor_solucion, diagnosticos)
    """
    # 🚀 APLICAR PARÁMETROS OPTIMIZADOS PARA CONVERGENCIA RÁPIDA
    ajustar_parametros_convergencia_rapida()
    
    print("🚀 Iniciando Algoritmo Genético para Programación de Horarios", file=sys.stderr)
    print(f"📊 Parámetros: Pop={POP_SIZE}, Gen={GENERATIONS}, Torneo={TOURNAMENT_K}", file=sys.stderr)
    
    # Inicializar población usando TSSP
    poblacion = inicializar_poblacion_tssp(data)
    
    # Evaluar población inicial
    fitness_values = []
    diagnosticos_poblacion = []
    
    print("🔍 Evaluando población inicial...", file=sys.stderr)
    for individuo in poblacion:
        fitness, diagnosticos = evaluar_solucion(individuo, data)
        fitness_values.append(fitness)
        diagnosticos_poblacion.append(diagnosticos)
    
    # Encontrar el mejor individuo inicial
    indice_mejor = min(range(len(poblacion)), key=lambda i: fitness_values[i])
    mejor_individuo = copy.deepcopy(poblacion[indice_mejor])
    mejor_fitness = fitness_values[indice_mejor]
    
    print(f"✅ Mejor fitness inicial: {mejor_fitness:.2f}", file=sys.stderr)
    print(f"📈 Desglose inicial: Duro={diagnosticos_poblacion[indice_mejor]['costo_duro']}, "
          f"Blando={diagnosticos_poblacion[indice_mejor]['costo_blando']}", file=sys.stderr)

    # Evolución generacional
    for generacion in range(1, GENERATIONS + 1):
        nueva_poblacion = [copy.deepcopy(mejor_individuo)]  # Elitismo
        
        # Generar nueva población
        while len(nueva_poblacion) < POP_SIZE:
            # Selección de padres
            padre1 = seleccion_torneo(poblacion, fitness_values)
            padre2 = seleccion_torneo(poblacion, fitness_values)
            
            # Cruce con probabilidad
            if random.random() < CROSSOVER_PROB:
                hijo1, hijo2 = cruce_uniforme(padre1, padre2, data)
            else:
                hijo1, hijo2 = copy.deepcopy(padre1), copy.deepcopy(padre2)
            
            # Mutación
            hijo1 = mutacion_adaptativa(hijo1, data)
            hijo2 = mutacion_adaptativa(hijo2, data)
            
            # Reparación de conflictos críticos
            hijo1 = reparar_individuo(hijo1, data)
            hijo2 = reparar_individuo(hijo2, data)
            
            # Reparación de fragmentación (H10) -> ELEVADA PROBABILIDAD para asegurar consistencia
            if random.random() < 0.8: # 80% chance
                hijo1 = reparar_fragmentacion_tiempo(hijo1, data)
                hijo2 = reparar_fragmentacion_tiempo(hijo2, data)
            
            # Agregar a la nueva población
            nueva_poblacion.append(hijo1)
            if len(nueva_poblacion) < POP_SIZE:
                nueva_poblacion.append(hijo2)
        
        # Actualizar población
        poblacion = nueva_poblacion
        fitness_values = []
        diagnosticos_poblacion = []
        
        # Evaluar nueva población
        for individuo in poblacion:
            fitness, diagnosticos = evaluar_solucion(individuo, data)
            fitness_values.append(fitness)
            diagnosticos_poblacion.append(diagnosticos)
        
        # Actualizar mejor solución
        indice_mejor_actual = min(range(len(poblacion)), key=lambda i: fitness_values[i])
        if fitness_values[indice_mejor_actual] < mejor_fitness:
            mejor_fitness = fitness_values[indice_mejor_actual]
            mejor_individuo = copy.deepcopy(poblacion[indice_mejor_actual])
            print(f"🎯 [Gen {generacion}] Nuevo mejor fitness: {mejor_fitness:.2f}", file=sys.stderr)
        
        # Reporte de progreso
        if generacion % 50 == 0:
            promedio = sum(fitness_values) / len(fitness_values)
            print(f"📊 Gen {generacion}: Mejor={mejor_fitness:.2f}, Promedio={promedio:.2f}", file=sys.stderr)
    
    # Evaluación final
    fitness_final, diagnosticos_finales = evaluar_solucion(mejor_individuo, data)
    
    print("🏁 ALGORITMO GENÉTICO COMPLETADO", file=sys.stderr)
    print(f"🏆 Fitness final: {fitness_final:.2f}", file=sys.stderr)
    print(f"📊 Diagnósticos finales: {dict(diagnosticos_finales)}", file=sys.stderr)
    
    return mejor_individuo, diagnosticos_finales

# ============================================================================
# CONVERSIÓN DE SALIDA A JSON
# ============================================================================

def convertir_solucion_a_json(solucion: Dict[str, List[Tuple[Period, AulaID, str]]], 
                             data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convierte la solución interna del GA al formato JSON de salida.
    
    Args:
        solucion: Solución del algoritmo genético
        data: Datos del problema
        
    Returns:
        dict: Horario en formato JSON de salida
    """
    mapa_cursos = data['_courses_map']
    mapa_aulas = {a['id']: a for a in data['_aulas_list']}
    
    entradas_horario = []
    
    # Procesar cada curso y sus asignaciones
    for codigo_curso, asignaciones in solucion.items():
        info_curso = mapa_cursos.get(codigo_curso, {})
        if not info_curso:
            continue
        
        for (periodo, aula, profesor) in asignaciones:
            # Parsear el período "DIA_HH:MM_HH:MM"
            try:
                partes = periodo.split("_")
                dia = partes[0]
                hora_inicio = partes[1]
                hora_fin = partes[2]
            except IndexError:
                print(f"⚠️  Formato de período inválido: {periodo}", file=sys.stderr)
                continue
            
            # Determinar tipo de aula
            info_aula = mapa_aulas.get(aula, {})
            tipo_aula = "THEORY" if info_aula.get('tipo') == 'T' else "LAB"
            
            # Crear entrada del horario
            entrada = {
                "course_code": info_curso.get('original_code', codigo_curso.split('_')[0]),
                "course_name": info_curso.get('nombre', codigo_curso),
                "year": info_curso.get('year', 0),
                "day_of_week": dia,
                "start_time": hora_inicio,
                "end_time": hora_fin,
                "classroom_code": aula,
                "classroom_type": tipo_aula,
                "professor_id": profesor if profesor else None,
                "student_count": info_curso.get('estudiantes', 0)
            }
            entradas_horario.append(entrada)
    
    # Ordenar horario por día, hora y curso
    orden_dias = {"LUN": 1, "MAR": 2, "MIE": 3, "JUE": 4, "VIE": 5, "SAB": 6, "DOM": 7}
    entradas_horario.sort(
        key=lambda x: (
            orden_dias.get(x['day_of_week'], 8), 
            x['start_time'], 
            x['course_code']
        )
    )
    
    # Calcular estadísticas
    cursos_unicos = set()
    for codigo in solucion.keys():
        if codigo in mapa_cursos:
            codigo_original = mapa_cursos[codigo].get('original_code', codigo)
            cursos_unicos.add(codigo_original)
    
    total_sesiones = sum(len(asignaciones) for asignaciones in solucion.values())
    
    return {
        "metadata": data.get('metadata', {}),
        "schedule": entradas_horario,
        "statistics": {
            "total_courses": len(cursos_unicos),
            "total_sessions": total_sesiones,
            "courses_with_theory": len([c for c in mapa_cursos.values() if c.get('_course_component') == 'teoria']),
            "courses_with_lab": len([c for c in mapa_cursos.values() if c.get('_course_component') == 'laboratorio'])
        }
    }

def main():
    global POP_SIZE, GENERATIONS, TOURNAMENT_K, CROSSOVER_PROB, MUTATION_PROB

    parser = argparse.ArgumentParser()
    parser.add_argument('--pop', type=int, default=POP_SIZE)
    parser.add_argument('--gens', type=int, default=GENERATIONS)
    parser.add_argument('--tournament', type=int, default=TOURNAMENT_K)
    parser.add_argument('--crossover', type=float, default=CROSSOVER_PROB)
    parser.add_argument('--mutation', type=float, default=MUTATION_PROB)
    args = parser.parse_args()

    POP_SIZE = args.pop
    GENERATIONS = args.gens
    TOURNAMENT_K = args.tournament
    CROSSOVER_PROB = args.crossover
    MUTATION_PROB = args.mutation

    # 🔹 Imprimir parámetros de debug en stderr
    import sys
    print("===== Parámetros recibidos =====", file=sys.stderr)
    print(f"POP_SIZE = {POP_SIZE}", file=sys.stderr)
    print(f"GENERATIONS = {GENERATIONS}", file=sys.stderr)
    print(f"TOURNAMENT_K = {TOURNAMENT_K}", file=sys.stderr)
    print(f"CROSSOVER_PROB = {CROSSOVER_PROB}", file=sys.stderr)
    print(f"MUTATION_PROB = {MUTATION_PROB}", file=sys.stderr)
    print("===============================", file=sys.stderr)

    # 🔹 Leer JSON desde stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error al leer JSON de entrada: {e}", file=sys.stderr)
        sys.exit(1)

    # Detectar formato
    if 'periodos' in input_data and 'periodos' not in input_data.get('periods', []):
        # Es formato español / interno
        print("ℹ️  Detectado formato de entrada español", file=sys.stderr)
        data = convert_spanish_input_format(input_data)
    else:
        # Convertir al formato interno (API)
        data = convert_input_format(input_data)

    # Ejecutar GA
    best, diag = ejecutar_algoritmo_genetico(data)
    
    # ---------------------------------------------------------
    # FASE FINAL: REPARACIÓN DETERMINISTA OBLIGATORIA (H10/H11)
    # ---------------------------------------------------------
    print(f"🧹 Ejecutando reparación final mandatoria...", file=sys.stderr)
    mapa_aulas = {a['id']: a for a in data['_aulas_list']}
    
    # Iterar hasta que no haya cambios o límite
    for iteration in range(10): # 10 pases
        cambios = False
        for codigo_curso, asignaciones in best.items():
            if not asignaciones: continue
            
            # Detectar bloques
            periodos = [p for p, _, _ in asignaciones]
            bloques = obtener_periodos_consecutivos(periodos, data)
            
            
            # Chequear cada bloque
            violacion = False
            bloque_malo = None
            for b in bloques:
                if len(b) > MAX_CONSECUTIVE_BLOCKS:
                    violacion = True
                    bloque_malo = b
                    break 

            
            if violacion:
                # Intentar partir el bloque malo
                # Tomar los periodos excedentes (por encima de 2)
                # O simplemente tomar el segundo sub-bloque de 2 y moverlo
                # Estrategia: Tomar todo el bloque y reasignarlo en trozos separados
                
                # Identificar indices originales
                indices_bloque = []
                for p in bloque_malo:
                    for i, (pi, _, _) in enumerate(asignaciones):
                        if pi == p:
                            indices_bloque.append(i)
                            break
                indices_bloque.sort()
                
                # Componentes
                curso = data['_courses_map'].get(codigo_curso, {})
                estudiantes = curso.get('estudiantes', 30)
                tipo_aula_req = curso.get('room_type', 'TEORIA')
                prof = asignaciones[indices_bloque[0]][2] # Mismo profe
                
                # Separar en chunks de max 2
                chunks = []
                temp = []
                for p in bloque_malo:
                    temp.append(p)
                    if len(temp) == 2:
                        chunks.append(temp)
                        temp = []
                if temp: chunks.append(temp)
                
                # El primer chunk se queda donde está (si es válido), los demás se mueven
                # Para simplificar: Mover TODOS los chunks buscando espacio
                # Borrar asignaciones viejas de este bloque
                nuevas_asignaciones = [x for k, x in enumerate(asignaciones) if k not in indices_bloque]
                
                # Buscar espacio para cada chunk
                asignados_temp = set(p for p,_,_ in nuevas_asignaciones)
                
                # Aulas candidatas
                aulas_candidatas = [a['id'] for a in data['_aulas_list'] 
                                    if a['tipo'] == tipo_aula_req and a['capacidad'] >= estudiantes]
                if not aulas_candidatas: aulas_candidatas = list(mapa_aulas.keys())
                
                exito_total = True
                asignaciones_reparadas = []
                
                for chunk in chunks:
                    chunk_size = len(chunk)
                    encontrado = False
                    
                    # Buscar en todos los periodos y aulas
                    inds_p = list(range(len(data['periodos']) - chunk_size + 1))
                    random.shuffle(inds_p)
                    
                    for start_idx in inds_p:
                        # Verificar geometría
                        p_cands = []
                        valid_geo = True
                        dia_ref = obtener_dia_periodo(data['periodos'][start_idx])
                        for k in range(chunk_size):
                            pct = data['periodos'][start_idx + k]
                            if obtener_dia_periodo(pct) != dia_ref: valid_geo=False; break
                            if k>0:
                                prv = data['periodos'][start_idx + k -1]
                                if calcular_diferencia_horas(prv, pct) != 1: valid_geo=False; break
                            p_cands.append(pct)
                        
                        if not valid_geo: continue
                        
                        # Verificar Adyacencia con asignados_temp
                        colision = False
                        for pc in p_cands:
                             idx_pc = data['periodos'].index(pc)
                             # Prev
                             if idx_pc > 0:
                                 prv = data['periodos'][idx_pc - 1]
                                 if prv in asignados_temp and obtener_dia_periodo(prv) == dia_ref:
                                     colision=True; break
                             # Post
                             if idx_pc < len(data['periodos']) - 1:
                                 nxt = data['periodos'][idx_pc + 1]
                                 if nxt in asignados_temp and obtener_dia_periodo(nxt) == dia_ref:
                                     colision=True; break
                        
                        if colision: continue
                        
                        # Verificar Recurso (Aula/Prof) -> Solo Hard Time Constraints para Prof
                        prof_busy = False
                        if prof:
                             disp = data['_profs_map'][prof].get('disponibilidad', [])
                             if disp:
                                 for pc in p_cands:
                                     if pc not in disp: prof_busy=True; break
                        if prof_busy: continue
                        
                        # Find room
                        aula_sel = None
                        for aid in aulas_candidatas:
                             aula_sel = aid
                             break
                        
                        if aula_sel:
                             encontrado = True
                             for pc in p_cands:
                                 asignaciones_reparadas.append((pc, aula_sel, prof))
                                 asignados_temp.add(pc)
                             break
                    
                    if not encontrado:
                        # print(f"   -> ❌ No se encontró espacio para chunk de {chunk_size}", file=sys.stderr)
                        exito_total = False
                        break
                
                if exito_total:
                    best[codigo_curso] = nuevas_asignaciones + asignaciones_reparadas
                    cambios = True
                    # print(f"   -> ✅ Curso {codigo_curso} REPARADO.", file=sys.stderr)

        
        if not cambios:
            break
            
    # Re-evaluar para estadísticas

  
    # Convertir solución a JSON
    output_json = convertir_solucion_a_json(best, data)

    # 🔹 Imprimir solo el JSON final en stdout (Node lo parseará)
    print(json.dumps(output_json, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
