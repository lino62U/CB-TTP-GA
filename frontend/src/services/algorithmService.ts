
import type { AlgorithmParams, Infrastructure, Timetable } from '../utils/type';


/**
 * Envía la configuración al backend para iniciar la generación del horario.
 * @param params - Parámetros del algoritmo genético (población, generaciones, etc.).
 * @param infrastructure - Datos de la infraestructura (salones, laboratorios).
 * @returns Una promesa que resuelve con el horario generado.
 */
export const runAlgorithm = async (
    params: AlgorithmParams,
    infrastructure: Infrastructure
): Promise<Timetable> => {
    // Simular un retraso para una mejor UX, ya que la generación real puede tardar.
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // En un escenario real, esta sería la llamada al backend.
        // const response: AxiosResponse<Timetable> = await api.post('/run-algorithm', { params, infrastructure });
        // return response.data;
        
        // --- INICIO: DATOS SIMULADOS PARA DEMOSTRACIÓN ---
        // Esto simula una respuesta exitosa del backend mientras usas json-server.
        // Puedes reemplazar esto con la llamada real comentada arriba cuando conectes un backend funcional.
        console.log("Ejecutando algoritmo con (simulado):", { params, infrastructure });
        const mockTimetable: Timetable = [
            { day: 'Lunes', timeSlot: '07:00 - 07:50', course: 'Cálculo I', teacher: 'Dr. John von Neumann', room: 'Salón 101', type: 'Teoría' },
            { day: 'Lunes', timeSlot: '07:50 - 08:40', course: 'Cálculo I', teacher: 'Dr. John von Neumann', room: 'Salón 101', type: 'Teoría' },
            { day: 'Martes', timeSlot: '10:40 - 11:30', course: 'Introducción a la Programación', teacher: 'Dr. Alan Turing', room: 'Salón 102', type: 'Teoría' },
            { day: 'Martes', timeSlot: '11:30 - 12:20', course: 'Introducción a la Programación', teacher: 'Dr. Alan Turing', room: 'Salón 102', type: 'Teoría' },
            { day: 'Miércoles', timeSlot: '08:50 - 09:40', course: 'Física I', teacher: 'Dr. John von Neumann', room: 'Salón 101', type: 'Teoría' },
            { day: 'Jueves', timeSlot: '14:00 - 14:50', course: 'Bases de Datos', teacher: 'Dra. Ada Lovelace', room: 'Lab de Cómputo A', type: 'Laboratorio' },
            { day: 'Viernes', timeSlot: '09:40 - 10:30', course: 'Estructuras de Datos y Algoritmos', teacher: 'Dra. Grace Hopper', room: 'Salón 102', type: 'Práctica' },
        ];
        return mockTimetable;
        // --- FIN: DATOS SIMULADOS ---

    } catch (error) {
        console.error("Error al ejecutar el algoritmo:", error);
        throw new Error("No se pudo generar el horario. Inténtelo de nuevo.");
    }
};
