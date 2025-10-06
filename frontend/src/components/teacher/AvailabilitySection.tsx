// components/teacher/AvailabilitySection.tsx
import React from 'react';
import Card from '../common/Card';
import AvailabilityGrid from './AvailabilityGrid'; // Asume en components/shared o common
import type { Availability } from '../../types';

interface AvailabilitySectionProps {
  availability: Availability;
  onAvailabilityChange: (newAvailability: Availability) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  availability,
  onAvailabilityChange,
}) => (
  <Card title="Disponibilidad Horaria" description="Seleccione los bloques en los que está disponible para dictar clases.">
    <AvailabilityGrid availability={availability} setAvailability={onAvailabilityChange} />
  </Card>
);

export default AvailabilitySection;