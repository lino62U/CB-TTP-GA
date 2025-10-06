// pages/CoordinatorPage.tsx (versión refactorizada)
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ResourceManager from '../components/coordinator/ResourceManager';
import CurriculumUploader from '../components/coordinator/CurriculumUploader';
import TeachersList from '../components/coordinator/TeachersList';
import AlgorithmRunner from '../components/coordinator/AlgorithmRunner';
import SchedulesDisplay from '../components/coordinator/SchedulesDisplay';
import type { AlgorithmParams, Infrastructure, Timetable, TeacherInfo, Room } from '../types';
import { getTeachers, runScheduleAlgorithm } from '../services/coordinatorService';
import { useNotifications } from '../hooks/useNotifications';
import axios from 'axios';

const CoordinatorPage: React.FC = () => {
  const [infrastructure, setInfrastructure] = useState<Infrastructure>({
    classrooms: [{ id: 'c1', name: 'Salón 101', capacity: 40 }, { id: 'c2', name: 'Salón 102', capacity: 35 }],
    labs: [{ id: 'l1', name: 'Lab de Cómputo A', capacity: 25 }],
  });
  const [params, setParams] = useState<AlgorithmParams>({ population: 100, generations: 50, mutationRate: 0.1 });
  const [schedules, setSchedules] = useState<{ [year: string]: Timetable } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const teachersErrorNotified = useRef(false);

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

  const handleRunAlgorithm = useCallback(async (currentParams: AlgorithmParams) => {
    setIsLoading(true);
    setSchedules(null);
    try {
      const transformedSchedules = await runScheduleAlgorithm(currentParams);
      setSchedules(transformedSchedules);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Panel del Coordinador Académico</h1>
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
          <SchedulesDisplay schedules={schedules} />
        </div>
      </div>
    </div>
  );
};

export default CoordinatorPage;