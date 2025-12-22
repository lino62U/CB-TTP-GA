import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';

interface CourseUploadStats {
  totalCourses: number;
  coursesUpdated: number;
  coursesCreated: number;
  yearsProcessed: number;
}

interface UploadResult {
  success: boolean;
  message: string;
  statistics?: CourseUploadStats;
  errors?: string[];
  preview?: any;
}

export const CourseUploadComponent: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  // Cargar estado actual al montar el componente
  React.useEffect(() => {
    fetchCurrentStatus();
  }, []);

  const fetchCurrentStatus = async () => {
    try {
      const response = await fetch('/api/courses/status');
      const data = await response.json();
      setCurrentStatus(data);
    } catch (error) {
      console.error('Error obteniendo estado actual:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setResult(null);
    } else {
      alert('Por favor, selecciona un archivo PDF válido');
    }
  };

  const uploadFile = async (isPreview: boolean = false) => {
    if (!selectedFile) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('coursePDF', selectedFile);

      const endpoint = isPreview ? '/api/courses/preview' : '/api/courses/upload';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      if (!isPreview && data.success) {
        // Refrescar estado después de upload exitoso
        await fetchCurrentStatus();
      }

    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setResult({
        success: false,
        message: 'Error de conexión al servidor'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Crear un enlace para descargar plantilla o documentación
    alert('Funcionalidad de descarga de plantilla próximamente...');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Gestión de Cursos por PDF
        </h2>
        <p className="text-gray-600">
          Sube un archivo PDF con la estructura de cursos para actualizar automáticamente la base de datos.
        </p>
      </div>

      {/* Mensaje informativo temporal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Procesador PDF en Desarrollo</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>• El sistema de subida está funcional, pero el análisis de PDF usa datos de ejemplo temporalmente.</p>
              <p>• Una vez completada la integración, extraerá automáticamente los cursos del PDF real.</p>
              <p>• Los endpoints están listos y la interfaz funcionará sin cambios adicionales.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado Actual */}
      {currentStatus && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Estado Actual de la Base de Datos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-4">
              <div className="text-2xl font-bold text-blue-600">{currentStatus.statistics?.totalCourses || 0}</div>
              <div className="text-sm text-gray-600">Cursos Totales</div>
            </div>
            <div className="bg-white rounded p-4">
              <div className="text-sm font-medium text-gray-800">
                {currentStatus.lastUpdate !== 'Nunca' 
                  ? new Date(currentStatus.lastUpdate).toLocaleDateString('es-ES')
                  : 'Nunca'
                }
              </div>
              <div className="text-sm text-gray-600">Última Actualización</div>
            </div>
            <div className="bg-white rounded p-4">
              <div className="text-sm font-medium text-gray-800">{currentStatus.source || 'Desconocido'}</div>
              <div className="text-sm text-gray-600">Fuente</div>
            </div>
          </div>
        </div>
      )}

      {/* Zona de Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {/* Selección de archivo */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-700">
                {selectedFile ? selectedFile.name : 'Selecciona un archivo PDF'}
              </div>
              <div className="text-sm text-gray-500">
                {selectedFile 
                  ? `Tamaño: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                  : 'Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionar'
                }
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Seleccionar PDF
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          {selectedFile && (
            <div className="flex space-x-4">
              <button
                onClick={() => uploadFile(true)}
                disabled={uploading}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {uploading ? 'Procesando...' : 'Vista Previa'}
              </button>
              
              <button
                onClick={() => uploadFile(false)}
                disabled={uploading}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Procesando...' : 'Subir y Actualizar'}
              </button>
            </div>
          )}

          {/* Botón de ayuda */}
          <div className="text-center">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar plantilla de ejemplo
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {result && (
        <div className={`rounded-lg p-6 ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </h4>

              {/* Estadísticas */}
              {result.statistics && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded p-3">
                    <div className="text-lg font-bold text-green-600">{result.statistics.totalCourses}</div>
                    <div className="text-xs text-gray-600">Cursos Totales</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-lg font-bold text-blue-600">{result.statistics.coursesCreated}</div>
                    <div className="text-xs text-gray-600">Cursos Nuevos</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-lg font-bold text-yellow-600">{result.statistics.coursesUpdated}</div>
                    <div className="text-xs text-gray-600">Actualizados</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-lg font-bold text-purple-600">{result.statistics.yearsProcessed}</div>
                    <div className="text-xs text-gray-600">Años Procesados</div>
                  </div>
                </div>
              )}

              {/* Errores */}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-red-800 mb-2">Errores encontrados:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {result.preview && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-800 mb-2">Vista previa extraída:</h5>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.preview, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Instrucciones</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• El PDF debe contener una tabla estructurada con cursos organizados por año y semestre.</p>
          <p>• Cada fila debe incluir: código, nombre, departamento, créditos, prerrequisitos y horas.</p>
          <p>• Los marcadores de contexto ("PRIMER AÑO", "PRIMER SEMESTRE") deben estar claramente definidos.</p>
          <p>• Usa "Vista Previa" para verificar la extracción antes de actualizar la base de datos.</p>
          <p>• La actualización reemplaza completamente los cursos existentes (se crea backup automático).</p>
        </div>
      </div>
    </div>
  );
};