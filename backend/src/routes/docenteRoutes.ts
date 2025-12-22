import { Router } from 'express';
import { DocenteAssignmentController } from '../controllers/docenteAssignmentController';

const router = Router();
const docenteController = new DocenteAssignmentController();

/**
 * @route GET /api/docentes/disponibles
 * @desc Obtiene la lista de docentes disponibles
 * @access Coordinador
 */
router.get('/disponibles', (req, res) => docenteController.getDocentesDisponibles(req, res));

/**
 * @route POST /api/docentes/asignar
 * @desc Asigna un docente a un curso específico
 * @access Coordinador
 */
router.post('/asignar', (req, res) => docenteController.asignarDocenteCurso(req, res));

/**
 * @route GET /api/docentes/asignaciones
 * @desc Obtiene todas las asignaciones de docentes actuales
 * @access Coordinador
 */
router.get('/asignaciones', (req, res) => docenteController.getAsignacionesDocentes(req, res));

/**
 * @route POST /api/docentes/remover
 * @desc Remueve la asignación de un docente de un curso
 * @access Coordinador
 */
router.post('/remover', (req, res) => docenteController.removerAsignacionDocente(req, res));

export default router;