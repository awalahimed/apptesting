import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DriverStatusContextType {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  toggleOnlineStatus: () => void;
}

const DriverStatusContext = createContext<DriverStatusContextType | undefined>(undefined);

const DRIVER_STATUS_KEY = 'driver_online_status';

export function DriverStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnlineState] = useState(true); // Default to online

  // Load saved status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem(DRIVER_STATUS_KEY);
      if (saved !== null) {
        setIsOnlineState(saved === 'true');
      }
    } catch (error) {
      console.error('Failed to load driver status:', error);
    }
  };

  const setIsOnline = async (online: boolean) => {
    try {
      setIsOnlineState(online);
      await AsyncStorage.setItem(DRIVER_STATUS_KEY, online.toString());
      console.log(`🚗 Driver status changed to: ${online ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('Failed to save driver status:', error);
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  return (
    <DriverStatusContext.Provider value={{ isOnline, setIsOnline, toggleOnlineStatus }}>
      {children}
    </DriverStatusContext.Provider>
  );
}

export function useDriverStatus() {
  const context = useContext(DriverStatusContext);
  if (context === undefined) {
    throw new Error('useDriverStatus must be used within a DriverStatusProvider');
  }
  return context;
}
