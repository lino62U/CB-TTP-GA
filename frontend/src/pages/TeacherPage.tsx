import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import AvailabilityGrid from '../components/teacher/AvailabilityGrid';
import { availabilityService } from '../services/availabilityService';
import { useNotifications } from '../hooks/useNotifications';
import type { TimeSlot, Professor } from '../types/teacher';

const TeacherPage: React.FC = () => {
  const { user } = useAuthStore();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotifications();

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        addNotification('No se encontró información del usuario', 'error');
        setLoading(false);
        return;
      }

      try {
        // Cargar todos los time slots disponibles y la disponibilidad actual del profesor
        const [allTimeSlots, professorData, availability] = await Promise.all([
          availabilityService.getAllTimeSlots(),
          availabilityService.getProfessor(user.id),
          availabilityService.getProfessorAvailability(user.id).catch(() => ({ availability: [] }))
        ]);

        setAvailableTimeSlots(allTimeSlots);
        setProfessor(professorData);
        setSelectedTimeSlots(availability.availability?.map(a => a.time_slot) || []);
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification('Error al cargar los datos', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, addNotification]);

  const handleSaveAvailability = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const timeSlotIds = selectedTimeSlots.map(slot => slot.id);
      await availabilityService.updateProfessorAvailability(user.id, timeSlotIds);
      addNotification('Disponibilidad guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving availability:', error);
      addNotification('Error al guardar la disponibilidad', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="w-[90%] mx-auto px-4 md:px-8 py-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Portal del Docente</h1>
          {professor && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{professor.name}</h2>
              <p className="text-gray-600">{professor.email}</p>
              {professor.preferred_shift && (
                <p className="text-sm text-gray-500 mt-1">
                  Turno preferido: <span className="capitalize">{professor.preferred_shift}</span>
                </p>
              )}
            </div>
          )}
          <p className="text-gray-600 mb-8">
            Seleccione sus horarios de disponibilidad haciendo clic en las celdas correspondientes.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <AvailabilityGrid
            availableTimeSlots={availableTimeSlots}
            selectedTimeSlots={selectedTimeSlots}
            onSelectionChange={setSelectedTimeSlots}
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSaveAvailability}
            disabled={saving}
            className={`
              px-8 py-3 rounded-lg font-medium transition-colors duration-200
              ${saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-white'
              }
            `}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </div>
            ) : (
              'Guardar Disponibilidad'
            )}
          </button>
        </div>
      </div>
    </div>
  );
  
};

export default TeacherPage;