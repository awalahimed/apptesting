import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { orpc } from './orpc';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    try {
      const result = await orpc.notifications.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error: any) {
      // Silently ignore session expired errors - user will be redirected to login by auth context
      const ignoredErrors = ['Session expired', 'Not Found', 'Unauthorized'];
      if (!ignoredErrors.includes(error?.message)) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  const decrementUnreadCount = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const { isAuthenticated } = useAuth();

  // Fetch on mount and setup polling when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    refreshUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, decrementUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};
