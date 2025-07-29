// src/contexts/LastUpdatedContext.tsx
import React, { createContext, useState, useContext, type ReactNode, useCallback, useEffect } from 'react';
import { useGlobalRefresh } from './GlobalRefreshContext';

// 1. Atualizar a interface LastUpdatedContextType
interface LastUpdatedContextType {
  lastUpdateTime: Date | null;
  signalUpdate: () => void;
  addActivity: (message: string) => void;
  lastUpdatedGlobal: Date | null;
}

const LastUpdatedContext = createContext<LastUpdatedContextType | undefined>(undefined);

export const LastUpdatedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  // Você pode adicionar um estado para armazenar as atividades se desejar
  // const [activities, setActivities] = useState<string[]>([]);
  const { tick } = useGlobalRefresh();

  const signalUpdate = useCallback(() => {
    setLastUpdateTime(new Date());
  }, []);

  // 2. Implementar addActivity no LastUpdatedProvider
  const addActivity = useCallback((message: string) => {
    // Exemplo: registrar no console.
    // Em uma aplicação real, você pode querer armazenar isso em um estado
    // ou enviar para um serviço de logging.
    // Activity logged
    // Se você tivesse um estado para atividades:
    // setActivities(prevActivities => [...prevActivities, `${new Date().toISOString()}: ${message}`]);
  }, []); // Adicionar dependências se 'activities' ou similar for usado
  
  // Não atualizamos o lastUpdateTime automaticamente com o tick
  // Ele só deve ser atualizado quando os dados realmente forem atualizados

  return (
    // 3. Incluir addActivity no valor do Provider
    <LastUpdatedContext.Provider value={{ lastUpdateTime, signalUpdate, addActivity, lastUpdatedGlobal: lastUpdateTime }}>
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

// Se você quiser expor as atividades, adicione 'activities' ao context type e ao provider value.