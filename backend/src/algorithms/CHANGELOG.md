# Changelog - Mejoras al Algoritmo Genético CB-TTP-GA

## 🚀 Versión Mejorada - Octubre 2024

### ✨ Nuevas Características

#### 1. **Separación Teoría-Laboratorio**
- **H9**: Nueva restricción dura que impide que teoría y laboratorio del mismo curso se programen el mismo día
- Separación mínima de 4 horas entre componentes del mismo curso
- Validación automática durante la construcción TSSP

#### 2. **Mínimo de Bloques por Curso**
- **H8**: Nueva restricción que garantiza al menos 2 bloques por curso
- Validación durante la conversión de datos de entrada
- Penalización por déficit de bloques

#### 3. **Bloques Consecutivos Obligatorios**
- **H10**: Nueva restricción dura que requiere bloques consecutivos de 2-4 horas
- Elimina asignaciones de bloques unitarios (1 hora)
- Garantiza sesiones continuas y eficientes de enseñanza
- Validación por grupos de períodos consecutivos por día

#### 4. **Restricciones Blandas Adicionales**
- **S3**: Distribución semanal equilibrada (evita concentrar todas las sesiones en un día)
- **S4**: Evita sesiones consecutivas del mismo curso
- Mejor manejo de franjas extremas (antes de 7 AM, después de 7 PM)

### 🔧 Mejoras Técnicas

#### 1. **Código Reorganizado y Documentado**
- Comentarios en español con explicaciones claras
- Funciones renombradas con nombres más descriptivos
- Estructura modular con secciones bien definidas
- Documentación completa de parámetros y valores de retorno

#### 2. **Algoritmo TSSP Mejorado**
- `verificar_restricciones_duras_slot()`: Validación más robusta
- `calcular_costo_restricciones_blandas_slot()`: Cálculo optimizado
- `asignar_curso_tssp()`: Lógica de asignación mejorada con mejor manejo de errores

#### 3. **Función de Evaluación Optimizada**
- `evaluar_solucion()`: Evaluación completa con nuevas restricciones
- Diagnósticos más detallados y organizados
- Mejor separación entre costos duros y blandos

#### 4. **Operadores Genéticos Mejorados**
- `seleccion_torneo()`: Selección más eficiente
- `cruce_uniforme()`: Cruce que preserva la integridad de los cursos
- `mutacion_adaptativa()`: Mutación que respeta restricciones de tipo

#### 5. **Sistema de Reparación Inteligente**
- `reparar_individuo()`: Reparación específica de conflictos de aula
- Mejor manejo de recursos limitados
- Logging de reparaciones realizadas

### 📊 Mejoras en Logging y Diagnósticos

#### 1. **Logging Estructurado**
- Emojis para mejor identificación visual
- Progreso detallado por fases
- Diagnósticos de errores más claros

#### 2. **Estadísticas Mejoradas**
- Desglose detallado de costos (duros vs blandos)
- Conteo de cursos con teoría y laboratorio
- Métricas de separación teoría-laboratorio

#### 3. **Validación de Entrada y Salida**
- Validación robusta del JSON de entrada
- Verificación de contenido en la salida
- Manejo de errores con mensajes descriptivos

### 🎯 Parámetros de Configuración

#### Nuevas Constantes
```python
MIN_SEPARATION_HOURS = 4      # Separación mínima teoría-laboratorio
MIN_BLOCKS_PER_COURSE = 2     # Mínimo bloques por curso
```

#### Pesos de Restricciones Actualizados
```python
'restricciones_duras': {
    'separacion_teoria_lab': 500000,       # H9: Nueva
    'minimo_bloques_curso': 1000000,       # H8: Nueva
    'bloques_consecutivos': 1000000,       # H10: Nueva
    # ... restricciones existentes
}

'restricciones_blandas': {
    'distribucion_semanal': 4,             # S3: Nueva
    'evitar_sesiones_consecutivas': 3,     # S4: Nueva
    # ... restricciones existentes
}
```

### 🚫 Restricciones Implementadas

#### Restricciones Duras (Hard Constraints)
- **H2**: No solapamiento de profesores ✅
- **H3**: Disponibilidad de profesores ✅
- **H4**: No solapamiento de aulas ✅
- **H5**: Capacidad de aulas ✅
- **H6**: Tipo de aula requerido ✅
- **H7**: Carga horaria correcta ✅
- **H8**: Mínimo bloques por curso ✅ **NUEVO**
- **H9**: Separación teoría-laboratorio ✅ **NUEVO**
- **H10**: Bloques consecutivos (2-4 horas) ✅ **NUEVO**

#### Restricciones Blandas (Soft Constraints)
- **S1**: Minimización de huecos por profesor ✅
- **S2**: Turno preferido por estudiantes ✅
- **S3**: Distribución semanal equilibrada ✅ **NUEVO**
- **S4**: Evitar sesiones consecutivas ✅ **NUEVO**
- **S6**: Evitar franjas extremas ✅

### 🔄 Compatibilidad

- ✅ Mantiene compatibilidad completa con la API existente
- ✅ Formato JSON de entrada y salida sin cambios
- ✅ Parámetros de línea de comandos preservados
- ✅ Integración con Node.js sin modificaciones

### 📈 Mejoras de Rendimiento

- Uso de `set()` para búsquedas O(1) en disponibilidad de profesores
- Optimización de estructuras de datos globales
- Mejor distribución de la carga computacional
- Inicialización TSSP más eficiente

### 🎉 Resultado Final

El código ha pasado de **747 líneas** desorganizadas a un sistema **modular, documentado y extensible** que:

1. ✅ **Cumple con todas las restricciones solicitadas**
2. ✅ **Está completamente comentado en español**
3. ✅ **Tiene una estructura clara y mantenible**
4. ✅ **Incluye validación robusta de errores**
5. ✅ **Proporciona logging detallado del progreso**
6. ✅ **Implementa las nuevas restricciones de separación**
7. ✅ **Mantiene compatibilidad total con el sistema existente**

---

*Esta versión mejorada del algoritmo genético CB-TTP-GA representa una evolución significativa en términos de funcionalidad, mantenibilidad y robustez del código.*
