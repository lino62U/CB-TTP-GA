
export type View = 'HOME' | 'TEACHER' | 'COORDINATOR';

export interface Course {
  id: string;
  name: string;
}

export enum ShiftPreference {
  MORNING = 'Mañana',
  AFTERNOON = 'Tarde',
  INDIFFERENT = 'Indistinto',
}

export type Availability = {
  [day: string]: {
    [timeSlot: string]: boolean;
  };
};

export interface TeacherData {
  fullName: string;
  email: string;
  courses: string[];
  availability: Availability;
  shiftPreference: ShiftPreference;
}

export interface Infrastructure {
    classrooms: number;
    classroomCapacity: number;
    labs: number;
    labCapacity: number;
}

export interface AlgorithmParams {
    population: number;
    generations: number;
    mutationRate: number;
}

export interface ScheduleEntry {
    course: string;
    teacher: string;
    room: string;
    type: 'Teoría' | 'Práctica' | 'Laboratorio';
}

export type Timetable = {
    [day: string]: {
        [timeSlot: string]: ScheduleEntry | null;
    };
};

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}
