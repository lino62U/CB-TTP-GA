# Tabla de restricciones y penalizaciones (lista técnica lista para usar en un algoritmo)

Abajo tienes una **lista clara y estructurada** de restricciones duras y blandas pensada para implementar en un algoritmo genético, simulated annealing o ILP. Incluyo **una propuesta de peso/penalización numérica** (puedes ajustar en función de la magnitud de tus instancias) y **fórmulas o criterios** para calcular la penalización en cada violación.

> Nota: las **restricciones duras** deben modelarse como **inviables** o con una penalización enorme (M) (ej. (M = 10^6)) para que el optimizador las evite a toda costa. Las **blandas** suman penalizaciones pequeñas que el algoritmo buscará minimizar.

---

## 1) Restricciones duras (Hard constraints) — **no violables**

Modelado: si se viola cualquiera, la solución es inválida (o sumar (M) por violación).

| ID | Nombre                  | Descripción                                                | Cómo detectarla                                                  | Penalización sugerida                          |
| -- | ----------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| H1 | Conflicto de currículo  | Dos cursos del mismo currículo asignados al mismo periodo  | Si `cursoA.semestre == cursoB.semestre` y `periodoA == periodoB` | Inviable (o (+M) por conflicto)                |
| H2 | Conflicto de profesor   | Un profesor asignado a 2+ clases en el mismo periodo       | Mismo `profesor` y `periodo`                                     | Inviable (o (+M) por conflicto)                |
| H3 | Disponibilidad profesor | Profesor asignado fuera de sus franjas disponibles         | `periodo ∉ disponibilidad(profesor)`                             | Inviable (o (+M) por asignación)               |
| H4 | Conflicto de aula       | Una aula reservada por más de un curso en el mismo periodo | `aula == aula'` y `periodo == periodo'`                          | Inviable (o (+M) por conflicto)                |
| H5 | Capacidad de aula       | Número de estudiantes > capacidad del aula                 | `num_alumnos > capacidad(aula)`                                  | Inviable (o (+M) por curso)                    |
| H6 | Tipo de aula requerido  | Curso teórico/lab requiere aula específica (lab)           | `tipo(aula) != tipo_requerido(curso)`                            | Inviable (o (+M) por curso)                    |
| H7 | Carga horaria del curso | No cumplir horas semanales o número de sesiones requerido  | Comparar horas asignadas vs horas requeridas                     | Inviable (o (+M) por diferencia significativa) |

---

## 2) Restricciones blandas (Soft constraints) — **violables con costo**

Modelado: sumar penalizaciones; el objetivo es minimizar la suma total.

> Convención: `pen(c)` será la función de penalización por violación del soft `c`. Debes elegir escalas para que el total de `pen_soft` sea razonable respecto a M.

| ID | Nombre                                                    | Descripción                                                                                           | Cómo calcular la penalización (ejemplo)                                                                           | Peso sugerido (valor base)                    |
| -- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| S1 | Horarios compactos por currículo (mínimos huecos)         | Minimizar huecos entre clases de estudiantes del mismo semestre                                       | Para cada estudiante/currículo: contar huecos (periodos libres entre clases en un día). `pen = count_huecos * w1` | `w1 = 5` por hueco                            |
| S2 | Preferencia de bloque (mañana/tarde) por currículo        | Preferencia que todas las clases del semestre estén en mañana o tarde                                 | Si un semestre tiene `p_m` mañanas y `p_t` tardes, `pen = min(p_m,p_t) * w2` (penaliza mezcla)                    | `w2 = 3` por clase fuera del bloque dominante |
| S3 | Preferencia de profesor (días/franjas)                    | Penalizar asignaciones en franjas/prohibidas por preferencia (no disponibilidad ya H3)                | Para cada asignación en franja no deseada: `pen = w3`                                                             | `w3 = 2` por asignación                       |
| S4 | Evitar concentración de carga diaria                      | Penalizar demasiadas horas de un mismo curso/semestre en un solo día                                  | Si `horas_dia > limite` entonces `pen = (horas_dia - limite) * w4`                                                | `w4 = 4` por hora extra                       |
| S5 | Balance de aulas / uso de infraestructura                 | Evitar usar siempre las mismas aulas (distribuir)                                                     | Para cada aula: `overuse = max(0, usos - uso_ideal)`; `pen = overuse * w5`                                        | `w5 = 1` por uso extra                        |
| S6 | Evitar clases en franjas extremas                         | Penalizar clases en el primer o último bloque del día                                                 | `pen = count_extremas * w6`                                                                                       | `w6 = 1` por clase extrema                    |
| S7 | Continuidad del curso (preferencia por sesiones cercanas) | Penalizar si sesiones de un mismo curso están muy separadas                                           | `pen = total_gap_hours_between_sessions * w7`                                                                     | `w7 = 2` por hora de separación               |
| S8 | Preferencia de estudiantes por horario concentrado        | Penalizar si un estudiante tiene muchas clases en mañana y pocas en tarde (si pide todo en un bloque) | `pen = number_classes_fuera_de_preferencia * w8`                                                                  | `w8 = 4` por clase fuera del bloque preferido |
| S9 | Minimizar número total de días con clases por currículo   | Prefieren menos días con actividad                                                                    | `pen = (dias_con_clase - dias_ideal) * w9` si >0                                                                  | `w9 = 2` por día extra                        |

