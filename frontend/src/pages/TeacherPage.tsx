// pages/TeacherPage.tsx (fixed with type alias)
import React, { useState, useCallback } from 'react';
import PersonalInfoForm from '../components/teacher/PersonalInfoForm';
import AvailabilitySection from '../components/teacher/AvailabilitySection';
import SubmitButton from '../components/teacher/SubmitButton';
import type { TeacherData, Availability } from '../types';
import { saveTeacherData } from '../services/teacherService';
import { useNotifications } from '../hooks/useNotifications';
import axios from 'axios';

type FormData = Omit<TeacherData, 'availability'>;

const TeacherPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    courses: [],
    shiftPreference: 'Indistinto',
  });
  const [availability, setAvailability] = useState<Availability>({});
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCoursesChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setFormData(prev => ({ ...prev, courses: selectedOptions }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || formData.courses.length === 0) {
      addNotification('Por favor, complete todos los campos requeridos.', 'error');
      return;
    }
    setLoading(true);
    const finalData: TeacherData = { ...formData, availability };
    
    try {
      await saveTeacherData(finalData);
      addNotification('Sus datos han sido guardados con éxito.', 'success');
      // Reset form
      setFormData({ fullName: '', email: '', courses: [], shiftPreference: 'Indistinto' });
      setAvailability({});
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        addNotification('Error de red al guardar. Verifique la conexión del backend.', 'error');
      } else {
        addNotification('Error al guardar los datos. Inténtelo de nuevo.', 'error');
      }
      console.error('Failed to submit teacher data:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, availability, addNotification]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-6">Portal del Docente</h1>
      <p className="text-gray-600 mb-8">Complete el siguiente formulario para registrar sus cursos, disponibilidad horaria y preferencias.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <PersonalInfoForm
              formData={formData}
              onInputChange={handleInputChange}
              onCoursesChange={handleCoursesChange}
            />
          </div>
          
          <div className="flex flex-col">
            <AvailabilitySection
              availability={availability}
              onAvailabilityChange={setAvailability}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <SubmitButton loading={loading} />
        </div>
      </form>
    </div>
  );
};

export default TeacherPage;