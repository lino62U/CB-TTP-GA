import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { Course } from '../types/index';
import { getCourses as fetchCoursesAPI } from '../services/courseService';
import axios from 'axios';

interface CourseContextType {
  courses: Course[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await fetchCoursesAPI();
      setCourses(response.data);
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('Error de red: No se pudo conectar al servidor.');
      } else {
        setError('No se pudieron cargar los cursos desde el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <CourseContext.Provider value={{ courses, loading, error, reload: loadCourses }}>
      {children}
    </CourseContext.Provider>
  );
};
