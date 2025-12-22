import React, { useState, useEffect } from 'react';
import { Users, User, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface Docente {
  id: string;
  nombre: string;
  departamento: string;
  especialidades: string[];
  disponibilidad: 'completa' | 'parcial';
}

interface Asignacion {
  codigo_curso: string;
  nombre_curso: string;
  docente_asignado: string;
  modalidad: string;
  año: string;
  semestre: string;
}

interface Statistics {
  totalCursos: number;
  cursosAsignados: number;
  cursosSinAsignar: number;
}

const DocenteAssignmentComponent: React.FC = () => {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalCursos: 0,
    cursosAsignados: 0,
    cursosSinAsignar: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDocente, setSelectedDocente] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([
      fetchDocentes(),
      fetchAsignaciones()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchDocentes = async () => {
    try {
      const response = await fetch('/api/docentes/disponibles');
      const data = await response.json();
      if (data.success) {
        setDocentes(data.docentes);
      }
    } catch (error) {
      console.error('Error fetching docentes:', error);
      showMessage('error', 'Error cargando lista de docentes');
    }
  };

  const fetchAsignaciones = async () => {
    try {
      const response = await fetch('/api/docentes/asignaciones');
      const data = await response.json();
      if (data.success) {
        setAsignaciones(data.asignaciones);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
      showMessage('error', 'Error cargando asignaciones');
    }
  };

  const handleAsignarDocente = async () => {
    if (!selectedCourse || !selectedDocente) {
      showMessage('error', 'Selecciona un curso y un docente');
      return;
    }

    try {
      // Encontrar los detalles del curso seleccionado
      const curso = asignaciones.find(a => a.codigo_curso === selectedCourse);
      if (!curso) {
        showMessage('error', 'Curso no encontrado');
        return;
      }

      const response = await fetch('/api/docentes/asignar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo_curso: selectedCourse,
          docente_id: selectedDocente,
          año: curso.año,
          semestre: curso.semestre
        }),
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Docente asignado exitosamente');
        setSelectedCourse('');
        setSelectedDocente('');
        fetchAsignaciones(); // Recargar datos
      } else {
        showMessage('error', data.message || 'Error asignando docente');
      }
    } catch (error) {
      console.error('Error asignando docente:', error);
      showMessage('error', 'Error de conexión al servidor');
    }
  };

  const handleRemoverAsignacion = async (curso: Asignacion) => {
    if (!confirm(`¿Remover asignación de docente para ${curso.nombre_curso}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/docentes/remover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo_curso: curso.codigo_curso,
          año: curso.año,
          semestre: curso.semestre
        }),
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Asignación removida exitosamente');
        fetchAsignaciones(); // Recargar datos
      } else {
        showMessage('error', data.message || 'Error removiendo asignación');
      }
    } catch (error) {
      console.error('Error removiendo asignación:', error);
      showMessage('error', 'Error de conexión al servidor');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const cursosDisponibles = asignaciones.filter(a => a.docente_asignado === 'Sin asignar');
  const cursosAsignados = asignaciones.filter(a => a.docente_asignado !== 'Sin asignar');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Cargando datos de docentes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="h-6 w-6 mr-2 text-blue-600" />
          Asignación de Docentes
        </h2>
        <p className="text-gray-600">
          Gestiona las asignaciones de docentes a los cursos extraídos del PDF de malla curricular.
        </p>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-700' 
            : 'bg-red-50 border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Estado de Asignaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalCursos}</div>
            <div className="text-sm text-gray-600">Total Cursos</div>
          </div>
          <div className="bg-white rounded p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statistics.cursosAsignados}</div>
            <div className="text-sm text-gray-600">Asignados</div>
          </div>
          <div className="bg-white rounded p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{statistics.cursosSinAsignar}</div>
            <div className="text-sm text-gray-600">Sin Asignar</div>
          </div>
        </div>
      </div>

      {/* Asignación Nueva */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-green-600" />
          Nueva Asignación
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Curso Sin Asignar
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar curso...</option>
              {cursosDisponibles.map((curso) => (
                <option key={curso.codigo_curso} value={curso.codigo_curso}>
                  {curso.codigo_curso} - {curso.nombre_curso} ({curso.año}/{curso.semestre})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Docente Disponible
            </label>
            <select
              value={selectedDocente}
              onChange={(e) => setSelectedDocente(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar docente...</option>
              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docente.nombre} - {docente.departamento} ({docente.disponibilidad})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAsignarDocente}
              disabled={!selectedCourse || !selectedDocente}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Asignar Docente
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Cursos Asignados */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cursos con Docentes Asignados</h3>
        
        {cursosAsignados.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay cursos con docentes asignados aún.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Docente Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modalidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año/Semestre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cursosAsignados.map((asignacion) => (
                  <tr key={asignacion.codigo_curso} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {asignacion.codigo_curso}
                      </div>
                      <div className="text-sm text-gray-500">
                        {asignacion.nombre_curso}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {asignacion.docente_asignado}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        asignacion.modalidad === 'laboratorio' 
                          ? 'bg-purple-100 text-purple-800'
                          : asignacion.modalidad === 'mixto'
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {asignacion.modalidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {asignacion.año.replace('_', ' ')} - {asignacion.semestre.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoverAsignacion(asignacion)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista de Cursos Sin Asignar */}
      {cursosDisponibles.length > 0 && (
        <div className="bg-yellow-50 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            Cursos Pendientes de Asignación ({cursosDisponibles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cursosDisponibles.map((curso) => (
              <div key={curso.codigo_curso} className="bg-white p-3 rounded border">
                <div className="font-medium text-sm">{curso.codigo_curso}</div>
                <div className="text-xs text-gray-600 truncate" title={curso.nombre_curso}>
                  {curso.nombre_curso}
                </div>
                <div className="text-xs text-yellow-600">
                  {curso.año.replace('_', ' ')} - {curso.semestre.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocenteAssignmentComponent;