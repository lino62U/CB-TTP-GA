
import React from 'react';
import type { Timetable, TimetableEntry } from '../../types/index';
import { DAYS_OF_WEEK } from '../../utils/constants';

interface TimetableDisplayProps {
  schedule: Timetable;
}

const courseColors = [
  'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-red-200', 'bg-teal-200',
  'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-red-400', 'bg-teal-400'
];

const getCourseColor = (courseName: string) => {
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % courseColors.length);
  return courseColors[index];
};

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ schedule }) => {

  const scheduleMap = new Map<string, TimetableEntry>();
  schedule.forEach(entry => {
    const key = `${entry.day}-${entry.timeSlot}`;
    scheduleMap.set(key, entry);
  });

  const uniqueTimeSlots = Array.from(new Set(schedule.map(s => s.timeSlot))).sort();

  return (
    <div className="overflow-x-auto p-4 bg-white rounded-b-lg">
      <table className="min-w-full border-collapse text-sm text-center w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-200 sticky left-0 bg-gray-100 z-10 w-64">Hora</th>
            {DAYS_OF_WEEK.map(day => (
              <th key={day} className="p-2 border border-gray-200 whitespace-nowrap min-w-[250px]">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {uniqueTimeSlots.map(timeSlot => (
            <tr key={timeSlot} className="h-20">
              <td className="p-2 border border-gray-200 font-medium text-gray-600 sticky left-0 bg-white z-10 w-full">{timeSlot}</td>
              {DAYS_OF_WEEK.map(day => {
                const key = `${day}-${timeSlot}`;
                const entry = scheduleMap.get(key);
                if (entry) {
                  return (
                    <td key={key} className={`border p-1 align-top text-left ${getCourseColor(entry.course)} border-gray-300 w-64`}>
                      <div className="text-[14px] font-bold">{entry.course.slice(0, 30)}</div>
                      <div className="text-[12px] text-gray-700">{entry.teacher.slice(0, 20)}</div>
                      <div className="text-[12px] text-gray-600 font-semibold">{entry.room} ({entry.type})</div>
                    </td>
                  );
                }
                return <td key={key} className="border border-gray-200"></td>;
              })}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
};

export default TimetableDisplay;
