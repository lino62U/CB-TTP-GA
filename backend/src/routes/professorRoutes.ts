import { Router } from "express";
import {
  getAllProfessors,
  getProfessorById,
  createProfessor,
  updateProfessor,
  deleteProfessor
} from "../controllers/professorController";

const router = Router();

router.get("/", getAllProfessors);
router.get("/:id", getProfessorById);
router.post("/", createProfessor);
router.put("/:id", updateProfessor);
router.delete("/:id", deleteProfessor);

export default router;
