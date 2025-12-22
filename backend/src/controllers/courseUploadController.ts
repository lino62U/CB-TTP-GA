import { Request, Response } from 'express';
import multer from 'multer';
import { PDFCourseProcessor } from '../services/pdfProcessor';
import fs from 'fs/promises';
import path from 'path';

/**
 * Configuración de Multer para subida de archivos PDF
 */
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Permitir PDFs y archivos de texto para pruebas
  if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF o TXT para pruebas'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});

/**
 * Controlador para procesar PDFs de cursos
 */
export class CourseUploadController {
  private processor: PDFCourseProcessor;
  
  constructor() {
    this.processor = new PDFCourseProcessor();
  }

  /**
   * Sube y procesa un PDF de cursos
   */
  async uploadCoursePDF(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo PDF'
        });
      }

      console.log(`📤 Procesando PDF: ${req.file.originalname} (${req.file.size} bytes)`);

      // Procesar el PDF
      const courseStructure = await this.processor.processPDF(req.file.buffer);

      // Validar la estructura extraída
      const validation = this.processor.validateStructure(courseStructure);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'PDF procesado pero contiene errores',
          errors: validation.errors,
          extractedData: courseStructure
        });
      }

      // Actualizar la base de datos de cursos
      const updateResult = await this.updateCoursesDatabase(courseStructure);

      res.json({
        success: true,
        message: 'PDF procesado y base de datos actualizada exitosamente',
        statistics: {
          totalCourses: this.countTotalCourses(courseStructure),
          coursesUpdated: updateResult.updated,
          coursesCreated: updateResult.created,
          yearsProcessed: Object.keys(courseStructure.cursos).length
        },
        data: courseStructure
      });

    } catch (error: any) {
      console.error('❌ Error en uploadCoursePDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando el PDF',
        error: error.message
      });
    }
  }

  /**
   * Previsualiza el contenido del PDF sin actualizar la base de datos
   */
  async previewCoursePDF(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo PDF'
        });
      }

      console.log(`🔍 Previsualizando PDF: ${req.file.originalname}`);

      // Solo procesar, no actualizar base de datos
      const courseStructure = await this.processor.processPDF(req.file.buffer);
      const validation = this.processor.validateStructure(courseStructure);

      res.json({
        success: true,
        message: 'PDF procesado para previsualización',
        isValid: validation.isValid,
        errors: validation.errors,
        statistics: {
          totalCourses: this.countTotalCourses(courseStructure),
          yearsFound: this.getYearsSummary(courseStructure)
        },
        preview: courseStructure
      });

    } catch (error: any) {
      console.error('❌ Error en previewCoursePDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando el PDF',
        error: error.message
      });
    }
  }

  /**
   * Actualiza la base de datos con los cursos del PDF
   */
  private async updateCoursesDatabase(courseStructure: any): Promise<{ created: number; updated: number }> {
    try {
      // Ruta al archivo de datos actual
      const dataPath = path.join(__dirname, '../data.json');
      
      // Leer datos actuales
      let currentData: any = {};
      try {
        const currentDataStr = await fs.readFile(dataPath, 'utf-8');
        currentData = JSON.parse(currentDataStr);
      } catch (error) {
        console.log('📝 Archivo de datos no existe, creando uno nuevo');
      }

      // Hacer backup del archivo anterior
      const backupPath = path.join(__dirname, `../data_backup_${Date.now()}.json`);
      if (currentData.cursos) {
        await fs.writeFile(backupPath, JSON.stringify(currentData, null, 2));
        console.log(`💾 Backup creado: ${backupPath}`);
      }

      // Actualizar estructura preservando metadata
      const newData = {
        ...currentData,
        cursos: courseStructure.cursos,
        metadata: {
          ...currentData.metadata,
          ultima_actualizacion: new Date().toISOString(),
          fuente: 'PDF_procesado',
          version: '2.0'
        }
      };

      // Guardar nuevos datos
      await fs.writeFile(dataPath, JSON.stringify(newData, null, 2));
      
      const totalCourses = this.countTotalCourses(courseStructure);
      console.log(`✅ Base de datos actualizada con ${totalCourses} cursos`);

      return {
        created: totalCourses,
        updated: 0
      };

    } catch (error: any) {
      console.error('❌ Error actualizando base de datos:', error);
      throw new Error(`Error actualizando base de datos: ${error.message}`);
    }
  }

  /**
   * Cuenta el total de cursos en la estructura
   */
  private countTotalCourses(structure: any): number {
    let total = 0;
    
    for (const yearObj of structure.cursos) {
      for (const year of Object.keys(yearObj)) {
        for (const semester of Object.keys(yearObj[year])) {
          total += yearObj[year][semester].length;
        }
      }
    }
    
    return total;
  }

  /**
   * Obtiene un resumen de los años procesados
   */
  private getYearsSummary(structure: any): any {
    const summary: any = {};
    
    for (const yearObj of structure.cursos) {
      for (const year of Object.keys(yearObj)) {
        summary[year] = {};
        for (const semester of Object.keys(yearObj[year])) {
          summary[year][semester] = yearObj[year][semester].length;
        }
      }
    }
    
    return summary;
  }

  /**
   * Obtiene el estado actual de la base de datos de cursos
   */
  async getCoursesStatus(req: Request, res: Response) {
    try {
      const dataPath = path.join(__dirname, '../data.json');
      
      try {
        const dataStr = await fs.readFile(dataPath, 'utf-8');
        const data = JSON.parse(dataStr);
        
        const totalCourses = data.cursos ? this.countTotalCourses(data) : 0;
        
        res.json({
          success: true,
          metadata: data.metadata || {},
          statistics: {
            totalCourses,
            yearsSummary: data.cursos ? this.getYearsSummary(data) : {}
          },
          lastUpdate: data.metadata?.ultima_actualizacion || 'Nunca',
          source: data.metadata?.fuente || 'Desconocido'
        });

      } catch (error) {
        res.json({
          success: true,
          message: 'No hay datos de cursos cargados',
          statistics: {
            totalCourses: 0,
            yearsSummary: {}
          }
        });
      }

    } catch (error: any) {
      console.error('❌ Error obteniendo estado de cursos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado de cursos',
        error: error.message
      });
    }
  }
}