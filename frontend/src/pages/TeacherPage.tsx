import React, { useState, useCallback } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import AvailabilityGrid from '../components/AvailabilityGrid';
import Select from '../components/common/Select';
import type { TeacherData, Availability } from '../utils/typescopy';
import { useNotifications } from '../hooks/useNotifications';
import { useCourses } from '../context/CourseContext';
import { saveTeacherData } from '../services/teacherService';
import { User, Mail, BookOpen, Clock } from 'lucide-react';
import Spinner from '../components/common/Spinner';
import axios from 'axios';

const TeacherPage: React.FC = () => {
  const [formData, setFormData] = useState<Omit<TeacherData, 'availability'>>({
    fullName: '',
    email: '',
    courses: [],
    shiftPreference: 'Indistinto',
  });
  const [availability, setAvailability] = useState<Availability>({});
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleCoursesChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setFormData(prev => ({ ...prev, courses: selectedOptions }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-6">Portal del Docente</h1>
      <p className="text-gray-600 mb-8">Complete el siguiente formulario para registrar sus cursos, disponibilidad horaria y preferencias.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <Card title="Información Personal y Cursos" >
              <Input
                id="fullName"
                name="fullName"
                label="Nombre Completo"
                placeholder="Ej: Ada Lovelace"
                value={formData.fullName}
                onChange={handleInputChange}
                icon={<User />}
                required
              />
              <Input
                id="email"
                name="email"
                type="email"
                label="Correo Institucional"
                placeholder="ej: ada.lovelace@universidad.edu"
                value={formData.email}
                onChange={handleInputChange}
                icon={<Mail />}
                required
              />
              <div>
                <Select
                  id="courses"
                  name="courses"
                  label="Cursos que Dicta"
                  value={formData.courses}
                  onChange={handleCoursesChange}
                  icon={<BookOpen />}
                  multiple
                  required
                  disabled={coursesLoading || !!coursesError}
                  className="h-32"
                >
                  {coursesLoading && <option>Cargando cursos...</option>}
                  {coursesError && <option disabled>{coursesError}</option>}
                  {!coursesLoading && !coursesError && courses.map(course => (
                    <option key={course.id} value={course.name}>{course.name}</option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1 pl-1">
                  Mantén presionado Ctrl (o Cmd en Mac) para seleccionar varios cursos.
                </p>
              </div>
               <Select
                id="shiftPreference"
                name="shiftPreference"
                label="Preferencia de Turno"
                value={formData.shiftPreference}
                onChange={handleInputChange}
                icon={<Clock />}
              >
                <option>Mañana</option>
                <option>Tarde</option>
                <option>Indistinto</option>
              </Select>
            </Card>
          </div>
          
          <div className="flex flex-col">
             <Card title="Disponibilidad Horaria" description="Seleccione los bloques en los que está disponible para dictar clases.">
                <AvailabilityGrid availability={availability} setAvailability={setAvailability} />
            </Card>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <><Spinner /> Guardando...</> : 'Guardar y Enviar Datos'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TeacherPage;