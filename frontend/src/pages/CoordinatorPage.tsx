import React, { useState, useCallback, useEffect, useRef } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TimetableDisplay from '../components/TimetableDisplay';
import type { AlgorithmParams, Infrastructure, Timetable, Room } from '../utils/typescopy';
import { runAlgorithm } from '../services/algorithmService';
import { getTeachers, uploadCurriculum } from '../services/coordinatorService';
import { useNotifications } from '../hooks/useNotifications';
import Spinner from '../components/common/Spinner';
import { Upload, Building, Users, PlayCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

interface TeacherInfo {
  id: number;
  fullName: string;
  availableSlots: number;
}

const CoordinatorPage: React.FC = () => {
  const [infrastructure, setInfrastructure] = useState<Infrastructure>({
    classrooms: [{ id: 'c1', name: 'Salón 101', capacity: 40 }, { id: 'c2', name: 'Salón 102', capacity: 35 }],
    labs: [{ id: 'l1', name: 'Lab de Cómputo A', capacity: 25 }],
  });
  const [params, setParams] = useState<AlgorithmParams>({ population: 100, generations: 50, mutationRate: 0.1 });
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // Barra de progreso
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  const { addNotification } = useNotifications();

  const teachersErrorNotified = useRef(false);
  const fileErrorNotified = useRef(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      setTeachersError(null);
      try {
        const response = await getTeachers();
        setTeachers(response.data);
        teachersErrorNotified.current = false;
      } catch (error) {
        if (!teachersErrorNotified.current) {
          const msg = axios.isAxiosError(error) && !error.response
            ? 'Error de red. No se pudo conectar para cargar los docentes.'
            : 'No se pudo cargar la lista de docentes.';
          setTeachersError(msg);
          addNotification(msg, 'error');
          teachersErrorNotified.current = true;
        }
      }
    };
    fetchTeachers();
  }, [addNotification]);

  const handleRoomChange = useCallback((type: 'classrooms' | 'labs', index: number, field: keyof Omit<Room, 'id'>, value: string) => {
    setInfrastructure(prev => {
      const newRooms = [...prev[type]];
      newRooms[index] = { ...newRooms[index], [field]: field === 'capacity' ? Number(value) : value };
      return { ...prev, [type]: newRooms };
    });
  }, []);

  const addRoom = useCallback((type: 'classrooms' | 'labs') => {
    setInfrastructure(prev => {
      const newRoom: Room = {
        id: `${type.slice(0, 1)}${Date.now()}`,
        name: type === 'classrooms' ? `Salón ${prev.classrooms.length + 101}` : `Lab ${String.fromCharCode(65 + prev.labs.length)}`,
        capacity: 20,
      };
      return { ...prev, [type]: [...prev[type], newRoom] };
    });
  }, []);

  const removeRoom = useCallback((type: 'classrooms' | 'labs', indexToRemove: number) => {
    setInfrastructure(prev => ({
      ...prev,
      [type]: prev[type].filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const handleParamsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setParams(prev => ({ ...prev, [e.target.name]: Number(e.target.value) }));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCurriculumFile(file);
      try {
        await uploadCurriculum(file);
        addNotification(`Archivo '${file.name}' cargado con éxito.`, 'success');
        fileErrorNotified.current = false;
      } catch (error) {
        if (!fileErrorNotified.current) {
          if (axios.isAxiosError(error) && !error.response) {
            addNotification('Error de red: No se pudo subir el archivo.', 'error');
          } else {
            addNotification('Error al cargar el archivo.', 'error');
          }
          fileErrorNotified.current = true;
        }
      }
    }
  };

  const handleRunAlgorithm = async () => {
    setIsLoading(true);
    setTimetable(null);
    setProgress(0);
    addNotification('Iniciando la generación del horario...', 'info');

    // Animación de barra tipo Material UI
    const interval = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + Math.random() * 5 : prev)); // sube hasta 95% mientras se ejecuta
    }, 300);

    try {
      const result = await runAlgorithm(params, infrastructure);
      clearInterval(interval);
      setProgress(100);
      setTimetable(result);
      addNotification('¡Horario generado con éxito!', 'success');
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      addNotification(errorMessage, 'error');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  const renderProgressBar = () => (
    <div className="mt-4">
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-4 bg-gradient-to-r from-primary to-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute w-full text-center text-xs font-semibold text-gray-700 top-0">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );

  const renderRoomList = (type: 'classrooms' | 'labs') => (
    <div className="space-y-3">
      {infrastructure[type].map((room, index) => (
        <div key={room.id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-6">
            <Input
              label=""
              id={`name-${room.id}`}
              value={room.name}
              onChange={e => handleRoomChange(type, index, 'name', e.target.value)}
              placeholder="Nombre"
            />
          </div>
          <div className="col-span-4">
            <Input
              label=""
              id={`capacity-${room.id}`}
              type="number"
              value={room.capacity}
              onChange={e => handleRoomChange(type, index, 'capacity', e.target.value)}
              placeholder="Cap."
            />
          </div>
          <div className="col-span-2 pt-4">
            <Button variant="danger" size="sm" onClick={() => removeRoom(type, index)} className="w-full">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" onClick={() => addRoom(type)} className="w-full mt-2">
        Añadir {type === 'classrooms' ? 'Salón' : 'Laboratorio'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Panel del Coordinador Académico</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card title="Gestión de Recursos" icon={<Building />}>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Salones de Clases</h3>
                {renderRoomList('classrooms')}
              </div>
              <hr />
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Laboratorios</h3>
                {renderRoomList('labs')}
              </div>
            </div>
          </Card>

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

          <Card title="Disponibilidad de Docentes" icon={<Users />}>
            <div className="space-y-3">
              {teachersError ? (
                <p className="text-sm text-red-500">{teachersError}</p>
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
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card title="Generador de Horarios" icon={<PlayCircle />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input label="Población (pop)" name="population" type="number" value={params.population} onChange={handleParamsChange} />
              <Input label="Generaciones (gens)" name="generations" type="number" value={params.generations} onChange={handleParamsChange} />
              <Input label="Tasa de Mutación" name="mutationRate" type="number" step="0.01" value={params.mutationRate} onChange={handleParamsChange} />
            </div>
            <Button onClick={handleRunAlgorithm} disabled={isLoading} size="lg" className="w-full">
              {isLoading ? <><Spinner /> Generando Horario...</> : 'Ejecutar Algoritmo y Generar Horario'}
            </Button>
            {isLoading && renderProgressBar()}
          </Card>

          {timetable && (
            <Card title="Horario Generado" noPadding>
              <TimetableDisplay schedule={timetable} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorPage;
