// components/teacher/PersonalInfoForm.tsx
import React from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import { User, Mail, BookOpen, Clock } from 'lucide-react';
import type { Course } from '../../types';
import { useCourses } from '../../context/CourseContext';

interface PersonalInfoFormProps {
  formData: any; // Omit<TeacherData, 'availability'>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCoursesChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  onInputChange,
  onCoursesChange,
}) => {
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();

  return (
    <Card title="Información Personal y Cursos">
      <Input
        id="fullName"
        name="fullName"
        label="Nombre Completo"
        placeholder="Ej: Ada Lovelace"
        value={formData.fullName}
        onChange={onInputChange}
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
        onChange={onInputChange}
        icon={<Mail />}
        required
      />
      <div>
        <Select
          id="courses"
          name="courses"
          label="Cursos que Dicta"
          value={formData.courses}
          onChange={onCoursesChange}
          icon={<BookOpen />}
          multiple
          required
          disabled={coursesLoading || !!coursesError}
          className="h-32"
        >
          {coursesLoading && <option>Cargando cursos...</option>}
          {coursesError && <option disabled>{coursesError}</option>}
          {!coursesLoading && !coursesError && courses.map((course: Course) => (
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
        onChange={onInputChange}
        icon={<Clock />}
      >
        <option>Mañana</option>
        <option>Tarde</option>
        <option>Indistinto</option>
      </Select>
    </Card>
  );
};

export default PersonalInfoForm;