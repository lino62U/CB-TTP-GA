// components/coordinator/AlgorithmRunner.tsx
import React, { useState } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { PlayCircle } from 'lucide-react';
import type { AlgorithmParams } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

interface AlgorithmRunnerProps {
  params: AlgorithmParams;
  onParamsChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRunAlgorithm: (params: AlgorithmParams) => void;
  isLoading: boolean;
}

const AlgorithmRunner: React.FC<AlgorithmRunnerProps> = ({
  params,
  onParamsChange,
  onRunAlgorithm,
  isLoading,
}) => {
  const { addNotification } = useNotifications();
  const [progress, setProgress] = useState(0); // Estado local para progress

  const handleRun = async () => {
    setProgress(0);
    addNotification('Iniciando la generación del horario...', 'info');

    const interval = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + Math.random() * 5 : prev));
    }, 300);

    try {
      await onRunAlgorithm(params); // Llama callback del page
      clearInterval(interval);
      setProgress(100);
      addNotification('¡Horarios generados con éxito para todos los años! (Datos de prueba)', 'success');
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      addNotification(errorMessage, 'error');
    } finally {
      setTimeout(() => setProgress(0), 500);
    }
  };

  const renderProgressBar = () => (
    <div className="mt-4">
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-4 bg-gradient-to-r from-primary to-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute w-full text-center text-xs font-semibold text-gray-700 top-0">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );

  return (
    <Card title="Generador de Horarios" icon={<PlayCircle />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          label="Población (pop)"
          name="population"
          type="number"
          value={params.population}
          onChange={onParamsChange}
        />
        <Input
          label="Generaciones (gens)"
          name="generations"
          type="number"
          value={params.generations}
          onChange={onParamsChange}
        />
        <Input
          label="Tasa de Mutación"
          name="mutationRate"
          type="number"
          step="0.01"
          value={params.mutationRate}
          onChange={onParamsChange}
        />
      </div>

      {/* 🔽 NUEVO: Select para semestre */}
      <div className="mb-6">
        <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
          Semestre Académico
        </label>
        <select
          id="semester"
          name="semester"
          value={params.semester || 'A'}
          onChange={onParamsChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-primary/30 focus:border-primary"
        >
          <option value="A">Semestre A</option>
          <option value="B">Semestre B</option>
        </select>
      </div>

      <Button onClick={handleRun} disabled={isLoading} size="lg" className="w-full">
        {isLoading ? (
          <>
            <Spinner /> Generando Horarios...
          </>
        ) : (
          'Ejecutar Algoritmo y Generar Horarios (Prueba)'
        )}
      </Button>

      {isLoading && renderProgressBar()}
    </Card>
  );
};

export default AlgorithmRunner;