import { Request, Response } from "express";
import prisma from "../db/prismaClient";

// GET /professors
export const getAllProfessors = async (req: Request, res: Response) => {
  try {
    const professors = await prisma.user.findMany(
      { where: { role: "PROFESSOR" } }
    );
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
    const professor = await prisma.user.findUnique({
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
    const professor = await prisma.user.create({
      data: {
        name,
        preferred_shift,
        role: "PROFESSOR",
        email: req.body.email,
        password: req.body.password, // ⚠️ deberías reemplazar con un hash real (bcrypt)  
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
    const professor = await prisma.user.update({
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
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "Professor deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting professor" });
  }
};

// GET /professors/:id/availability - Obtener disponibilidad de un profesor
export const getProfessorAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const availability = await prisma.professorAvailability.findMany({
      where: { user_id: Number(id) },
      include: {
        time_slot: true,
        user: {
          select: {
            id: true,
            name: true,
            preferred_shift: true
          }
        }
      },
      orderBy: [
        { time_slot: { day_of_week: 'asc' } },
        { time_slot: { start_time: 'asc' } }
      ]
    });

    if (availability.length === 0) {
      return res.json({
        professor_id: Number(id),
        availability: [],
        message: "No availability found for this professor"
      });
    }

    res.json({
      professor: availability[0].user,
      availability: availability.map(avail => ({
        id: avail.id,
        time_slot: {
          id: avail.time_slot.id,
          day_of_week: avail.time_slot.day_of_week,
          start_time: avail.time_slot.start_time,
          end_time: avail.time_slot.end_time
        }
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching professor availability" });
  }
};

// POST /professors/:id/availability - Agregar un time slot a la disponibilidad
export const addProfessorAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { time_slot_id } = req.body;
  
  try {
    // Verificar que el profesor existe
    const professor = await prisma.user.findUnique({
      where: { id: Number(id), role: "PROFESSOR" }
    });
    
    if (!professor) {
      return res.status(404).json({ error: "Professor not found" });
    }

    // Verificar que el time slot existe
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: Number(time_slot_id) }
    });

    if (!timeSlot) {
      return res.status(404).json({ error: "Time slot not found" });
    }

    // Crear la disponibilidad
    const availability = await prisma.professorAvailability.create({
      data: {
        user_id: Number(id),
        time_slot_id: Number(time_slot_id)
      },
      include: {
        time_slot: true,
        user: {
          select: {
            id: true,
            name: true,
            preferred_shift: true
          }
        }
      }
    });

    res.status(201).json(availability);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: "This time slot is already in professor's availability" });
    } else {
      res.status(500).json({ error: "Error adding professor availability" });
    }
  }
};

// PUT /professors/:id/availability - Actualizar toda la disponibilidad del profesor
export const updateProfessorAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { time_slot_ids } = req.body; // Array de IDs de time slots
  
  try {
    // Verificar que el profesor existe
    const professor = await prisma.user.findUnique({
      where: { id: Number(id), role: "PROFESSOR" }
    });
    
    if (!professor) {
      return res.status(404).json({ error: "Professor not found" });
    }

    // Validar que todos los time slots existen
    if (time_slot_ids && time_slot_ids.length > 0) {
      const timeSlots = await prisma.timeSlot.findMany({
        where: { id: { in: time_slot_ids.map(Number) } }
      });

      if (timeSlots.length !== time_slot_ids.length) {
        return res.status(400).json({ error: "One or more time slots not found" });
      }
    }

    // Usar transacción para eliminar toda la disponibilidad anterior y crear la nueva
    const result = await prisma.$transaction(async (tx) => {
      // Eliminar disponibilidad anterior
      await tx.professorAvailability.deleteMany({
        where: { user_id: Number(id) }
      });

      // Crear nueva disponibilidad si se proporcionaron time slots
      if (time_slot_ids && time_slot_ids.length > 0) {
        const availabilityData = time_slot_ids.map((timeSlotId: number) => ({
          user_id: Number(id),
          time_slot_id: Number(timeSlotId)
        }));

        await tx.professorAvailability.createMany({
          data: availabilityData
        });
      }

      // Obtener la nueva disponibilidad con relaciones
      const newAvailability = await tx.professorAvailability.findMany({
        where: { user_id: Number(id) },
        include: {
          time_slot: true,
          user: {
            select: {
              id: true,
              name: true,
              preferred_shift: true
            }
          }
        },
        orderBy: [
          { time_slot: { day_of_week: 'asc' } },
          { time_slot: { start_time: 'asc' } }
        ]
      });

      return newAvailability;
    });

    res.json({
      professor: result[0]?.user || professor,
      availability: result.map(avail => ({
        id: avail.id,
        time_slot: {
          id: avail.time_slot.id,
          day_of_week: avail.time_slot.day_of_week,
          start_time: avail.time_slot.start_time,
          end_time: avail.time_slot.end_time
        }
      })),
      message: "Professor availability updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating professor availability" });
  }
};

// DELETE /professors/:id/availability/:availability_id - Eliminar un time slot específico
export const removeProfessorAvailability = async (req: Request, res: Response) => {
  const { id, availability_id } = req.params;
  
  try {
    // Verificar que la disponibilidad existe y pertenece al profesor
    const availability = await prisma.professorAvailability.findFirst({
      where: { 
        id: Number(availability_id),
        user_id: Number(id)
      }
    });

    if (!availability) {
      return res.status(404).json({ error: "Availability record not found" });
    }

    await prisma.professorAvailability.delete({
      where: { id: Number(availability_id) }
    });

    res.json({ message: "Availability removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error removing professor availability" });
  }
};

// DELETE /professors/:id/availability - Eliminar toda la disponibilidad del profesor
export const clearProfessorAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await prisma.professorAvailability.deleteMany({
      where: { user_id: Number(id) }
    });

    res.json({ message: "All professor availability cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error clearing professor availability" });
  }
};

// GET /time-slots - Obtener todos los time slots disponibles
export const getAllTimeSlots = async (req: Request, res: Response) => {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: [
        { day_of_week: 'asc' },
        { start_time: 'asc' }
      ]
    });
    res.json(timeSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching time slots" });
  }
};
