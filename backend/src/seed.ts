import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type ProfessorJSON = {
  cursos: string[];
  disponibilidad?: string[];
  preferencia?: string;
};

async function main() {
  // -------------------------
  // 0️⃣ Leer JSON
  // -------------------------
  const filePath = path.join(__dirname, "data__.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // -------------------------
  // 1️⃣ University Metadata
  // -------------------------
  await prisma.universityMetadata.create({
    data: {
      university_name: data.metadata.universidad,
      school_name: data.metadata.escuela,
      semester_code: data.metadata.semestre,
      curriculum_name: data.metadata.curriculo,
      block_duration_min: data.metadata.duracion_bloque_min,
      day_start_time: new Date(`1970-01-01T${data.metadata.inicio_jornada}:00Z`),
      day_end_time: new Date(`1970-01-01T${data.metadata.fin_jornada}:00Z`),
    },
  });

  // -------------------------
  // 2️⃣ TimeSlots
  // -------------------------
  for (const periodo of data.periodos) {
    const [day, start, end] = periodo.split("_");
    await prisma.timeSlot.create({
      data: {
        day_of_week: day,
        start_time: new Date(`1970-01-01T${start}:00Z`),
        end_time: new Date(`1970-01-01T${end}:00Z`),
      },
    });
  }

  // -------------------------
  // 3️⃣ Classrooms
  // -------------------------
  const addRooms = async (rooms: any[], type: string) => {
    for (const room of rooms) {
      await prisma.classroom.create({
        data: {
          room_code: room.id,
          room_name: room.nombre || room.id,
          room_type: type,
          capacity: room.capacidad,
        },
      });
    }
  };

  await addRooms(data.aulas.teoricas, "THEORY");
  await addRooms(data.aulas.practicas, "PRACTICE");
  await addRooms(data.aulas.laboratorios, "LAB");

  // -------------------------
  // 4️⃣ Courses
  // -------------------------
  const yearMap: Record<string, number> = {
    primer_ano: 1,
    segundo_ano: 2,
    tercer_ano: 3,
    cuarto_ano: 4,
    quinto_ano: 5,
  };

  const courseCodeMap: Record<string, number> = {};

  for (const yearObj of data.cursos) {
    for (const [yearKey, yearData] of Object.entries(yearObj)) {
      for (const [semesterKey, semesterCourses] of Object.entries(yearData as any)) {
        for (const course of semesterCourses as any[]) {
          const createdCourse = await prisma.course.create({
            data: {
              code: course.codigo,
              name: course.nombre,
              department: course.dpto_adscrito,
              department2: course.dpto_adscrito2 || null,
              department3: course.dpto_adscrito3 || null,
              credits: course.creditos,
              theory_hours: course.horas_teoria,
              practice_hours: course.horas_practica,
              total_hours: course.horas_total,
              semi_hours: course.horas_semi,
              lab_hours: course.horas_lab,
              year: yearMap[yearKey],
              semester: semesterKey === "primer_semestre" ? "A" : "B",
            },
          });
          courseCodeMap[course.codigo] = createdCourse.id;
        }
      }
    }
  }

  // -------------------------
  // 5️⃣ Course Prerequisites
  // -------------------------
  for (const yearObj of data.cursos) {
    for (const [_, yearData] of Object.entries(yearObj)) {
      for (const [_, semesterCourses] of Object.entries(yearData as any)) {
        for (const course of semesterCourses as any[]) {
          if (course.prerequisitos?.length) {
            for (const prereqCode of course.prerequisitos) {
              const courseId = courseCodeMap[course.codigo];
              if (courseId) {
                await prisma.coursePrerequisite.create({
                  data: {
                    course_id: courseId,
                    prerequisite_code: prereqCode,
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  // -------------------------
  // 6️⃣ Professors → Users con role = "PROFESSOR"
  // -------------------------
  for (const [profName, profDataRaw] of Object.entries(data.profesores)) {
    const profData = profDataRaw as ProfessorJSON;

    const email = `${profName.split(" ").slice(1, 2).join(".").toLowerCase()}@unsa.edu.pe`;

    const user = await prisma.user.create({
      data: {
        name: profName,
        email,
        password: await bcrypt.hash("123456", 10), // ⚠️ deberías reemplazar con un hash real (bcrypt)
        role: "PROFESSOR",
        preferred_shift: profData.preferencia || null,
      },
    });

    // ---------------------
    // Disponibilidad del profesor
    // ---------------------
    if (profData.disponibilidad?.length) {
      for (const slot of profData.disponibilidad) {
        const [day, start, end] = slot.split("_");
        const timeSlot = await prisma.timeSlot.findFirst({
          where: {
            day_of_week: day,
            start_time: new Date(`1970-01-01T${start}:00Z`),
            end_time: new Date(`1970-01-01T${end}:00Z`),
          },
        });

        if (timeSlot) {
          await prisma.professorAvailability.create({
            data: {
              user_id: user.id,
              time_slot_id: timeSlot.id,
            },
          });
        } else {
          console.warn(`⚠️ TimeSlot not found for ${slot}`);
        }
      }
    }

    // ---------------------
    // Relación profesor ↔ curso
    // ---------------------
    if (profData.cursos?.length) {
      for (const courseCode of profData.cursos) {
        const course = await prisma.course.findUnique({ where: { code: courseCode } });
        if (course) {
          await prisma.professorCourse.create({
            data: {
              userId: user.id,
              courseId: course.id,
            },
          });
        } else {
          console.warn(`⚠️ Course not found for code ${courseCode}`);
        }
      }
    }
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
