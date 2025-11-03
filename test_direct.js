// Test directo de la lógica de comparación

// Datos reales del backend
const backendSlot = {
    "id": 19,
    "day_of_week": "JUE",
    "start_time": "1970-01-01T07:00:00.000Z",
    "end_time": "1970-01-01T07:50:00.000Z"
};

// TIME_BLOCKS del frontend
const frontendBlock = { start: "07:00", end: "07:50" };
const day = "JUE";

// Función del componente
const extractTime = (isoDateTime) => {
    return isoDateTime.substring(11, 19);
};

// Crear clave como en el componente (BACKEND)
const startTime = extractTime(backendSlot.start_time);
const endTime = extractTime(backendSlot.end_time);
const backendKey = `${backendSlot.day_of_week}_${startTime}_${endTime}`;

// Crear clave de búsqueda como en el componente (FRONTEND)
const frontendKey = `${day}_${frontendBlock.start}:00_${frontendBlock.end}:00`;

console.log('=== COMPARACIÓN DE CLAVES ===');
console.log('Backend slot start_time:', backendSlot.start_time);
console.log('Extracted start_time:', startTime);
console.log('Backend key:', backendKey);
console.log('Frontend key:', frontendKey);
console.log('¿Coinciden?:', backendKey === frontendKey);

// El problema puede estar en el formato
console.log('\n=== ANÁLISIS DE FORMATO ===');
console.log('Backend start_time extraído:', startTime);
console.log('Frontend esperado:', `${frontendBlock.start}:00`);
console.log('¿Coinciden las horas?:', startTime === `${frontendBlock.start}:00`);

if (backendKey !== frontendKey) {
    console.log('\n❌ PROBLEMA ENCONTRADO:');
    console.log('Las claves no coinciden, por eso aparece como no disponible');
}
