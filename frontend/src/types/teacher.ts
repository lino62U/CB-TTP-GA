// Tipos para la gestión de disponibilidad de profesores
export interface TimeSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface ProfessorAvailabilityItem {
  id: number;
  time_slot: TimeSlot;
}

export interface ProfessorAvailabilityResponse {
  professor: {
    id: number;
    name: string;
    preferred_shift: string | null;
  };
  availability: ProfessorAvailabilityItem[];
}

export interface Professor {
  id: number;
  name: string;
  email: string;
  role: string;
  preferred_shift: string | null;
}

// Tipos para las requests
export interface UpdateAvailabilityRequest {
  time_slot_ids: number[];
}

// Utilidades para el grid de horarios
export const TIME_BLOCKS = [
  { start: "07:00", end: "07:50" },
  { start: "07:50", end: "08:40" },
  { start: "08:50", end: "09:40" },
  { start: "09:40", end: "10:30" },
  { start: "10:40", end: "11:30" },
  { start: "11:30", end: "12:20" },
  { start: "14:00", end: "14:50" },
  { start: "14:50", end: "15:40" },
  { start: "15:50", end: "16:40" },
  { start: "16:40", end: "17:30" },
  { start: "17:40", end: "18:30" },
  { start: "18:30", end: "19:20" },
  { start: "19:20", end: "20:10" }
];

export const DAYS = ["LUN", "MAR", "MIE", "JUE", "VIE"];

export const formatTimeSlot = (timeSlot: TimeSlot): string => {
  return `${timeSlot.day_of_week} ${timeSlot.start_time.substring(0, 5)}-${timeSlot.end_time.substring(0, 5)}`;
};
