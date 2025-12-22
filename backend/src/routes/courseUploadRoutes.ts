import { Router } from 'express';
import { CourseUploadController, upload } from '../controllers/courseUploadController';

const router = Router();
const courseUploadController = new CourseUploadController();

/**
 * @route POST /api/courses/upload
 * @desc Sube y procesa un PDF de cursos, actualiza la base de datos
 * @access Coordinador
 */
router.post(
  '/upload',
  upload.single('coursePDF'),
  (req, res) => courseUploadController.uploadCoursePDF(req, res)
);

/**
 * @route POST /api/courses/preview
 * @desc Previsualiza el contenido de un PDF sin actualizar la base de datos
 * @access Coordinador
 */
router.post(
  '/preview',
  upload.single('coursePDF'),
  (req, res) => courseUploadController.previewCoursePDF(req, res)
);

/**
 * @route GET /api/courses/status
 * @desc Obtiene el estado actual de la base de datos de cursos
 * @access Público
 */
router.get(
  '/status',
  (req, res) => courseUploadController.getCoursesStatus(req, res)
);

export { router as courseUploadRoutes };