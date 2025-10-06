// services/courseService.ts
import api from '../config/axios';
import type { Course } from '../types'; // Asume { id: string; name: string }

/**
 * Obtiene la lista de todos los cursos disponibles desde el backend.
 * @returns La respuesta de la API con la lista de cursos.
 */
export const getCourses = (): Promise<{ data: Course[] }> => {
  return api.get('/courses');
};