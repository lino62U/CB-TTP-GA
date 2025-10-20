// components/coordinator/AdvancedConfiguration.tsx
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { Settings, Info, Save } from 'lucide-react';

interface Constraint {
  name: string;
  displayName: string;
  weight: number;
  description: string;
}

interface AdvancedConfigurationProps {
  onConfigurationChange?: (config: any) => void;
}

const AdvancedConfiguration: React.FC<AdvancedConfigurationProps> = ({
  onConfigurationChange
}) => {
  const [constraints, setConstraints] = useState<Constraint[]>([
    {
      name: 'availability',
      displayName: 'Disponibilidad Profesores',
      weight: 5,
      description: 'Prioriza sesiones que respeten la disponibilidad declarada por cada profesor'
    },
    {
      name: 'capacity',
      displayName: 'Capacidad Aulas',
      weight: 3,
      description: 'Penaliza la asignación de cursos a aulas con capacidad inferior a la demanda'
    },
    {
      name: 'conflicts',
      displayName: 'Conflictos Horario',
      weight: 10,
      description: 'Penaliza fuertemente la asignación de un profesor o grupo a dos sesiones que se solapan'
    },
    {
      name: 'preferences',
      displayName: 'Preferencias Curso',
      weight: 2,
      description: 'Considera preferencias expresas de ubicación o franja horaria para determinados cursos'
    },
    {
      name: 'balance',
      displayName: 'Balance Carga Profesores',
      weight: 1,
      description: 'Incentiva una distribución equitativa de la carga lectiva entre profesores'
    }
  ]);

  const [algorithmParams, setAlgorithmParams] = useState({
    generations: 1000,
    population_size: 200,
    mutation_rate: 0.02,
    selection_rate: 0.7,
    elite_size: 10
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleWeightChange = (index: number, newWeight: number) => {
    const updatedConstraints = [...constraints];
    updatedConstraints[index].weight = newWeight;
    setConstraints(updatedConstraints);
    
    if (onConfigurationChange) {
      onConfigurationChange({
        weights: Object.fromEntries(
          updatedConstraints.map(c => [c.name, c.weight])
        ),
        ...algorithmParams
      });
    }
  };

  const handleParamChange = (param: string, value: number) => {
    const updatedParams = { ...algorithmParams, [param]: value };
    setAlgorithmParams(updatedParams);
    
    if (onConfigurationChange) {
      onConfigurationChange({
        weights: Object.fromEntries(
          constraints.map(c => [c.name, c.weight])
        ),
        ...updatedParams
      });
    }
  };

  const resetToDefaults = () => {
    const defaultConstraints = [
      { name: 'availability', displayName: 'Disponibilidad Profesores', weight: 5, description: 'Prioriza sesiones que respeten la disponibilidad declarada por cada profesor' },
      { name: 'capacity', displayName: 'Capacidad Aulas', weight: 3, description: 'Penaliza la asignación de cursos a aulas con capacidad inferior a la demanda' },
      { name: 'conflicts', displayName: 'Conflictos Horario', weight: 10, description: 'Penaliza fuertemente la asignación de un profesor o grupo a dos sesiones que se solapan' },
      { name: 'preferences', displayName: 'Preferencias Curso', weight: 2, description: 'Considera preferencias expresas de ubicación o franja horaria para determinados cursos' },
      { name: 'balance', displayName: 'Balance Carga Profesores', weight: 1, description: 'Incentiva una distribución equitativa de la carga lectiva entre profesores' }
    ];
    
    const defaultParams = {
      generations: 1000,
      population_size: 200,
      mutation_rate: 0.02,
      selection_rate: 0.7,
      elite_size: 10
    };

    setConstraints(defaultConstraints);
    setAlgorithmParams(defaultParams);
  };

  return (
    <Card 
      title="Configuraciones Avanzadas" 
      icon={<Settings />}
      className="mt-6"
    >
      <div className="space-y-6">
        {/* Toggle para mostrar/ocultar configuraciones */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              Ajusta los pesos y parámetros del algoritmo genético
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'} Configuraciones
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-6">
            {/* Sección de Constraints y Pesos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Constraints y Pesos
              </h3>
              <div className="space-y-4">
                {constraints.map((constraint, index) => (
                  <div key={constraint.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{constraint.displayName}</h4>
                        <p className="text-sm text-gray-600 mt-1">{constraint.description}</p>
                      </div>
                      <div className="ml-4 w-24">
                        <Input
                          label="Peso"
                          type="number"
                          min="0"
                          max="20"
                          value={constraint.weight}
                          onChange={(e) => handleWeightChange(index, parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de Modificaciones Avanzadas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Modificaciones Avanzadas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Generaciones"
                  type="number"
                  min="100"
                  max="5000"
                  value={algorithmParams.generations}
                  onChange={(e) => handleParamChange('generations', parseInt(e.target.value) || 1000)}
                />
                <Input
                  label="Tamaño Población"
                  type="number"
                  min="50"
                  max="1000"
                  value={algorithmParams.population_size}
                  onChange={(e) => handleParamChange('population_size', parseInt(e.target.value) || 200)}
                />
                <Input
                  label="Tasa de Mutación"
                  type="number"
                  step="0.01"
                  min="0.001"
                  max="0.1"
                  value={algorithmParams.mutation_rate}
                  onChange={(e) => handleParamChange('mutation_rate', parseFloat(e.target.value) || 0.02)}
                />
                <Input
                  label="Tasa de Selección"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={algorithmParams.selection_rate}
                  onChange={(e) => handleParamChange('selection_rate', parseFloat(e.target.value) || 0.7)}
                />
                <Input
                  label="Tamaño Elite"
                  type="number"
                  min="1"
                  max="50"
                  value={algorithmParams.elite_size}
                  onChange={(e) => handleParamChange('elite_size', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={resetToDefaults}
              >
                Restaurar por Defecto
              </Button>
              <Button
                onClick={() => {
                  // Aquí podrías guardar la configuración
                  console.log('Configuración guardada:', {
                    weights: Object.fromEntries(constraints.map(c => [c.name, c.weight])),
                    ...algorithmParams
                  });
                }}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </Button>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Notas sobre las configuraciones:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Los pesos más altos dan mayor importancia a ese constraint en la función de fitness</li>
                    <li>Aumentar generaciones puede mejorar la calidad pero incrementa el tiempo de ejecución</li>
                    <li>Una tasa de mutación muy alta puede impedir la convergencia</li>
                    <li>El tamaño elite preserva las mejores soluciones entre generaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdvancedConfiguration;