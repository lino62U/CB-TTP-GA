// services/coordinatorService.ts
import api from '../config/axios'; // Cambia a api en lugar de axios
import * as XLSX from 'xlsx';
import type { AlgorithmParams, Infrastructure, ScheduleResult, TimetableEntry } from '../types';

export const getTeachers = (): Promise<{ data: any[] }> => { // Tipa response si sabes el shape
  return api.get('/api/teachers');
};

export const uploadCurriculum = (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/curriculum/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }, // Necesario para files
  });
};

// Función mock para simular algoritmo (mantenla si no hay backend real aún)
export const generateMockScheduleResult = (): ScheduleResult => {
  const years = ['Primer Año', 'Segundo Año', 'Tercer Año', 'Cuarto Año', 'Quinto Año'];
  const mockCourses = {
    '1701208': { nombre: 'ESTRUCTURAS DISCRETAS II', profesor: 'Cristian', aula_tipo: 'LAB' },
    '1701209': { nombre: 'CIENCIA DE LA COMPUTACION I', profesor: 'Eliana', aula_tipo: 'LAB' },
    '1702224': { nombre: 'ALGORITMOS Y ESTRUCTURAS DE DATOS', profesor: 'Cristian', aula_tipo: 'LAB' },
    '1702225': { nombre: 'TEORIA DE LA COMPUTACION', profesor: 'Franci', aula_tipo: 'LAB' },
    '1703236': { nombre: 'PROGRAMACION COMPETITIVA', profesor: 'Wilber', aula_tipo: 'T' },
    '1703237': { nombre: 'INGENIERIA DE SOFTWARE II', profesor: 'Edgar', aula_tipo: 'LAB' },
    '1704248': { nombre: 'INTERACCION HUMANO COMPUTADOR', profesor: 'Ana Maria', aula_tipo: 'T' },
    '1704249': { nombre: 'PROYECTO DE FINAL DE CARRERA I', profesor: 'Rosa', aula_tipo: 'T' },
    '1705265': { nombre: 'CLOUD COMPUTING', profesor: 'Alvaro', aula_tipo: 'LAB' },
    '1705267': { nombre: 'TRABAJO INTERDISCIPLINAR III', profesor: 'Yessenia', aula_tipo: 'T' },
  };

  const periods = [
    'LUN_07:00_07:50', 'LUN_07:50_08:40', 'LUN_08:50_09:40', 'LUN_09:40_10:30',
    'MAR_07:00_07:50', 'MAR_07:50_08:40', 'MAR_08:50_09:40', 'MAR_09:40_10:30',
    'MIE_07:00_07:50', 'MIE_07:50_08:40', 'MIE_08:50_09:40', 'MIE_09:40_10:30',
    'JUE_07:00_07:50', 'JUE_07:50_08:40', 'JUE_08:50_09:40', 'JUE_09:40_10:30',
    'VIE_07:00_07:50', 'VIE_07:50_08:40', 'VIE_08:50_09:40', 'VIE_09:40_10:30'
  ];
  const aulas = ['T1', 'T2', 'LAB1', 'LAB2', 'LAB3'];

  const per_curriculum: ScheduleResult['per_curriculum'] = {};
  years.forEach((year, yearIndex) => {
    per_curriculum[year] = {};
    const yearCourses = Object.keys(mockCourses).slice(yearIndex * 2, (yearIndex + 1) * 2);
    yearCourses.forEach(courseCode => {
      const numBlocks = Math.floor(Math.random() * 4) + 2;
      const assignments: { period: string; aula: string }[] = [];
      for (let i = 0; i < numBlocks; i++) {
        const randomPeriod = periods[Math.floor(Math.random() * periods.length)];
        const randomAula = aulas[Math.floor(Math.random() * aulas.length)];
        assignments.push({ period: randomPeriod, aula: randomAula });
      }
      per_curriculum[year][courseCode] = assignments;
    });
  });

  return { per_curriculum, courses: mockCourses };
};

// Transforma resultado a schedules
export const transformToSchedules = (
  result: any
): { [year: string]: TimetableEntry[] } => {
  const yearSchedules: { [year: string]: TimetableEntry[] } = {};

  Object.entries(result.schedules_by_year).forEach(([year, yearData]: [string, any]) => {
    const timetable: TimetableEntry[] = [];

    yearData.schedule.forEach((s: any) => {
      timetable.push({
        day: s.day_of_week,
        timeSlot: `${s.start_time}-${s.end_time}`,
        course: s.course_name,
        teacher: s.professor.name,
        room: s.classroom_code,
        type: s.classroom_type || "THEORY",
      });
    });

    yearSchedules[year] = timetable;
  });

  return yearSchedules;
};

// Export a Excel (sin notificaciones, las maneja el page)
export const exportSchedulesToExcel = (schedules: { [year: string]: TimetableEntry[] }): void => {
  if (!schedules) return;

  const wb = XLSX.utils.book_new();
  const DAYS_OF_WEEK = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'];
  const TIME_SLOTS = [
    '07:00-07:50', '07:50-08:40', '08:50-09:40', '09:40-10:30',
    '10:40-11:30', '11:30-12:20', '14:00-14:50', '14:50-15:40',
    '15:50-16:40', '16:40-17:30', '17:40-18:30', '18:30-19:20'
  ];

  Object.entries(schedules).forEach(([year, yearTimetable]) => {
    const scheduleMap = new Map<string, string>();
    yearTimetable.forEach(entry => {
      const key = `${entry.day}-${entry.timeSlot}`;
      const content = scheduleMap.get(key) ? `${scheduleMap.get(key)}\n${entry.course} @ ${entry.room}` : `${entry.course} @ ${entry.room}`;
      scheduleMap.set(key, content);
    });

    const aoa: string[][] = [['Hora', ...DAYS_OF_WEEK]];
    TIME_SLOTS.forEach(timeSlot => {
      const row: string[] = [timeSlot];
      DAYS_OF_WEEK.forEach(day => {
        const key = `${day}-${timeSlot}`;
        row.push(scheduleMap.get(key) || '');
      });
      aoa.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, year.replace(/\s+/g, '_'));
  });

  XLSX.writeFile(wb, 'horarios_por_anio.xlsx');
};

// Run algorithm (simula delay y mock) – nota: ignora Infrastructure por ahora, agrégala si backend la usa

export const runScheduleAlgorithm = async (
  params: AlgorithmParams
): Promise<{ [year: string]: TimetableEntry[] }> => {
  try {
    const response = await fetch("http://localhost:4000/schedule/run", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Error al ejecutar el algoritmo: ${response.statusText}`);
    }

    const result = await response.json();

    // Suponiendo que necesitas transformar la respuesta como antes
    return transformToSchedules(result);

  } catch (error) {
    console.error("Error en runScheduleAlgorithm:", error);
    throw error;
  }
};