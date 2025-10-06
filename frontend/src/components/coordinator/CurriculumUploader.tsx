// components/coordinator/CurriculumUploader.tsx
import React, { useState } from 'react';
import Card from '../common/Card';
import { Upload } from 'lucide-react';
import { uploadCurriculum } from '../../services/coordinatorService';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

const CurriculumUploader: React.FC = () => {
  const [fileErrorNotified] = useState(false); // Ref simple como state para este comp
  const { addNotification } = useNotifications();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await uploadCurriculum(file);
        addNotification(`Archivo '${file.name}' cargado con éxito.`, 'success');
      } catch (error) {
        if (!fileErrorNotified) {
          if (axios.isAxiosError(error) && !error.response) {
            addNotification('Error de red: No se pudo subir el archivo.', 'error');
          } else {
            addNotification('Error al cargar el archivo.', 'error');
          }
        }
      }
    }
  };

  return (
    <Card title="Cargar Malla Curricular" icon={<Upload />}>
      <p className="text-sm text-gray-500 mb-4">
        Seleccione el archivo .csv o .xlsx con la información de los cursos.
      </p>
      <input
        type="file"
        accept=".csv, .xlsx"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-white hover:file:bg-primary"
      />
    </Card>
  );
};

export default CurriculumUploader;