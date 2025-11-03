// types/index.ts (agrega o actualiza)
export interface AlgorithmParams {
  population: number;
  generations: number;
  mutationRate: number;
  semester: string;
  tournament: number;
  crossover: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface Infrastructure {
  classrooms: Room[];
  labs: Room[];
}

export interface TimetableEntry {
  day: string;
  timeSlot: string;
  course: string;
  teacher: string;
  room: string;
  type: string;
}
//export type Timetable = TimetableEntry[]; // Para compatibilidad

export type Timetable = TimetableEntry[];

// Interfaces específicas del código original
export interface TeacherInfo {
  id: number;
  fullName: string;
  availableSlots: number;
}

export interface ScheduleResult {
  per_curriculum: { [year: string]: { [courseCode: string]: { period: string; aula: string }[] } };
  courses: { [courseCode: string]: { nombre: string; profesor: string; aula_tipo: string } };
}


export type Day = 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB';

// Teachers page
export interface Course {
  id: string;
  name: string;
}

export interface TeacherData {
  fullName: string;
  email: string;
  courses: string[]; // Nombres de cursos
  shiftPreference: 'Mañana' | 'Tarde' | 'Indistinto';
  availability: Availability;
}

export interface Availability {
  [day: string]: { [timeSlot: string]: boolean };
}