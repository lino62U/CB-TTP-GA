// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

type ProfesorInfo = {
  cursos: string[];
  disponibilidad: string[];
  preferencia: string;
};

type CurriculoData = Record<string, string[]>; // nombre del año => lista de códigos de cursos

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, "data.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);

  // 1️⃣ University Metadata
  const uni = await prisma.universityMetadata.create({
    data: {
      university_name: data.metadata.universidad,
      school_name: data.metadata.escuela,
      semester_code: data.metadata.semestre,
      curriculum_name: data.metadata.curriculo,
      block_duration_min: data.metadata.duracion_bloque_min,
      day_start_time: new Date(`1970-01-01T${data.metadata.inicio_jornada}:00.000Z`),
      day_end_time: new Date(`1970-01-01T${data.metadata.fin_jornada}:00.000Z`),
    },
  });

  // 2️⃣ TimeSlots
  const timeSlotMap: Record<string, number> = {}; // "LUN_07:00_07:50" => id
  for (const p of data.periodos) {
    if (!p) continue;
    const [day, start, end] = p.split("_");
    const ts = await prisma.timeSlot.create({
      data: {
        day_of_week: day,
        start_time: new Date(`1970-01-01T${start}:00.000Z`),
        end_time: new Date(`1970-01-01T${end}:00.000Z`),
      },
    });
    timeSlotMap[p] = ts.id;
  }

  // 3️⃣ Classrooms
  const classroomMap: Record<string, number> = {};
  for (const t of data.aulas.teoricas) {
    const c = await prisma.classroom.create({
      data: {
        room_code: t.id,
        room_type: "THEORY",
        capacity: t.capacidad,
      },
    });
    classroomMap[t.id] = c.id;
  }
  for (const l of data.aulas.laboratorios) {
    const c = await prisma.classroom.create({
      data: {
        room_code: l.id,
        room_name: l.nombre,
        room_type: "LAB",
        capacity: l.capacidad,
      },
    });
    classroomMap[l.id] = c.id;
  }

  // 4️⃣ Professors
  const professorMap: Record<string, number> = {};
  for (const [name, infoRaw] of Object.entries(data.profesores)) {
    const info = infoRaw as ProfesorInfo; // 🔹 cast a tipo conocido

    const prof = await prisma.professor.create({
      data: {
        name,
        preferred_shift: info.preferencia,
      },
    });
    professorMap[name] = prof.id;

    // Disponibilidad
    for (const p of info.disponibilidad) {
      const tsId = timeSlotMap[p];
      if (!tsId) continue;
      await prisma.professorAvailability.create({
        data: {
          professor_id: prof.id,
          time_slot_id: tsId,
        },
      });
    }
  }

  // 5️⃣ Courses
  const courseMap: Record<string, number> = {};
  for (const c of data.cursos) {
    const profId = professorMap[c.profesor] || undefined;
    const course = await prisma.course.create({
      data: {
        course_code: c.codigo,
        course_name: c.nombre,
        credits: c.creditos,
        theory_hours: c.horas.teoricas,
        practice_hours: c.horas.practicas,
        lab_hours: c.horas.laboratorio,
        student_count: c.estudiantes,
        classroom_type: c.aula_tipo,
        professor_id: profId,
      },
    });
    courseMap[c.codigo] = course.id;

    // Prerrequisitos
    if (c.prerrequisitos) {
      for (const pre of c.prerrequisitos) {
        await prisma.coursePrerequisite.create({
          data: {
            course_id: course.id,
            prerequisite_code: pre,
          },
        });
      }
    }
  }
  // 6️⃣ Curricula con mapping de años
  const yearMap: Record<string, number> = {
    "Primer Año": 1,
    "Segundo Año": 2,
    "Tercer Año": 3,
    "Cuarto Año": 4,
    "Quinto Año": 5,
  };

  const curriculos = data.curriculos as CurriculoData;

  for (const [currName, coursesRaw] of Object.entries(curriculos)) {
    const courses = coursesRaw as string[]; // 🔹 cast a array de string
    let year = 1;

    // Mapea el nombre del año a un número
    switch (currName.toLowerCase()) {
      case "primer año": year = 1; break;
      case "segundo año": year = 2; break;
      case "tercer año": year = 3; break;
      case "cuarto año": year = 4; break;
      case "quinto año": year = 5; break;
    }

    for (const code of courses) {
      const courseId = courseMap[code];
      if (!courseId) continue;

      await prisma.curriculum.create({
        data: {
          course_id: courseId,
          year: year,
          semester: "I", // o lo que corresponda
        },
      });
    }
  }



  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
