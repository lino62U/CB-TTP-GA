// components/coordinator/TeachersList.tsx
import React from 'react';
import Card from '../common/Card';
import { Users } from 'lucide-react';
import type { TeacherInfo } from '../../types';

interface TeachersListProps {
  teachers: TeacherInfo[];
  error: string | null;
}

const TeachersList: React.FC<TeachersListProps> = ({ teachers, error }) => (
  <Card title="Disponibilidad de Docentes" icon={<Users />}>
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : teachers.length > 0 ? (
        teachers.map(teacher => (
          <div key={teacher.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
            <span>{teacher.fullName}</span>
            <span className="font-semibold text-primary">{teacher.availableSlots} bloques disp.</span>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No hay docentes registrados.</p>
      )}
    </div>
  </Card>
);

export default TeachersList;