// components/coordinator/ResourceManager.tsx
import React from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { Building, Trash2 } from 'lucide-react';
import type { Infrastructure, Room } from '../../types';

interface ResourceManagerProps {
  infrastructure: Infrastructure;
  onRoomChange: (type: 'classrooms' | 'labs', index: number, field: keyof Omit<Room, 'id'>, value: string) => void;
  onAddRoom: (type: 'classrooms' | 'labs') => void;
  onRemoveRoom: (type: 'classrooms' | 'labs', index: number) => void;
}

const ResourceManager: React.FC<ResourceManagerProps> = ({
  infrastructure,
  onRoomChange,
  onAddRoom,
  onRemoveRoom,
}) => {
  const renderRoomList = (type: 'classrooms' | 'labs') => (
    <div className="space-y-3">
      {infrastructure[type].map((room, index) => (
        <div key={room.id} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-6">
            <Input
              label=""
              id={`name-${room.id}`}
              value={room.name}
              onChange={e => onRoomChange(type, index, 'name', e.target.value)}
              placeholder="Nombre"
            />
          </div>
          <div className="col-span-4">
            <Input
              label=""
              id={`capacity-${room.id}`}
              type="number"
              value={room.capacity}
              onChange={e => onRoomChange(type, index, 'capacity', e.target.value)}
              placeholder="Cap."
            />
          </div>
          <div className="col-span-2 pt-4">
            <Button variant="danger" size="sm" onClick={() => onRemoveRoom(type, index)} className="w-full">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" onClick={() => onAddRoom(type)} className="w-full mt-2">
        Añadir {type === 'classrooms' ? 'Salón' : 'Laboratorio'}
      </Button>
    </div>
  );

  return (
    <Card title="Gestión de Recursos" icon={<Building />}>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Salones de Clases</h3>
          {renderRoomList('classrooms')}
        </div>
        <hr />
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Laboratorios</h3>
          {renderRoomList('labs')}
        </div>
      </div>
    </Card>
  );
};

export default ResourceManager;