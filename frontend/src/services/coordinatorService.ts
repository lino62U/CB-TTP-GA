import api from '../config/axios';

/**
 * Obtiene la lista de todos los cursos disponibles desde el backend.
 * @returns La respuesta de la API con la lista de cursos.
 */
export const getCourses = () => {
  return api.get('/courses');
};

/**
 * Obtiene un resumen de la disponibilidad de los docentes registrados.
 * @returns La respuesta de la API con los datos de los docentes.
 */
export const getTeachers = () => {
    return api.get('/teachers');
};

/**
 * Sube el archivo de la malla curricular al backend.
 * @param file - El archivo (CSV o XLSX) que contiene el currículo.
 * @returns La respuesta de la API.
 */
export const uploadCurriculum = (file: File) => {
    const formData = new FormData();
    formData.append('curriculum', file);
    return api.post('/curriculum', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
