import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  deviceId: string | null;
  setDeviceId: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  return (
    <AppContext.Provider value={{ deviceId, setDeviceId }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
