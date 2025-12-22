import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export class DocenteAssignmentController {
  private readonly dataPath = path.join(__dirname, '../data.json');

  async getDocentesDisponibles(req: Request, res: Response) {
    try {
      const docentes = [
        { id: '1', nombre: 'Prof. García López', departamento: 'SI' },
        { id: '2', nombre: 'Prof. Martinez Rodriguez', departamento: 'MS' },
        { id: '3', nombre: 'Prof. López Torres', departamento: 'HU' }
      ];
      res.json({ success: true, docentes });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async asignarDocenteCurso(req: Request, res: Response) {
    try {
      const { codigo_curso, docente_id, año, semestre } = req.body;
      res.json({ success: true, message: 'Docente asignado exitosamente' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAsignacionesDocentes(req: Request, res: Response) {
    try {
      res.json({ 
        success: true, 
        asignaciones: [], 
        statistics: { totalCursos: 0, cursosAsignados: 0, cursosSinAsignar: 0 }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removerAsignacionDocente(req: Request, res: Response) {
    try {
      res.json({ success: true, message: 'Asignación removida' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}