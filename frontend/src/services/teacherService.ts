// services/teacherService.ts (reemplaza o crea si no existe)
import axios from '../config/axios';
import type { TeacherData } from '../types';

export const saveTeacherData = async (data: TeacherData): Promise<void> => {
  // POST a /api/teachers (ajusta endpoint si es necesario)
  await axios.post('/api/teachers', data);
};