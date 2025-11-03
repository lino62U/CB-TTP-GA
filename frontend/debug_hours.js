// Script de prueba para verificar la lógica de mapeo de horarios

// Simular datos del backend
const backendTimeSlots = [
    {
        "id": 19,
        "day_of_week": "JUE",
        "start_time": "1970-01-01T07:00:00.000Z",
        "end_time": "1970-01-01T07:50:00.000Z"
    },
    {
        "id": 20,
        "day_of_week": "JUE",
        "start_time": "1970-01-01T07:50:00.000Z",
        "end_time": "1970-01-01T08:40:00.000Z"
    },
    {
        "id": 21,
        "day_of_week": "JUE",
        "start_time": "1970-01-01T08:50:00.000Z",
        "end_time": "1970-01-01T09:40:00.000Z"
    }
];

// Simular TIME_BLOCKS del frontend
const TIME_BLOCKS = [
  { start: "07:00", end: "07:50" },
  { start: "07:50", end: "08:40" },
  { start: "08:50", end: "09:40" },
];

// Función para extraer hora de fecha ISO
const extractTime = (isoDateTime) => {
    return isoDateTime.substring(11, 19); // Extrae "HH:MM:SS" de "1970-01-01THH:MM:SS.000Z"
};

// Crear mapa como en el componente
const timeSlotMap = new Map();
backendTimeSlots.forEach(slot => {
    const startTime = extractTime(slot.start_time);
    const endTime = extractTime(slot.end_time);
    const key = `${slot.day_of_week}_${startTime}_${endTime}`;
    console.log(`Creando clave: ${key}`);
    timeSlotMap.set(key, slot);
});

console.log('\n--- Mapa creado ---');
console.log('Claves en el mapa:', Array.from(timeSlotMap.keys()));

// Probar búsquedas como en el componente
console.log('\n--- Pruebas de búsqueda ---');
TIME_BLOCKS.forEach(timeBlock => {
    const day = "JUE";
    const key = `${day}_${timeBlock.start}:00_${timeBlock.end}:00`;
    const found = timeSlotMap.has(key);
    console.log(`Buscando: ${key} -> ${found ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
});

console.log('\n--- Comparación de formatos ---');
backendTimeSlots.forEach(slot => {
    const backendStart = extractTime(slot.start_time);
    const frontendFormat = backendStart.substring(0, 5); // Solo HH:MM
    console.log(`Backend: ${backendStart} -> Frontend esperado: ${frontendFormat}:00`);
});
