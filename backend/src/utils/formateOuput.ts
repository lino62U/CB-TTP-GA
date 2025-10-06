type Session = {
  course_code: string;
  course_name: string;
  year: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom_code: string;
  classroom_type: string;
  professor_name: string;
  student_count: number;
};

type ScheduleData = {
  metadata: any;
  schedule: Session[];
};

const yearNames = ["FirstYear", "SecondYear", "ThirdYear", "FourthYear", "FifthYear"];

export const formatScheduleByYear = (data: ScheduleData) => {
  // Inicializar template
  const schedules_by_year: Record<string, any> = {};
  for (let i = 0; i < 5; i++) {
    schedules_by_year[yearNames[i]] = {
      curriculum_name: `${yearNames[i]}-SecondSemester`,
      schedule: [],
      statistics: { total_courses: 0, total_sessions: 0 },
    };
  }

  const global_statistics = { total_courses: 0, total_sessions: 0 };
  const coursesCounted: Record<string, boolean> = {}; // Para contar cada curso 1 vez por año

  // Poblar
  for (const session of data.schedule) {
    const yearIndex = session.year - 1; // año 1 -> index 0
    if (yearIndex < 0 || yearIndex >= 5) continue;
    const yearKey = yearNames[yearIndex];

    schedules_by_year[yearKey].schedule.push(session);

    // Contar sesiones
    schedules_by_year[yearKey].statistics.total_sessions += 1;
    global_statistics.total_sessions += 1;

    // Contar cursos únicos por año
    if (!coursesCounted[`${yearKey}-${session.course_code}`]) {
      schedules_by_year[yearKey].statistics.total_courses += 1;
      global_statistics.total_courses += 1;
      coursesCounted[`${yearKey}-${session.course_code}`] = true;
    }
  }

  return {
    metadata: data.metadata,
    schedules_by_year,
    global_statistics,
    message: "Template ready for population",
  };
};
