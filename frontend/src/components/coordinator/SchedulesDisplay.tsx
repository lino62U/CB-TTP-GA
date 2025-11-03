import React, { useState, useRef, useEffect } from 'react';
import Card from '../common/Card';
import TimetableDisplay from './TimetableDisplay';
import Button from '../common/Button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Timetable } from '../../types/index';

interface SchedulesDisplayProps {
  schedules: { [year: string]: Timetable } | null;
}

const SchedulesDisplay: React.FC<SchedulesDisplayProps> = ({ schedules }) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const MIN_ZOOM = 0.6;
  const MAX_ZOOM = 2;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, MAX_ZOOM));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, MIN_ZOOM));
  const handleResetZoom = () => setZoom(1);

  // 📐 Centrar contenido tras cada cambio de zoom
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaledWidth = content.offsetWidth * zoom;
    const scaledHeight = content.offsetHeight * zoom;

    const scrollLeft = Math.max(0, (scaledWidth - containerWidth) / 2);
    const scrollTop = Math.max(0, (scaledHeight - containerHeight) / 6);

    container.scrollTo({
      left: scrollLeft,
      top: scrollTop,
      behavior: 'smooth',
    });
  }, [zoom, schedules]);

  if (!schedules) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md flex flex-col h-[700px] relative overflow-hidden">
      {/* Cabecera */}
      <div className="flex justify-between items-center px-6 py-3 bg-[#7b1c1c] text-white border-b border-[#5e1212]">
        <h2 className="text-lg font-semibold tracking-wide">Horarios Generados</h2>

        <div className="flex gap-2 items-center">
          <Button
            onClick={handleZoomOut}
            className="bg-white text-[#7b1c1c] font-bold shadow-sm hover:bg-[#a72828] hover:text-white transition-all duration-200"
            title="Alejar"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleResetZoom}
            className="bg-white text-[#7b1c1c] font-bold shadow-sm hover:bg-[#a72828] hover:text-white transition-all duration-200"
            title="Restablecer zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleZoomIn}
            className="bg-white text-[#7b1c1c] font-bold shadow-sm hover:bg-[#a72828] hover:text-white transition-all duration-200"
            title="Acercar"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto text-gray-800 p-4 flex justify-center"
      >
        <div
          ref={contentRef}
          className="transition-transform duration-300 ease-in-out inline-block"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <div className="flex flex-col items-center space-y-6">
            {Object.entries(schedules).map(([year, yearTimetable]) => (
              <div key={year} className="w-full max-w-[1200px]">
                <Card title={`Horario ${year}`} noPadding>
                  <TimetableDisplay schedule={yearTimetable} />
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulesDisplay;
