// Tipos TypeScript para la API de disponibilidad de profesores
// Utilizar en el frontend para tipado fuerte

export interface TimeSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface Professor {
  id: number;
  name: string;
  email: string;
  role: string;
  preferred_shift: string | null;
  created_at: string;
  updated_at: string;
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

export interface AddAvailabilityRequest {
  time_slot_id: number;
}

export interface UpdateAvailabilityRequest {
  time_slot_ids: number[];
}

export interface AvailabilityResponse {
  id: number;
  user_id: number;
  time_slot_id: number;
  time_slot: TimeSlot;
  user: {
    id: number;
    name: string;
    preferred_shift: string | null;
  };
}

export interface UpdateAvailabilityResponse {
  professor: {
    id: number;
    name: string;
    preferred_shift: string | null;
  };
  availability: ProfessorAvailabilityItem[];
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Funciones helper para formatear time slots
export const formatTimeSlot = (timeSlot: TimeSlot): string => {
  return `${timeSlot.day_of_week} ${timeSlot.start_time.substring(0, 5)}-${timeSlot.end_time.substring(0, 5)}`;
};

export const groupTimeSlotsByDay = (availability: ProfessorAvailabilityItem[]): Record<string, ProfessorAvailabilityItem[]> => {
  return availability.reduce((acc, item) => {
    const day = item.time_slot.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(item);
    return acc;
  }, {} as Record<string, ProfessorAvailabilityItem[]>);
};

export const sortTimeSlots = (timeSlots: TimeSlot[]): TimeSlot[] => {
  const dayOrder = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
  
  return timeSlots.sort((a, b) => {
    const dayA = dayOrder.indexOf(a.day_of_week);
    const dayB = dayOrder.indexOf(b.day_of_week);
    
    if (dayA !== dayB) {
      return dayA - dayB;
    }
    
    return a.start_time.localeCompare(b.start_time);
  });
};
