import { Router } from "express";
import {
  getAllProfessors,
  getProfessorById,
  createProfessor,
  updateProfessor,
  deleteProfessor,
  getProfessorAvailability,
  addProfessorAvailability,
  updateProfessorAvailability,
  removeProfessorAvailability,
  clearProfessorAvailability,
  getAllTimeSlots
} from "../controllers/professorController";

const router = Router();

// Ruta para obtener todos los time slots (debe estar antes de las rutas con parámetros)
router.get("/time-slots", getAllTimeSlots);

// Rutas básicas de profesores
router.get("/", getAllProfessors);
router.get("/:id", getProfessorById);
router.post("/", createProfessor);
router.put("/:id", updateProfessor);
router.delete("/:id", deleteProfessor);

// Rutas para disponibilidad de profesores
router.get("/:id/availability", getProfessorAvailability);
router.post("/:id/availability", addProfessorAvailability);
router.put("/:id/availability", updateProfessorAvailability);
router.delete("/:id/availability/:availability_id", removeProfessorAvailability);
router.delete("/:id/availability", clearProfessorAvailability);

export default router;
