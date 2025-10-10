import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown, BookOpen, X, Clock, User, MailIcon } from 'lucide-react';
import Card from '../common/Card';
import Input from '../common/Input';
import { useCourses } from '../../hooks/useCourses';
import type { Course } from '../../types';

interface PersonalInfoFormProps {
  formData: {
    fullName: string;
    email: string;
    courses: string[];
    shiftPreference: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCoursesChange: (courses: string[]) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  onInputChange,
  onCoursesChange,
}) => {
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const [query, setQuery] = useState('');

  const filteredCourses =
    query === ''
      ? courses
      : courses.filter((c) =>
          c.name.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <Card className="relative overflow-visible" title="Información Personal y Cursos">
      {/* Datos personales */}
      <Input
        id="fullName"
        name="fullName"
        label="Nombre Completo"
        placeholder="Ej: Ada Lovelace"
        value={formData.fullName}
        onChange={onInputChange}
        icon={<User size={16} />}
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
        icon={<MailIcon size={16} />}
      />

      {/* Selector de cursos */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <BookOpen size={18} /> Cursos que Dicta
        </label>

        {coursesLoading ? (
          <p className="text-sm text-gray-500">Cargando cursos...</p>
        ) : coursesError ? (
          <p className="text-sm text-red-600">{coursesError}</p>
        ) : (
          <Combobox
            value={formData.courses}
            onChange={onCoursesChange}
            multiple
          >
            <div className="relative">
              {/* Input con búsqueda */}
              <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-white text-left focus-within:ring-2 focus-within:ring-blue-400">
                <Combobox.Input
                  className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar o seleccionar cursos..."
                  displayValue={() => ''}
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                </Combobox.Button>
              </div>

              {/* Lista de opciones */}
              {filteredCourses.length > 0 && (
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/10 focus:outline-none z-10">
                  {filteredCourses.map((course: Course) => (
                    <Combobox.Option
                      key={course.id}
                      value={course.name}
                      className={({ active, selected }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                        } ${selected ? 'bg-blue-50 font-medium text-blue-700' : ''}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="block truncate">{course.name}</span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              )}
            </div>
          </Combobox>
        )}

        {/* Chips seleccionados */}
        {formData.courses.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.courses.map((course) => (
              <span
                key={course}
                className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {course}
                <button
                  type="button"
                  onClick={() =>
                    onCoursesChange(formData.courses.filter((c) => c !== course))
                  }
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Turno */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Clock size={18} /> Preferencia de Turno
        </label>
        <select
          id="shiftPreference"
          name="shiftPreference"
          value={formData.shiftPreference}
          onChange={onInputChange}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
        >
          <option>Mañana</option>
          <option>Tarde</option>
          <option>Indistinto</option>
        </select>
      </div>
    </Card>
  );
};

export default PersonalInfoForm;
