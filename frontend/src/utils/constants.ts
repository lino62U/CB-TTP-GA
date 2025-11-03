
import type { Course } from '../types/index';

import type { Day } from '../types/index';
export const DAYS_OF_WEEK: Day[] = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'];
export const TIME_SLOTS = [
  "07:00 - 07:50",
  "07:50 - 08:40",
  "08:50 - 09:40",
  "09:40 - 10:30",
  "10:40 - 11:30",
  "11:30 - 12:20",
  "12:20 - 13:10",
  "13:10 - 14:00",
  "14:00 - 14:50",
  "14:50 - 15:40",
  "15:50 - 16:40",
  "16:40 - 17:30",
  "17:40 - 18:30",
  "18:30 - 19:20",
  "19:20 - 20:10",
];


export const MOCK_COURSES: Course[] = [
  { id: 'cs101', name: 'Introducción a la Programación' },
  { id: 'cs201', name: 'Estructuras de Datos y Algoritmos' },
  { id: 'cs301', name: 'Bases de Datos' },
  { id: 'cs401', name: 'Sistemas Operativos' },
  { id: 'ma101', name: 'Cálculo I' },
  { id: 'ma201', name: 'Álgebra Lineal' },
  { id: 'ph101', name: 'Física I' },
];

export const MOCK_TEACHERS_AVAILABILITY = [
    { name: "Dr. Alan Turing", email: "aturing@uni.edu", courses: "CS101, CS201" },
    { name: "Dra. Ada Lovelace", email: "alovelace@uni.edu", courses: "MA101" },
    { name: "Dr. Edsger Dijkstra", email: "edijkstra@uni.edu", courses: "CS201, CS401" },
];

