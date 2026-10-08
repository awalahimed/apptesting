import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isSidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
}

const defaultContext: SidebarContextType = {
  isSidebarVisible: false,
  setSidebarVisible: () => {},
  toggleSidebar: () => {},
};

const SidebarContext = createContext<SidebarContextType>(defaultContext);

export const useSidebar = () => {
  return useContext(SidebarContext);
};

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => setSidebarVisible(!isSidebarVisible);

  return (
    <SidebarContext.Provider value={{ isSidebarVisible, setSidebarVisible, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
