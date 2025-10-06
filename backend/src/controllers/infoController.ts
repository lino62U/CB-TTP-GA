// src/controllers/infoController.ts
import { Request, Response } from "express";
import prisma from "../db/prismaClient";

// 🔹 Función que devuelve los datos en formato JSON (reutilizable)
export const getInfoData = async () => {
  // 🔹 Metadata
  const metadata = await prisma.universityMetadata.findFirst({
    select: {
      university_name: true,
      school_name: true,
      semester_code: true,
      curriculum_name: true,
      block_duration_min: true,
      day_start_time: true,
      day_end_time: true,
    },
  });

  // 🔹 Time slots
  const timeSlots = await prisma.timeSlot.findMany({
    select: { day_of_week: true, start_time: true, end_time: true },
    orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
  });

  const periods = timeSlots.map(slot => ({
    day_of_week: slot.day_of_week,
    start_time: slot.start_time.toISOString().substring(11, 16),
    end_time: slot.end_time.toISOString().substring(11, 16),
  }));

  // 🔹 Classrooms
  const classrooms = await prisma.classroom.findMany();
  const classroomsFormatted = classrooms.map(c => ({
    room_code: c.room_code,
    room_name: c.room_name,
    room_type: c.room_type,
    capacity: c.capacity,
  }));

  // 🔹 Professors
  const professors = await prisma.professor.findMany({
    include: {
      courses: { select: { course_name: true } },
      availabilities: { include: { time_slot: true } },
    },
  });

  const professorsFormatted = professors.map(p => ({
    professor_id: p.id,
    name: p.name,
    courses: p.courses.map(c => c.course_name),
    availabilities: p.availabilities.map(a => ({
      day_of_week: a.time_slot.day_of_week,
      start_time: a.time_slot.start_time.toISOString().substring(11, 16),
      end_time: a.time_slot.end_time.toISOString().substring(11, 16),
    })),
  }));

  // 🔹 Courses
  const courses = await prisma.course.findMany({
    select: {
      course_code: true,
      course_name: true,
      credits: true,
      theory_hours: true,
      practice_hours: true,
      lab_hours: true,
      student_count: true,
      classroom_type: true,
      professor_id: true,
      prerequisites: { select: { prerequisite_code: true } },
    },
  });

  const coursesFormatted = courses.map(c => ({
    course_code: c.course_code,
    course_name: c.course_name,
    credits: c.credits,
    hours: {
      theory: c.theory_hours,
      practice: c.practice_hours,
      lab: c.lab_hours,
    },
    prerequisites: c.prerequisites.map(p => p.prerequisite_code),
    professor_id: c.professor_id,
    classroom_type: c.classroom_type,
    student_count: c.student_count,
  }));

  // 🔹 Curricula
  const curricula = await prisma.curriculum.findMany({
    select: { semester: true, course_id: true },
  });

  const curriculaFormatted = curricula.reduce((acc, cur) => {
    if (!acc[cur.semester]) acc[cur.semester] = [];
    acc[cur.semester].push(cur.course_id); // number type, según SQL
    return acc;
  }, {} as Record<string, number[]>);

  // 🔹 Optimization weights
  const weights = await prisma.optimizationWeight.findMany();
  const weightsFormatted = {
    hard_constraints: weights
      .filter(w => w.constraint_type === "HARD")
      .map(w => ({
        constraint_name: w.constraint_name,
        weight_value: w.weight_value,
      })),
    soft_constraints: weights
      .filter(w => w.constraint_type === "SOFT")
      .map(w => ({
        constraint_name: w.constraint_name,
        weight_value: w.weight_value,
      })),
  };

  // 🔹 Preferences (hardcoded)
  const preferences = {
    preferred_shift: "morning",
    preferred_days: ["MON", "TUE", "WED"],
    preferred_slots: ["07:00_07:50","07:50_08:40","08:50_09:40","09:40_10:30","10:40_11:30","11:30_12:20"],
  };

  return {
    metadata,
    periods,
    classrooms: classroomsFormatted,
    professors: professorsFormatted,
    courses: coursesFormatted,
    curricula: curriculaFormatted,
    preferences,
    weights: weightsFormatted,
  };
};

// 🔹 Endpoint HTTP que usa la función anterior
export const getInfo = async (req: Request, res: Response) => {
  try {
    const data = await getInfoData();
    res.json(data);
  } catch (err) {
    console.error("Error fetching info:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
