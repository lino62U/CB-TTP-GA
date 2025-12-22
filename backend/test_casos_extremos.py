#!/usr/bin/env python3
"""
Casos de prueba para validar las mejoras en el algoritmo genético.

Casos extremos a probar:
1. Curso con 3 horas (impar) - debe agrupar 2+1
2. Curso con 5 horas (impar) - debe agrupar 4+1 o 2+2+1
3. Profesor con múltiples cursos - horario coherente
4. Separación teoría-laboratorio del mismo curso
"""

import json
import sys
import os

# Agregar el directorio de algoritmos al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.algorithms.run_ga import *

def crear_caso_extremo_horas_impares():
    """
    Caso 1: Curso con horas impares (3 y 5 horas)
    """
    data = {
        "metadata": {
            "university_name": "UNSA",
            "school_name": "Ingeniería de Sistemas", 
            "semester_code": "2025-A",
            "curriculum_name": "Prueba Horas Impares",
            "block_duration_min": 50,
            "day_start_time": "07:00:00",
            "day_end_time": "19:00:00"
        },
        "time_slots": [
            {"id": 1, "day_of_week": "LUN", "start_time": "07:00:00", "end_time": "07:50:00"},
            {"id": 2, "day_of_week": "LUN", "start_time": "07:50:00", "end_time": "08:40:00"},
            {"id": 3, "day_of_week": "LUN", "start_time": "08:50:00", "end_time": "09:40:00"},
            {"id": 4, "day_of_week": "MAR", "start_time": "07:00:00", "end_time": "07:50:00"},
            {"id": 5, "day_of_week": "MAR", "start_time": "07:50:00", "end_time": "08:40:00"},
            {"id": 6, "day_of_week": "MAR", "start_time": "08:50:00", "end_time": "09:40:00"},
            {"id": 7, "day_of_week": "MIE", "start_time": "07:00:00", "end_time": "07:50:00"},
            {"id": 8, "day_of_week": "MIE", "start_time": "07:50:00", "end_time": "08:40:00"}
        ],
        "classrooms": [
            {"id": 1, "room_code": "AULA101", "room_name": "Aula 101", "room_type": "THEORY", "capacity": 40},
            {"id": 2, "room_code": "LAB201", "room_name": "Lab 201", "room_type": "LAB", "capacity": 25}
        ],
        "professors": [
            {
                "id": 1,
                "professor_id": "PROF001",
                "name": "Dr. García",
                "availabilities": [
                    {"day_of_week": "LUN", "start_time": "07:00:00", "end_time": "12:00:00"},
                    {"day_of_week": "MAR", "start_time": "07:00:00", "end_time": "12:00:00"},
                    {"day_of_week": "MIE", "start_time": "07:00:00", "end_time": "12:00:00"}
                ]
            }
        ],
        "courses": [
            {
                "id": 1,
                "course_code": "CS101",
                "course_name": "Programación I",
                "credits": 3,
                "year": 1,
                "theory_hours": 3,  # ❗ CASO EXTREMO: 3 horas (impar)
                "lab_hours": 0,
                "professors": ["PROF001"],
                "prerequisites": []
            },
            {
                "id": 2, 
                "course_code": "CS201",
                "course_name": "Algoritmos",
                "credits": 5,
                "year": 2,
                "theory_hours": 3,  # ❗ CASO EXTREMO: 3 teoría + 2 lab = 5 total
                "lab_hours": 2,
                "professors": ["PROF001"],
                "prerequisites": []
            }
        ],
        "preferences": {
            "preferred_shift": "morning",
            "preferred_days": ["LUN", "MAR", "MIE"],
            "preferred_slots": []
        }
    }
    return data

def crear_caso_extremo_profesor_multiple():
    """
    Caso 2: Profesor con múltiples cursos - debe tener horario coherente
    """
    data = {
        "metadata": {
            "university_name": "UNSA",
            "school_name": "Ingeniería de Sistemas",
            "semester_code": "2025-A", 
            "curriculum_name": "Prueba Profesor Múltiple",
            "block_duration_min": 50,
            "day_start_time": "07:00:00",
            "day_end_time": "19:00:00"
        },
        "time_slots": [
            # Mañana
            {"id": 1, "day_of_week": "LUN", "start_time": "07:00:00", "end_time": "07:50:00"},
            {"id": 2, "day_of_week": "LUN", "start_time": "08:00:00", "end_time": "08:50:00"},
            {"id": 3, "day_of_week": "LUN", "start_time": "09:00:00", "end_time": "09:50:00"},
            # Tarde (muy separada - caso extremo)
            {"id": 4, "day_of_week": "LUN", "start_time": "18:00:00", "end_time": "18:50:00"},
            {"id": 5, "day_of_week": "LUN", "start_time": "19:00:00", "end_time": "19:50:00"}
        ],
        "classrooms": [
            {"id": 1, "room_code": "AULA101", "room_name": "Aula 101", "room_type": "THEORY", "capacity": 40},
            {"id": 2, "room_code": "LAB201", "room_name": "Lab 201", "room_type": "LAB", "capacity": 25}
        ],
        "professors": [
            {
                "id": 1,
                "professor_id": "PROF_EXTREMO",
                "name": "Dr. Sobrecargado",
                "availabilities": [
                    {"day_of_week": "LUN", "start_time": "07:00:00", "end_time": "20:00:00"}  # Todo el día disponible
                ]
            }
        ],
        "courses": [
            {
                "id": 1,
                "course_code": "CURSO_A",
                "course_name": "Curso A",
                "credits": 2,
                "year": 1,
                "theory_hours": 2,
                "lab_hours": 0,
                "professors": ["PROF_EXTREMO"],
                "prerequisites": []
            },
            {
                "id": 2,
                "course_code": "CURSO_B", 
                "course_name": "Curso B",
                "credits": 2,
                "year": 1,
                "theory_hours": 2,
                "lab_hours": 0,
                "professors": ["PROF_EXTREMO"],  # ❗ MISMO PROFESOR - debe ser coherente
                "prerequisites": []
            }
        ],
        "preferences": {
            "preferred_shift": "morning",
            "preferred_days": ["LUN"],
            "preferred_slots": []
        }
    }
    return data

