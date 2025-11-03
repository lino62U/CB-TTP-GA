import api from '../config/axios';
import type { 
  TimeSlot, 
  ProfessorAvailabilityResponse, 
  Professor
} from '../types/teacher';

export const availabilityService = {
  // Obtener todos los time slots disponibles
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    const response = await api.get('/professors/time-slots');
    return response.data;
  },

  // Obtener disponibilidad de un profesor
  async getProfessorAvailability(professorId: number): Promise<ProfessorAvailabilityResponse> {
    const response = await api.get(`/professors/${professorId}/availability`);
    return response.data;
  },

  // Actualizar toda la disponibilidad del profesor
  async updateProfessorAvailability(
    professorId: number, 
    timeSlotIds: number[]
  ): Promise<ProfessorAvailabilityResponse> {
    const response = await api.put(
      `/professors/${professorId}/availability`,
      { time_slot_ids: timeSlotIds }
    );
    return response.data;
  },

  // Agregar un time slot específico
  async addTimeSlot(professorId: number, timeSlotId: number) {
    const response = await api.post(
      `/professors/${professorId}/availability`,
      { time_slot_id: timeSlotId }
    );
    return response.data;
  },

  // Eliminar un time slot específico
  async removeTimeSlot(professorId: number, availabilityId: number) {
    const response = await api.delete(
      `/professors/${professorId}/availability/${availabilityId}`
    );
    return response.data;
  },

  // Obtener información del profesor
  async getProfessor(professorId: number): Promise<Professor> {
    const response = await api.get(`/professors/${professorId}`);
    return response.data;
  }
};
