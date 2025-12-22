import fs from 'fs';
import path from 'path';

/**
 * Interfaz para los datos extraídos de un curso
 */
interface CourseData {
  codigo: string;
  nombre: string;
  dpto_adscrito: string;
  dpto_adscrito2?: string;
  dpto_adscrito3?: string;
  creditos: number | null;
  prerequisitos: string[];
  horas_teoria: number;
  horas_practica: number;
  horas_total: number;
  horas_semi: number;
  horas_lab: number;
  // Campos adicionales para asignación de docentes
  docente_asignado?: string;
  docente_sugerido?: string;
  requiere_docente: boolean;
  modalidad: 'teoria' | 'practica' | 'laboratorio' | 'mixto';
}

/**
 * Interfaz para la estructura jerárquica de cursos
 */
interface CourseStructure {
  cursos: Array<{
    [year: string]: {
      [semester: string]: CourseData[];
    };
  }>;
}

/**
 * Clase para procesar PDFs de cursos académicos (versión temporal sin PDF)
 */
export class PDFCourseProcessor {
  private currentYear: string = '';
  private currentSemester: string = '';
  
  /**
   * Procesa un archivo PDF y extrae los cursos (temporal: simula procesamiento)
   */
  async processPDF(pdfBuffer: Buffer): Promise<CourseStructure> {
    try {
      console.log('📄 Simulando procesamiento de PDF...');
      
      // Por ahora, retornamos datos de ejemplo hasta implementar el PDF correctamente
      const mockCourseStructure: CourseStructure = {
        cursos: [
          {
            primer_ano: {
              primer_semestre: [
                {
                  codigo: "2501101",
                  nombre: "FUNDAMENTOS DE LA MATEMÁTICA",
                  dpto_adscrito: "MS",
                  dpto_adscrito2: "",
                  dpto_adscrito3: "",
                  creditos: 2,
                  prerequisitos: [],
                  horas_teoria: 2.0,
                  horas_practica: 2.0,
                  horas_total: 4.0,
                  horas_semi: 0.0,
                  horas_lab: 0.0,
                  requiere_docente: true,
                  modalidad: 'teoria' as const
                },
                {
                  codigo: "2501103",
                  nombre: "INTRODUCCIÓN A LA CIENCIA DE LA COMPUTACIÓN",
                  dpto_adscrito: "SI",
                  dpto_adscrito2: "",
                  dpto_adscrito3: "",
                  creditos: 4,
                  prerequisitos: [],
                  horas_teoria: 2.0,
                  horas_practica: 0.0,
                  horas_total: 6.0,
                  horas_semi: 0.0,
                  horas_lab: 4.0,
                  requiere_docente: true,
                  modalidad: 'mixto' as const
                }
              ],
              segundo_semestre: [
                {
                  codigo: "2501208",
                  nombre: "PROGRAMACIÓN I",
                  dpto_adscrito: "SI",
                  dpto_adscrito2: "",
                  dpto_adscrito3: "",
                  creditos: 5,
                  prerequisitos: ["2501103"],
                  horas_teoria: 2.0,
                  horas_practica: 2.0,
                  horas_total: 8.0,
                  horas_semi: 0.0,
                  horas_lab: 4.0,
                  requiere_docente: true,
                  modalidad: 'mixto' as const
                }
              ]
            }
          }
        ]
      };
      
      console.log('✅ Datos de ejemplo generados (implementación temporal)');
      return mockCourseStructure;
      
    } catch (error: any) {
      console.error('❌ Error procesando PDF:', error);
      throw new Error(`Error al procesar PDF: ${error?.message || 'Error desconocido'}`);
    }
  }

  /**
   * Determina la modalidad del curso basado en las horas
   */
  private determinarModalidad(horas_teoria: number, horas_practica: number, horas_lab: number): 'teoria' | 'practica' | 'laboratorio' | 'mixto' {
    if (horas_lab > 0 && horas_teoria > 0) {
      return 'mixto';
    } else if (horas_lab > 0) {
      return 'laboratorio';
    } else if (horas_practica > 0 && horas_teoria > 0) {
      return 'mixto';
    } else if (horas_practica > 0) {
      return 'practica';
    } else {
      return 'teoria';
    }
  }

  /**
   * Sugiere un docente basado en el departamento y tipo de curso
   */
  private sugerirDocente(dpto_adscrito: string, nombre_curso: string, modalidad: string): string {
    // Lógica básica de sugerencia por departamento
    const sugerencias: Record<string, string[]> = {
      'SI': ['Prof. García', 'Prof. Rodriguez', 'Prof. López'],
      'MS': ['Prof. Martinez', 'Prof. Fernandez', 'Prof. Sánchez'],
      'HU': ['Prof. Jiménez', 'Prof. Morales', 'Prof. Vargas'],
      'FI': ['Prof. Torres', 'Prof. Ramírez', 'Prof. Castro']
    };

    const profesores = sugerencias[dpto_adscrito] || ['Prof. A asignar'];
    
    // Lógica específica por modalidad
    if (modalidad === 'laboratorio' || modalidad === 'mixto') {
      return profesores[0] + ' (Lab)';
    }
    
    return profesores[0];
  }

  /**
   * Valida la estructura de cursos extraída
   */
  validateStructure(structure: CourseStructure): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!structure.cursos || structure.cursos.length === 0) {
      errors.push('No se encontraron cursos en el PDF');
    }

    let totalCourses = 0;
    
    for (const yearObj of structure.cursos) {
      for (const year of Object.keys(yearObj)) {
        for (const semester of Object.keys(yearObj[year])) {
          const courses = yearObj[year][semester];
          
          if (courses.length === 0) {
            errors.push(`No hay cursos en ${year} - ${semester}`);
          }

          for (const course of courses) {
            // Validar código
            if (!course.codigo || !/^\d{7}$/.test(course.codigo)) {
              errors.push(`Código inválido: ${course.codigo}`);
            }

            // Validar nombre
            if (!course.nombre || course.nombre === 'NOMBRE_NO_DETECTADO') {
              errors.push(`Nombre no detectado para curso: ${course.codigo}`);
            }

            // Validar horas
            if (course.horas_total <= 0) {
              errors.push(`Horas totales inválidas para curso: ${course.codigo}`);
            }
          }
          
          totalCourses += courses.length;
        }
      }
    }

    if (totalCourses < 1) {
      errors.push(`Solo se detectaron ${totalCourses} cursos, parece muy poco`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}