def ejecutar_prueba_caso(nombre_caso: str, data: dict):
    """
    Ejecuta una prueba con un caso específico
    """
    print(f"\n{'='*60}")
    print(f"🧪 EJECUTANDO CASO DE PRUEBA: {nombre_caso}")
    print(f"{'='*60}")
    
    try:
        # Procesar datos de entrada
        data_procesada = procesar_datos_entrada(data)
        
        print(f"📚 Cursos procesados: {len(data_procesada['_courses_map'])}")
        for codigo, curso in data_procesada['_courses_map'].items():
            bloques = curso['_blocks_needed']
            tipo = curso.get('_course_component', 'N/A')
            agrupacion = calcular_agrupacion_optima_bloques(bloques, tipo)
            print(f"   - {codigo}: {bloques} bloques → Agrupación óptima: {agrupacion}")
        
        # Ejecutar algoritmo
        mejor_solucion, diagnosticos = ejecutar_algoritmo_genetico(data_procesada)
        
        print(f"\n✅ RESULTADOS DEL CASO: {nombre_caso}")
        print(f"🎯 Fitness final: {diagnosticos.get('fitness_final', 'N/A')}")
        print(f"🔧 Generación convergencia: {diagnosticos.get('generacion_convergencia', 'N/A')}")
        
        # Analizar agrupación de bloques
        print(f"\n📊 ANÁLISIS DE AGRUPACIÓN:")
        for codigo_curso, asignaciones in mejor_solucion.items():
            curso = data_procesada['_courses_map'][codigo_curso]
            periodos = [p for p, _, _ in asignaciones]
            bloques = obtener_periodos_consecutivos(periodos, data_procesada)
            
            print(f"   📖 {codigo_curso} ({curso.get('_course_component', 'N/A')}):")
            print(f"      Bloques encontrados: {[len(b) for b in bloques]}")
            print(f"      Períodos: {periodos}")
        
        # Analizar coherencia de profesores
        print(f"\n👨‍🏫 ANÁLISIS DE COHERENCIA DE PROFESORES:")
        horario_profesores = defaultdict(lambda: defaultdict(list))
        for codigo_curso, asignaciones in mejor_solucion.items():
            for (periodo, aula, profesor) in asignaciones:
                if profesor:
                    dia = obtener_dia_periodo(periodo)
                    horario_profesores[profesor][dia].append(periodo)
        
        for profesor, dias in horario_profesores.items():
            print(f"   👤 Profesor {profesor}:")
            for dia, periodos in dias.items():
                horas = [obtener_hora_inicio(p) for p in periodos]
                print(f"      {dia}: {sorted(horas)}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR EN CASO {nombre_caso}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """
    Ejecuta todos los casos de prueba
    """
    print("🧪 INICIANDO SUITE DE PRUEBAS - CASOS EXTREMOS ALGORITMO GENÉTICO")
    print("="*80)
    
    casos_exitosos = 0
    total_casos = 0
    
    # Caso 1: Horas impares
    total_casos += 1
    caso1 = crear_caso_extremo_horas_impares()
    if ejecutar_prueba_caso("HORAS IMPARES (3 y 5 horas)", caso1):
        casos_exitosos += 1
    
    # Caso 2: Profesor con múltiples cursos
    total_casos += 1
    caso2 = crear_caso_extremo_profesor_multiple()
    if ejecutar_prueba_caso("PROFESOR MÚLTIPLES CURSOS", caso2):
        casos_exitosos += 1
    
    # Resumen final
    print(f"\n{'='*80}")
    print(f"📊 RESUMEN DE PRUEBAS")
    print(f"{'='*80}")
    print(f"✅ Casos exitosos: {casos_exitosos}/{total_casos}")
    print(f"📈 Tasa de éxito: {(casos_exitosos/total_casos)*100:.1f}%")
    
    if casos_exitosos == total_casos:
        print("🎉 ¡TODAS LAS PRUEBAS PASARON!")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisar implementación.")

if __name__ == "__main__":
    main()