// controllers/courseController.ts
import { Request, Response } from "express";
import prisma from "../db/prismaClient";

// 🔹 Obtener todos los cursos
// 🔹 Obtener todos los cursos (solo id y name para el select)
export const getCourses = async (req: Request, res: Response) => {
    try {
      const courses = await prisma.course.findMany({
        select: {
          id: true,
          name: true,
        },
      });
  
      res.json(courses); // <-- devolver directamente el array, sin { courses: [...] }
    } catch (err) {
      console.error("Error fetching courses:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

// 🔹 Obtener un curso por ID
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        code: true,
        name: true,
        credits: true,
        semester: true,
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ course });
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
