import { useContext } from 'react';
import { CourseContext } from '../context/CourseContext'; // Adjusted path to match the correct folder structure

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses debe ser utilizado dentro de un CourseProvider');
  }
  return context;
};
