// src/contexts/LastUpdatedContext.tsx
import React, { createContext, useState, useContext, type ReactNode, useCallback } from 'react';

interface LastUpdatedContextType {
  lastUpdateTime: Date | null;
  signalUpdate: () => void;
}

const LastUpdatedContext = createContext<LastUpdatedContextType | undefined>(undefined);

export const LastUpdatedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const signalUpdate = useCallback(() => {
    // console.log('LastUpdatedContext: signalUpdate called'); // Para depuração
    setLastUpdateTime(new Date());
  }, []);

  return (
    <LastUpdatedContext.Provider value={{ lastUpdateTime, signalUpdate }}>
      {children}
    </LastUpdatedContext.Provider>
  );
};

export const useLastUpdated = (): LastUpdatedContextType => {
  const context = useContext(LastUpdatedContext);
  if (!context) {
    throw new Error('useLastUpdated must be used within a LastUpdatedProvider');
  }
  return context;
};