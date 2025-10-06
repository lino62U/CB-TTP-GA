// components/coordinator/SchedulesDisplay.tsx
import React from 'react';
import Card from '../common/Card';
import TimetableDisplay from './TimetableDisplay';
import Button from '../common/Button';
import { Download } from 'lucide-react';
import { exportSchedulesToExcel } from '../../services/coordinatorService';
import { useNotifications } from '../../hooks/useNotifications';
import type { Timetable } from '../../types/index';

interface SchedulesDisplayProps {
  schedules: { [year: string]: Timetable } | null;
}

const SchedulesDisplay: React.FC<SchedulesDisplayProps> = ({ schedules }) => {
  const { addNotification } = useNotifications();

  const handleExport = () => {
    if (!schedules) {
      addNotification('No hay horarios para exportar.', 'warning');
      return;
    }
    exportSchedulesToExcel(schedules as { [year: string]: Timetable }); // Cast with specific type
    addNotification('Horarios exportados a Excel con éxito.', 'success');
  };

  if (!schedules) return null;

  return (
    <>
      <div className="space-y-6">
        {Object.entries(schedules).map(([year, yearTimetable]) => (
          <Card key={year} title={`Horario Generado - ${year}`} noPadding>
            <TimetableDisplay schedule={yearTimetable} />
          </Card>
        ))}
      </div>
      <Button onClick={handleExport} size="lg" className="w-full flex items-center justify-center gap-2" variant="secondary">
        <Download className="h-4 w-4" />
        Exportar Horarios a Excel (Cada Año en una Hoja)
      </Button>
    </>
  );
};

export default SchedulesDisplay;