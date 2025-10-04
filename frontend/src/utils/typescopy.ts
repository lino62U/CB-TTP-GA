export interface Course {
  id: string;
  name: string;
}

export type Day = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export type ShiftPreference = 'Mañana' | 'Tarde' | 'Indistinto';

export interface Availability {
  [key: string]: string[]; // e.g., { 'Lunes': ['7:00 - 7:50', ...], ... }
}

export interface TeacherData {
  fullName: string;
  email: string;
  courses: string[];
  availability: Availability;
  shiftPreference: ShiftPreference;
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

export interface AlgorithmParams {
  population: number;
  generations: number;
  mutationRate: number;
}

export interface TimetableEntry {
  day: Day;
  timeSlot: string;
  course: string;
  teacher: string;
  room: string;
  type: 'Teoría' | 'Práctica' | 'Laboratorio';
}

export type Timetable = TimetableEntry[];