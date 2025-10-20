import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import { getInfoData } from "../controllers/infoController";
import prisma from "../db/prismaClient";
import { formatScheduleByYear } from "../utils/formateOuput";

const router = Router();

router.post("/run", async (req: Request, res: Response) => {
  try {
    const { semester = 'B', advanced_config = null } = req.body || {};
    const scheduleData = await getInfoData(semester);

    // Incorporar advanced_config si fue provisto
    if (advanced_config) {
      // Merge simple: colocar bajo la clave "advanced_config" para que el script Python
      // pueda leerlo desde la entrada y aplicar los ajustes correspondientes.
      (scheduleData as any).advanced_config = advanced_config;
    }

    // Ejecutar Python
    const scriptPath = path.resolve(__dirname, "../algorithms/run_ga.py");
    const pyProcess = spawn("python3", [scriptPath]);
    pyProcess.stdin.write(JSON.stringify(scheduleData));
    pyProcess.stdin.end();

    let pyOutput = "";
    let pyError = "";

    pyProcess.stdout.on("data", (data) => {
      pyOutput += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      pyError += data.toString();
    });

    pyProcess.on("close", async (code) => {
      if (code !== 0) {
        console.error("Python exited with code", code, pyError);
        return res.status(500).json({ error: "Python script failed", details: pyError });
      }

      try {
        const result = JSON.parse(pyOutput);

        // 🔹 Guardar en DB
        for (const session of result.schedule) {
          // 1️⃣ Buscar IDs
          const course = await prisma.course.findUnique({ where: { code: session.course_code } });
          const professor = await prisma.user.findUnique({ where: { id: session.professor_id } });
          const classroom = await prisma.classroom.findUnique({ where: { room_code: session.classroom_code } });

          if (!course || !professor || !classroom) {
            console.warn("Skipping session due to missing reference:", session);
            continue;
          }


          // 2️⃣ Crear o buscar TimeSlot
          const startTime = new Date(`1970-01-01T${session.start_time}:00Z`);
          const endTime = new Date(`1970-01-01T${session.end_time}:00Z`);
          let timeSlot = await prisma.timeSlot.findFirst({
            where: {
              day_of_week: session.day_of_week,
              start_time: startTime,
              end_time: endTime,
            },
          });
          if (!timeSlot) {
            timeSlot = await prisma.timeSlot.create({
              data: { day_of_week: session.day_of_week, start_time: startTime, end_time: endTime },
            });
          }

          // 3️⃣ Insertar Schedule
          await prisma.schedule.create({
            data: {
              course_id: course.id,
              user_id: professor.id,
              classroom_id: classroom.id,
              time_slot_id: timeSlot.id,
              student_count: session.student_count,
              semester: course.semester,
              year: course.year,
            },
          });
          session.professor = {
            id: professor.id,
            name: professor.name,
            email: professor.email,
          };
        }

        const formatted = formatScheduleByYear(result);
        res.json(formatted);
        // res.json({ schedule: result, message: "Saved to database" });
      } catch (err) {
        console.error("Failed to parse Python output or insert into DB:", err, pyOutput);
        res.status(500).json({ error: "Invalid output from Python script or DB insert failed", details: pyOutput });
      }
    });
  } catch (err) {
    console.error("Error running scheduler:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
