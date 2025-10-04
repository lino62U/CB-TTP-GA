import api from '../config/axios';
import type { TeacherData } from '../utils/typescopy';

/**
 * Envía los datos del formulario del docente al backend.
 * @param data - Objeto con la información del docente.
 * @returns La respuesta de la API.
 */
export const saveTeacherData = (data: TeacherData) => {
  return api.post('/teacher-data', data);
};
