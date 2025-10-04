import React, { createContext, useState, useCallback, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: number) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Agregar notificación sin duplicados por mensaje
  const addNotification = useCallback((message: string, type: NotificationType) => {
    setNotifications(prev => {
      // Evita duplicados
      if (prev.some(n => n.message === message)) return prev;

      const id = Date.now(); // id único basado en timestamp
      return [...prev, { id, message, type }];
    });
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Auto eliminar cada notificación después de 5 segundos
  React.useEffect(() => {
    notifications.forEach(n => {
      const timer = setTimeout(() => removeNotification(n.id), 5000);
      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
