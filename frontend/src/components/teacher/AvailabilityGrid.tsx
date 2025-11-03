import React from 'react';
import type { TimeSlot } from '../../types/teacher';
import { DAYS, TIME_BLOCKS } from '../../types/teacher';

interface AvailabilityGridProps {
  availableTimeSlots: TimeSlot[];
  selectedTimeSlots: TimeSlot[];
  onSelectionChange: (selectedSlots: TimeSlot[]) => void;
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  availableTimeSlots,
  selectedTimeSlots,
  onSelectionChange,
}) => {
  // Debug temporal - eliminar después
  console.log('🔍 AvailabilityGrid recibió:', {
    availableTimeSlotsCount: availableTimeSlots.length,
    selectedTimeSlotsCount: selectedTimeSlots.length,
    firstSlot: availableTimeSlots[0],
    firstSelected: selectedTimeSlots[0]
  });

  // Función helper para extraer hora de fecha ISO
  const extractTime = (isoDateTime: string): string => {
    return isoDateTime.substring(11, 19); // Extrae "HH:MM:SS" de "1970-01-01THH:MM:SS.000Z"
  };

  // Crear un mapa para acceso rápido a los time slots por día y hora
  const timeSlotMap = new Map<string, TimeSlot>();
  availableTimeSlots.forEach(slot => {
    const startTime = extractTime(slot.start_time);
    const endTime = extractTime(slot.end_time);
    const key = `${slot.day_of_week}_${startTime}_${endTime}`;
    timeSlotMap.set(key, slot);
  });

  // Crear un Set para los IDs seleccionados para acceso rápido
  const selectedIds = new Set(selectedTimeSlots.map(slot => slot.id));

  const handleCellClick = (day: string, timeBlock: { start: string; end: string }) => {
    const key = `${day}_${timeBlock.start}:00_${timeBlock.end}:00`;
    const timeSlot = timeSlotMap.get(key);
    
    if (!timeSlot) return; // No hay time slot disponible para esta celda

    const isSelected = selectedIds.has(timeSlot.id);
    let newSelectedSlots: TimeSlot[];

    if (isSelected) {
      // Remover de la selección
      newSelectedSlots = selectedTimeSlots.filter(slot => slot.id !== timeSlot.id);
    } else {
      // Agregar a la selección
      newSelectedSlots = [...selectedTimeSlots, timeSlot];
    }

    onSelectionChange(newSelectedSlots);
  };

  const isCellSelected = (day: string, timeBlock: { start: string; end: string }): boolean => {
    const key = `${day}_${timeBlock.start}:00_${timeBlock.end}:00`;
    const timeSlot = timeSlotMap.get(key);
    return timeSlot ? selectedIds.has(timeSlot.id) : false;
  };

  const isCellAvailable = (day: string, timeBlock: { start: string; end: string }): boolean => {
    const key = `${day}_${timeBlock.start}:00_${timeBlock.end}:00`;
    return timeSlotMap.has(key);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-200 sticky left-0 bg-gray-100 z-10 w-28">Horario</th>
            {DAYS.map(day => (
              <th key={day} className="p-2 border border-gray-200 whitespace-nowrap min-w-[100px]">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_BLOCKS.map((timeBlock, index) => (
            <tr key={index}>
              <td className="p-2 border border-gray-200 font-medium text-gray-600 sticky left-0 bg-white z-10 w-28">
                {timeBlock.start}-{timeBlock.end}
              </td>
              {DAYS.map(day => {
                const isAvailable = isCellAvailable(day, timeBlock);
                const isSelected = isCellSelected(day, timeBlock);
                
                return (
                  <td
                    key={`${day}-${index}`}
                    className={`
                      border border-gray-200 p-1 h-12 cursor-pointer transition-colors duration-150
                      ${!isAvailable 
                        ? 'bg-gray-200 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-primary text-white' 
                          : 'bg-white hover:bg-primary/10'
                      }
                    `}
                    onClick={() => isAvailable && handleCellClick(day, timeBlock)}
                    title={
                      !isAvailable 
                        ? 'No disponible' 
                        : isSelected 
                          ? 'Clic para deseleccionar' 
                          : 'Clic para seleccionar'
                    }
                  >
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200"></div>
          <span>No disponible</span>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <strong>Seleccionados:</strong> {selectedTimeSlots.length} bloques de tiempo
      </div>
    </div>
  );
};

export default AvailabilityGrid;