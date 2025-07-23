// src/contexts/FileMonitoringContext.tsx
import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { fetchFileMonitoringData } from '../services/fileMonitoringApi';
import type { FileMonitoringData, FileProcessingDetail } from '../types/fileMonitoring';
import { useNotification } from '../hooks/useNotification';
import { useGlobalRefresh } from './GlobalRefreshContext';

interface FileMonitoringContextType {
  monitoringData: FileMonitoringData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
  getFileById: (fileId: string) => FileProcessingDetail | undefined;
}

const FileMonitoringContext = createContext<FileMonitoringContextType | undefined>(undefined);

export const FileMonitoringProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [monitoringData, setMonitoringData] = useState<FileMonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { showError } = useNotification();
  const { tick } = useGlobalRefresh();

  const refreshData = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const data = await fetchFileMonitoringData();
      // Verificar se os dados realmente mudaram antes de atualizar
      const dataChanged = JSON.stringify(data) !== JSON.stringify(monitoringData);
      
      if (dataChanged) {
        setMonitoringData(data);
        setLastUpdated(new Date());
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dados de monitoramento';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, showError, monitoringData]);

  const getFileById = useCallback((fileId: string): FileProcessingDetail | undefined => {
    if (!monitoringData) return undefined;
    
    return [
      ...monitoringData.activeFiles,
      ...monitoringData.recentlyCompleted,
      ...monitoringData.recentlyFailed
    ].find(file => file.fileId === fileId);
  }, [monitoringData]);

  // Carregar dados iniciais APENAS UMA VEZ
  useEffect(() => {
    refreshData();
  }, []); // Array de dependências vazio
  
  // Atualizar quando o tick global mudar, mas pular o tick inicial (0)
  useEffect(() => {
    if (tick > 0) {
      refreshData();
    }
  }, [tick]); // Remova refreshData das dependências para evitar loop

  return (
    <FileMonitoringContext.Provider 
      value={{ 
        monitoringData, 
        isLoading, 
        error, 
        lastUpdated, 
        refreshData,
        getFileById
      }}
    >
      {children}
    </FileMonitoringContext.Provider>
  );
};

export const useFileMonitoring = (): FileMonitoringContextType => {
  const context = useContext(FileMonitoringContext);
  if (!context) {
    throw new Error('useFileMonitoring must be used within a FileMonitoringProvider');
  }
  return context;
};