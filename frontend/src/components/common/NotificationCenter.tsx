// NotificationCenter.tsx
import React, { useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <XCircle className="h-6 w-6 text-red-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
  warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
};

interface NotificationItemProps {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // desaparece automáticamente
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="flex items-center p-4 mb-3 max-w-md w-full bg-white shadow-lg rounded-lg border-l-4 border-gray-300 pointer-events-auto overflow-hidden animate-slide-in-right">
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900">{message}</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="sr-only">Close</span>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-5 right-5 w-full max-w-md z-50">
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          id={n.id}
          message={n.message}
          type={n.type}
          onClose={() => removeNotification(n.id)}
        />
      ))}
    </div>
  );
};

export default NotificationCenter;
