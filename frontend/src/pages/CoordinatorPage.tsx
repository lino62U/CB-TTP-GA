// pages/CoordinatorPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ResourceManager from '../components/coordinator/ResourceManager';
import CurriculumUploader from '../components/coordinator/CurriculumUploader';
import TeachersList from '../components/coordinator/TeachersList';
import AlgorithmRunner from '../components/coordinator/AlgorithmRunner';
import SchedulesDisplay from '../components/coordinator/SchedulesDisplay';
import Button from '../components/common/Button';
import type { AlgorithmParams, Infrastructure, Timetable, TeacherInfo, Room } from '../types';
import {
  getTeachers,
  runScheduleAlgorithm,
  getSavedSchedule,
  saveSchedule
} from '../services/coordinatorService';
import { useNotifications } from '../hooks/useNotifications';
import { Download, Save } from 'lucide-react';
import { exportSchedulesToExcel } from '../services/coordinatorService';
const CoordinatorPage: React.FC = () => {
  const [infrastructure, setInfrastructure] = useState<Infrastructure>({
    classrooms: [
      { id: 'c1', name: 'Salón 101', capacity: 40 },
      { id: 'c2', name: 'Salón 102', capacity: 35 },
    ],
    labs: [{ id: 'l1', name: 'Lab de Cómputo A', capacity: 25 }],
  });

  const [params, setParams] = useState<AlgorithmParams>({
    population: 100,
    generations: 200,
    tournament: 3,
    crossover: 0.8,
    mutationRate: 0.2,
    semester: 'B',
  });

  const [schedules, setSchedules] = useState<{ [year: string]: Timetable } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const teachersErrorNotified = useRef(false);
  const { addNotification } = useNotifications();

  const handleExport = () => {
    if (!schedules) {
      addNotification('No hay horarios para exportar.', 'warning');
      return;
    }
    exportSchedulesToExcel(schedules);
    addNotification('Horarios exportados a Excel con éxito.', 'success');
  };

  // === Cargar docentes ===
  useEffect(() => {
    const fetchTeachers = async () => {
      setTeachersError(null);
      try {
        const response = await getTeachers();
        setTeachers(response.data);
        teachersErrorNotified.current = false;
      } catch (error) {
        if (!teachersErrorNotified.current) {
          const msg = 'Error al cargar la lista de docentes.';
          setTeachersError(msg);
          addNotification(msg, 'error');
          teachersErrorNotified.current = true;
        }
      }
    };
    fetchTeachers();
  }, [addNotification]);

  // === Cargar horario guardado desde la BD ===
  useEffect(() => {
    const fetchSavedSchedule = async () => {
      try {
        const saved = await getSavedSchedule();
        if (saved && saved.schedules) {
          setSchedules(saved.schedules);
          addNotification('Horario cargado desde la base de datos.', 'info');
        } else {
          addNotification('No hay horarios guardados disponibles.', 'warning');
        }
      } catch (error) {
        addNotification('Error al cargar el horario guardado.', 'error');
      } finally {
        setIsLoadingSchedule(false);
      }
    };
    fetchSavedSchedule();
  }, [addNotification]);

  // === Manejadores de infraestructura ===
  const handleRoomChange = useCallback(
    (type: 'classrooms' | 'labs', index: number, field: keyof Omit<Room, 'id'>, value: string) => {
      setInfrastructure(prev => {
        const newRooms = [...prev[type]];
        newRooms[index] = {
          ...newRooms[index],
          [field]: field === 'capacity' ? Number(value) : value,
        };
        return { ...prev, [type]: newRooms };
      });
    },
    []
  );

  const addRoom = useCallback((type: 'classrooms' | 'labs') => {
    setInfrastructure(prev => {
      const newRoom: Room = {
        id: `${type.slice(0, 1)}${Date.now()}`,
        name:
          type === 'classrooms'
            ? `Salón ${prev.classrooms.length + 101}`
            : `Lab ${String.fromCharCode(65 + prev.labs.length)}`,
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

  // === Parámetros del algoritmo ===
  const handleParamsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setParams(prev => ({
        ...prev,
        [name]:
          name === 'population' ||
          name === 'generations' ||
          name === 'mutationRate'
            ? Number(value)
            : value,
      }));
    },
    []
  );


  
  const handleRunAlgorithm = async (params: AlgorithmParams) => {
    setIsLoading(true);
    try {
      const result = await runScheduleAlgorithm(params);
      setSchedules(result);
    } catch (error) {
      console.error('Error al ejecutar el algoritmo:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  // === Guardar horario generado ===
  const handleSaveSchedule = useCallback(async () => {
    if (!schedules) {
      addNotification('No hay horario para guardar.', 'warning');
      return;
    }
    try {
      await saveSchedule({
        schedules,
        params,
        infrastructure,
        timestamp: new Date().toISOString(),
      });
      addNotification('Horario guardado correctamente.', 'success');
    } catch (error) {
      addNotification('Error al guardar el horario.', 'error');
    }
  }, [schedules, params, infrastructure, addNotification]);

  // === Render ===
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="w-[90%] mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">
            Panel del Coordinador Académico
          </h1>
          <p className="text-gray-600">
            Administre la infraestructura, docentes y genere horarios académicos de forma automática.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <ResourceManager
              infrastructure={infrastructure}
              onRoomChange={handleRoomChange}
              onAddRoom={addRoom}
              onRemoveRoom={removeRoom}
            />
            <CurriculumUploader />
            <TeachersList teachers={teachers} error={teachersError} />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <AlgorithmRunner
              params={params}
              onParamsChange={handleParamsChange}
              onRunAlgorithm={handleRunAlgorithm}
              isLoading={isLoading}
            />

            {isLoadingSchedule ? (
              <p className="text-gray-500 text-center">Cargando horario guardado...</p>
            ) : schedules ? (
              <SchedulesDisplay schedules={schedules} />
            ) : (
              <p className="text-center text-gray-500 italic">
                No hay horarios generados o guardados.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3 mt-6 sticky bottom-0 bg-gray-50 py-4 z-10 border-t border-gray-200">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveSchedule}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Horario
              </Button>

              <Button
                onClick={handleExport}
                size="md"
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorPage;