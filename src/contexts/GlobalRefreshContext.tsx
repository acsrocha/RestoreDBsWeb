// src/contexts/GlobalRefreshContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

const REFRESH_TICK_RATE = 15000; // 15 segundos para uma UI mais calma

interface GlobalRefreshContextType {
  tick: number;
}

const GlobalRefreshContext = createContext<GlobalRefreshContextType | undefined>(undefined);

export const GlobalRefreshProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      setTick(prev => prev + 1);
    }, REFRESH_TICK_RATE);

    return () => clearInterval(timerId);
  }, []); // Roda apenas uma vez na montagem

  return (
    <GlobalRefreshContext.Provider value={{ tick }}>
      {children}
    </GlobalRefreshContext.Provider>
  );
};

export const useGlobalRefresh = () => {
  const context = useContext(GlobalRefreshContext);
  if (!context) {
    throw new Error('useGlobalRefresh must be used within a GlobalRefreshProvider');
  }
  return context;
};