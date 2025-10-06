
import type { Course, Timetable } from '../types/index';

import type { Day } from '../types/index';
export const DAYS_OF_WEEK: Day[] = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'];
export const TIME_SLOTS = [
  "07:50-08:40",
  "08:50-09:40",
  "09:50-10:40",
  "10:50-11:40",
  "11:50-12:40",
  "12:50-13:40",
  "13:50-14:40",
  "14:50-15:40",
  "15:50-16:40",
  "16:50-17:40",
  "17:50-18:40",
  "18:50-19:40",
  "19:50-20:40",
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

export const MOCK_TIMETABLE: Timetable = {
  'LUN': {
    '7:50 - 8:40': { course: 'Cálculo I', teacher: 'Dra. Lovelace', room: 'Salón 101', type: 'Teoría' },
    '8:50 - 9:40': { course: 'Cálculo I', teacher: 'Dra. Lovelace', room: 'Salón 101', type: 'Teoría' },
    '10:40 - 11:30': { course: 'Intro a Programación', teacher: 'Dr. Turing', room: 'Lab A', type: 'Laboratorio' },
  },
  'MAR': {
    '8:50 - 9:40': { course: 'Estructuras de Datos', teacher: 'Dr. Dijkstra', room: 'Salón 202', type: 'Teoría' },
    '9:40 - 10:30': { course: 'Estructuras de Datos', teacher: 'Dr. Dijkstra', room: 'Salón 202', type: 'Teoría' },
    '14:00 - 14:50': { course: 'Intro a Programación', teacher: 'Dr. Turing', room: 'Salón 105', type: 'Práctica' },
  },
  'MIE': {
    '7:00 - 7:50': { course: 'Sistemas Operativos', teacher: 'Dr. Dijkstra', room: 'Lab B', type: 'Laboratorio' },
    '10:40 - 11:30': { course: 'Cálculo I', teacher: 'Dra. Lovelace', room: 'Salón 101', type: 'Práctica' },
  },
};