---

## 3) Propuesta concreta de función objetivo (fitness)

Si usas **algoritmo genético** u optimizador que minimiza:

[
\text{Fitness}(\text{sol}) = \text{Violaciones_Hard} \cdot M + \sum_{i} \text{pen}_i(\text{sol})
]

* `Violaciones_Hard` = número total de violaciones duras (o 1 si quieres solo inviabilidad binaria).
* `M` = penalización enorme (ej. (10^6)) para asegurar inviabilidad.
* `pen_i` = cada una de las penalizaciones blandas de la tabla.

Opcional: normalizar cada `pen_i` por el número máximo posible para obtener valores comparables.

---

## 4) Valores iniciales recomendados (ejemplo práctico)

Estos valores son **punto de partida**. Úsalos para pruebas y ajusta por validación. La idea es: M >> suma máxima posible de `pen_soft`.

* (M = 1,000,000)
* `w1` (huecos) = 5
* `w2` (mezcla mañana/tarde) = 3
* `w3` (preferencia profesor) = 2
* `w4` (concentración diaria) = 4
* `w5` (overuse aulas) = 1
* `w6` (franjas extremas) = 1
* `w7` (separación sesiones) = 2
* `w8` (clases fuera del bloque preferido por estudiantes) = 4
* `w9` (días extra) = 2

---

## 5) Representación de la solución (sugerida)

Estructura común para un cromosoma:

* Vector/lista de tamaño `|Cursos|`, donde cada gen es una tupla:

  ```
  gen_curso_i = { periodo_id, aula_id, profesor_id (opcional si fijo) }
  ```
* Alternativa: matriz 3D `Curso × Periodo × Aula` con valores booleanos (más pesada).

Recomendación: si `profesor` es fijo por curso, no lo incluyas en el gen; si un curso puede tener varios profesores, inclúyelo.

---

## 6) Operadores (algoritmo genético) sugeridos

* **Mutación:** cambiar periodo de un curso; intercambiar aula; mover sesión a franja adyacente.
* **Cruzamiento (crossover):** mezcla por grupos (por semestre / por profesores / por bloques) para preservar bloques compactos.
* **Repair operator:** tras mutación/cruce, aplicar un “reparador” greedy que elimine violaciones obvias de H1–H6 (p. ej. reubicar cursos conflictivos a periodos libres), para acelerar convergencia.

---

## 7) Métricas de evaluación final

* Número de violaciones duras (debe ser 0).
* Valor total de `pen_soft`.
* Métricas útiles: % de semestres con horario 100% mañanas o tardes, promedio de huecos por estudiante, distribución de carga diaria.
* Validar con casos reales: tomar un semestre anterior y comprobar cuántos conflictos reales existirían.

---

## 8) Ejemplo simple en JSON (esquema de entrada para tu algoritmo)

```json
{
  "periodos": ["L_08_10", "L_10_12", "L_14_16", "..."],
  "aulas": [
    {"id": "A101", "capacidad": 60, "tipo": "teorico"},
    {"id": "LAB1", "capacidad": 30, "tipo": "laboratorio"}
  ],
  "profesores": [
    {"id": "P01", "disponibilidad": ["L_08_10","M_08_10","X_08_10"], "nombrado": true}
  ],
  "cursos": [
    {"id": "C_MAT101", "semestre": 1, "horas_semana": 4, "tipo": "teorico", "estudiantes": 55, "profesor": "P01"}
  ],
  "curriculos": {
    "IngSist_1": ["C_MAT101", "C_PROG101", "..."]
  },
  "preferencias": {
    "semestre_pref_bloque": {"IngSist_1": "mañana"}
  },
  "pesos": {"M":1000000, "w1":5, "w2":3, "w3":2, "w4":4, "w5":1, "w6":1, "w7":2, "w8":4, "w9":2}
}
```

---

## 9) Consejos prácticos para tuning y pruebas

1. **Comienza con instancias pequeñas** (1–3 semestres) para validar restricciones.
2. **Asegura que la función de evaluación penalice fuertemente duras** (M mucho mayor que suma de blandas).
3. **Prueba con distintos sets de pesos** y usa validación cruzada sobre semestres históricos.
4. **Implementa un repair greedy**: tras cada generación (o movimiento) intenta arreglar violaciones duras antes de evaluar. Mejora la búsqueda.
5. **Monitorea métricas humanas**: porcentaje de alumnos con horario compacto, número promedio de huecos, número de profesores con doble turno.
6. **Involucra stakeholders**: pide a coordinación y a 10–20 docentes validar soluciones iniciales (ajustar preferencias).

---

Si quieres, el siguiente paso lo puedo hacer ya:

* Generar **una plantilla CSV/JSON completa** con columnas para cursos, profesores, aulas y disponibilidad usando tu información real (si me la das), o
* **Implementar pseudocódigo** (o código en Python) de la función `fitness(sol)` que calcule `Violaciones_Hard` y `pen_soft` según los pesos propuestos.

¿Cuál prefieres que haga ahora?


## 10. Ejecución del proyecto
