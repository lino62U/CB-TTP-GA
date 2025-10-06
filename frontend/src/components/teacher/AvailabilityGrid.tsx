import React from 'react';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../../utils/constants';
import type { Availability, Day } from '../../types/index';

interface AvailabilityGridProps {
  availability: Availability;
  setAvailability: React.Dispatch<React.SetStateAction<Availability>>;
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({ availability, setAvailability }) => {
  const toggleSlot = (day: Day, timeSlot: string) => {
    setAvailability(prev => {
      const newAvailability = { ...prev };
      const daySlots = newAvailability[day] || [];
      
      if (daySlots.includes(timeSlot)) {
        newAvailability[day] = daySlots.filter(slot => slot !== timeSlot);
      } else {
        newAvailability[day] = [...daySlots, timeSlot];
      }
      return newAvailability;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-200 sticky left-0 bg-gray-100 z-10 w-28">Hora</th>
            {DAYS_OF_WEEK.map(day => (
              <th key={day} className="p-2 border border-gray-200 whitespace-nowrap min-w-[100px]">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="p-2 border border-gray-200 font-medium text-gray-600 sticky left-0 bg-white z-10 w-28">{timeSlot}</td>
              {DAYS_OF_WEEK.map(day => {
                const isSelected = availability[day]?.includes(timeSlot);
                return (
                  <td
                    key={`${day}-${timeSlot}`}
                    className={`border border-gray-200 cursor-pointer transition-colors duration-200 ${
                      isSelected ? 'bg-primary text-white' : 'bg-white hover:bg-primary/10'
                    }`}
                    onClick={() => toggleSlot(day, timeSlot)}
                  >
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AvailabilityGrid;