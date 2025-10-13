import type { Timetable, TimetableEntry } from "./type";

export interface ScheduleResult {
  per_curriculum: {
    [year: string]: {
      [courseCode: string]: { period: string; aula: string }[];
    };
  };
  courses: {
    [courseCode: string]: { nombre: string; profesor: string; aula_tipo: string };
  };
}

export function transformToSchedules(result: ScheduleResult): { [year: string]: Timetable } {
  const yearSchedules: { [year: string]: Timetable } = {};

  Object.entries(result.per_curriculum).forEach(([year, yearCourses]) => {
    const timetable: Timetable = [];

    Object.entries(yearCourses).forEach(([courseCode, assignments]) => {
      const courseInfo = result.courses[courseCode];
      if (!courseInfo) return;

      assignments.forEach(assignment => {
        const [day, start, end] = assignment.period.split("_");
        timetable.push({
          day,
          timeSlot: `${start}-${end}`,
          course: courseInfo.nombre,
          teacher: courseInfo.profesor,
          room: assignment.aula,
          type: courseInfo.aula_tipo || "T",
        } as TimetableEntry);
      });
    });

    yearSchedules[year] = timetable;
  });

  return yearSchedules;
}
