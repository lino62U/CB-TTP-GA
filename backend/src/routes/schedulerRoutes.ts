import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import { getInfoData } from "../controllers/infoController";
import prisma from "../db/prismaClient";
import { formatScheduleByYear } from "../utils/formateOuput";
import fs from "fs"; // <--- faltaba esto

const router = Router();

// 🗂️ Archivo donde guardaremos el horario
const DATA_FILE = path.join(__dirname, "../db/savedSchedule.json ");


router.get("/run", async (req: Request, res: Response) => {
  try {
    const { semester = "B" } = req.query; // <--- obtiene A o B dinámicamente
    console.log("📘 Valor recibido de 'semester':", semester);
    const scheduleData = await getInfoData(String(semester));

    // 🔹 Imprimir todo lo que llega en la request
    console.log("===== REQ =====");
    console.log("Query params:", req.query);
   
    console.log("================");

    // 🔹 Ejecutar Python
    const scriptPath = path.resolve(__dirname, "../algorithms/run_ga.py");


    const pyProcess = spawn("python3", [
      scriptPath,
      "--pop", String(req.query.population || 100),
      "--gens", String(req.query.generations || 200),
      "--mutation", String(req.query.mutationRate || 0.2),
      "--tournament", String(req.query.tournament || 3),
      "--crossover", String(req.query.crossover || 0.8), // ✅ agregar crossover
    ]);



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


// =========================
//   RUTA: Guardar horario
// =========================
router.post("/save", (req, res) => {
  const scheduleData = req.body;

  try {
    // Crear carpeta si no existe
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(DATA_FILE, JSON.stringify(scheduleData, null, 2), "utf-8");
    res.status(200).json({ message: "Horario guardado exitosamente" });
  } catch (error) {
    console.error("Error al guardar horario:", error);
    res.status(500).json({ error: "Error al guardar el horario" });
  }
});

// =========================
//   RUTA: Obtener último horario guardado
// =========================
router.get("/latest", (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(404).json({ message: "No hay horario guardado" });
    }

    const data = fs.readFileSync(DATA_FILE, "utf-8");
    const schedule = JSON.parse(data);

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error al obtener horario:", error);
    res.status(500).json({ error: "Error al obtener el horario" });
  }
});


export default router;
