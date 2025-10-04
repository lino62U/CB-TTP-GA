import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import type { Course } from '../utils/typescopy';
import { getCourses as fetchCoursesAPI } from '../services/coordinatorService';
import axios from 'axios';

interface CourseContextType {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetchCoursesAPI();
        setCourses(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && !err.response) {
            setError('Error de red: No se pudo conectar al servidor. Asegúrate de que el backend simulado esté en ejecución (consulta README.md).');
        } else {
            setError('No se pudieron cargar los cursos desde el servidor.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  return (
    <CourseContext.Provider value={{ courses, loading, error }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses debe ser utilizado dentro de un CourseProvider');
  }
  return context;
};