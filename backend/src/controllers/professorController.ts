import { Request, Response } from "express";
import prisma from "../db/prismaClient";

// GET /professors
export const getAllProfessors = async (req: Request, res: Response) => {
  try {
    const professors = await prisma.professor.findMany();
    res.json(professors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching professors" });
  }
};

// GET /professors/:id
export const getProfessorById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const professor = await prisma.professor.findUnique({
      where: { id: Number(id) },
    });
    if (!professor) return res.status(404).json({ error: "Professor not found" });
    res.json(professor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching professor" });
  }
};

// POST /professors
export const createProfessor = async (req: Request, res: Response) => {
  const { name, preferred_shift } = req.body;
  try {
    const professor = await prisma.professor.create({
      data: {
        name,
        preferred_shift,
      },
    });
    res.status(201).json(professor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating professor" });
  }
};

// PUT /professors/:id
export const updateProfessor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, preferred_shift } = req.body;
  try {
    const professor = await prisma.professor.update({
      where: { id: Number(id) },
      data: { name, preferred_shift },
    });
    res.json(professor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating professor" });
  }
};

// DELETE /professors/:id
export const deleteProfessor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.professor.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "Professor deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting professor" });
  }
};
