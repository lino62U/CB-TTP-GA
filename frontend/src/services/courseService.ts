// services/courseService.ts
import api from '../config/axios';
import type { Course } from '../types';

/**
 * Obtiene la lista de todos los cursos disponibles desde el backend.
 * @returns La respuesta de la API con la lista de cursos.
 */
export const getCourses = async (): Promise<{ data: Course[] }> => {
  try {
    const response = await api.get('/courses');
    return response;
  } catch (error) {
    // Mock data en caso de error (no API disponible)
    console.warn('API no disponible, usando datos mock para cursos:', error);
    const mockCourses: Course[] = [
      { id: '1', name: 'Matemáticas Discretas' },
      { id: '2', name: 'Física I' },
      { id: '3', name: 'Programación Orientada a Objetos' },
      { id: '4', name: 'Base de Datos' },
      { id: '5', name: 'Algoritmos y Estructuras de Datos' },
      { id: '6', name: 'Ingeniería de Software' },
      { id: '7', name: 'Redes de Computadoras' },
      { id: '8', name: 'Inteligencia Artificial' },
    ];
    return { data: mockCourses };
  }
};