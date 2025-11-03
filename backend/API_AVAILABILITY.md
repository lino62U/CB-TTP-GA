# API para Gestión de Disponibilidad de Profesores

Este documento describe las nuevas rutas implementadas para gestionar la disponibilidad de profesores (time slots).

## Rutas Implementadas

### 1. Obtener Time Slots Disponibles
```
GET /api/professors/time-slots
```
**Descripción:** Obtiene todos los time slots disponibles en el sistema.

**Respuesta de ejemplo:**
```json
[
  {
    "id": 1,
    "day_of_week": "LUN",
    "start_time": "07:00:00",
    "end_time": "07:50:00"
  },
  {
    "id": 2,
    "day_of_week": "LUN",
    "start_time": "07:50:00",
    "end_time": "08:40:00"
  }
]
```

### 2. Obtener Disponibilidad de un Profesor
```
GET /api/professors/:id/availability
```
**Descripción:** Obtiene todos los time slots de disponibilidad de un profesor específico.

**Parámetros:**
- `id`: ID del profesor

**Respuesta de ejemplo:**
```json
{
  "professor": {
    "id": 1,
    "name": "DR. JUAN CARLOS GUTIERREZ CACERES",
    "preferred_shift": "mañana"
  },
  "availability": [
    {
      "id": 1,
      "time_slot": {
        "id": 3,
        "day_of_week": "JUE",
        "start_time": "08:50:00",
        "end_time": "09:40:00"
      }
    },
    {
      "id": 2,
      "time_slot": {
        "id": 4,
        "day_of_week": "JUE",
        "start_time": "09:40:00",
        "end_time": "10:30:00"
      }
    }
  ]
}
```

### 3. Agregar un Time Slot a la Disponibilidad
```
POST /api/professors/:id/availability
```
**Descripción:** Agrega un nuevo time slot a la disponibilidad del profesor.

**Parámetros:**
- `id`: ID del profesor

**Body:**
```json
{
  "time_slot_id": 5
}
```

**Respuesta de ejemplo:**
```json
{
  "id": 3,
  "user_id": 1,
  "time_slot_id": 5,
  "time_slot": {
    "id": 5,
    "day_of_week": "VIE",
    "start_time": "08:50:00",
    "end_time": "09:40:00"
  },
  "user": {
    "id": 1,
    "name": "DR. JUAN CARLOS GUTIERREZ CACERES",
    "preferred_shift": "mañana"
  }
}
```

### 4. Actualizar Toda la Disponibilidad de un Profesor
```
PUT /api/professors/:id/availability
```
**Descripción:** Reemplaza toda la disponibilidad del profesor con nuevos time slots.

**Parámetros:**
- `id`: ID del profesor

**Body:**
```json
{
  "time_slot_ids": [1, 2, 3, 4]
}
```

**Respuesta de ejemplo:**
```json
{
  "professor": {
    "id": 1,
    "name": "DR. JUAN CARLOS GUTIERREZ CACERES",
    "preferred_shift": "mañana"
  },
  "availability": [
    {
      "id": 4,
      "time_slot": {
        "id": 1,
        "day_of_week": "LUN",
        "start_time": "07:00:00",
        "end_time": "07:50:00"
      }
    }
  ],
  "message": "Professor availability updated successfully"
}
```

### 5. Eliminar un Time Slot Específico
```
DELETE /api/professors/:id/availability/:availability_id
```
**Descripción:** Elimina un time slot específico de la disponibilidad del profesor.

**Parámetros:**
- `id`: ID del profesor
- `availability_id`: ID del registro de disponibilidad

**Respuesta de ejemplo:**
```json
{
  "message": "Availability removed successfully"
}
```

### 6. Limpiar Toda la Disponibilidad
```
DELETE /api/professors/:id/availability
```
**Descripción:** Elimina todos los time slots de disponibilidad del profesor.

**Parámetros:**
- `id`: ID del profesor

**Respuesta de ejemplo:**
```json
{
  "message": "All professor availability cleared successfully"
}
```

## Códigos de Error

- `400`: Datos inválidos (por ejemplo, time slot no encontrado)
- `404`: Profesor no encontrado o registro de disponibilidad no encontrado
- `409`: Conflicto (time slot ya existe en la disponibilidad del profesor)
- `500`: Error interno del servidor

## Ejemplos de Uso

### Ejemplo 1: Configurar disponibilidad completa para un profesor
```bash
# 1. Obtener todos los time slots disponibles
curl -X GET http://localhost:3000/api/professors/time-slots

# 2. Actualizar la disponibilidad completa del profesor ID 1
curl -X PUT http://localhost:3000/api/professors/1/availability \
  -H "Content-Type: application/json" \
  -d '{
    "time_slot_ids": [1, 2, 3, 4, 5, 6]
  }'

# 3. Verificar la disponibilidad
curl -X GET http://localhost:3000/api/professors/1/availability
```

### Ejemplo 2: Agregar un nuevo time slot
```bash
# Agregar un nuevo time slot al profesor ID 1
curl -X POST http://localhost:3000/api/professors/1/availability \
  -H "Content-Type: application/json" \
  -d '{
    "time_slot_id": 7
  }'
```

### Ejemplo 3: Eliminar un time slot específico
```bash
# Eliminar el registro de disponibilidad ID 5 del profesor ID 1
curl -X DELETE http://localhost:3000/api/professors/1/availability/5
```
