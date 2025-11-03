import { Router } from "express";
import { getCourses, getCourseById } from "../controllers/courseController";

const router = Router();

// Todos los cursos
router.get("/", getCourses);

// Curso por ID
router.get("/:id", getCourseById);

export default router;
