import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchUnifiedMonitoringData } from '../services/unifiedMonitoringApi';
import type { UnifiedMonitoringData, FileProcessingJob } from '../services/unifiedMonitoringApi';

interface UnifiedTrackingItem {
  trackingId: string;
  fileName: string;
  source: 'drive' | 'upload' | 'local';
  currentStage: 'downloading' | 'extracting' | 'validating' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  queuePosition?: number;
}

interface UnifiedTrackingContextType {
  items: UnifiedTrackingItem[];
  stats: {
    downloading: number;
    extracting: number;
    validating: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  isLoading: boolean;
  
  // Ações para integração com outras telas
  startDownload: (fileName: string, source: 'drive' | 'upload') => string;
  updateProgress: (trackingId: string, stage: string, progress: number) => void;
  completeItem: (trackingId: string) => void;
  failItem: (trackingId: string, error: string) => void;
}

const UnifiedTrackingContext = createContext<UnifiedTrackingContextType | undefined>(undefined);

export const UnifiedTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<UnifiedTrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const syncWithAPIs = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const data = await fetchUnifiedMonitoringData();
      const unifiedItems: UnifiedTrackingItem[] = [];

      // Converter jobs para items unificados
      [...data.activeJobs, ...data.recentlyCompleted, ...data.recentlyFailed]
        .forEach((job: FileProcessingJob) => {
          const stage = convertJobStatusToStage(job.status);
          
          unifiedItems.push({
            trackingId: job.id,
            fileName: job.fileName,
            source: job.sourceType === 'google_drive' ? 'drive' : job.sourceType === 'upload' ? 'upload' : 'local',
            currentStage: stage,
            progress: job.overallProgress || 0,
            startedAt: new Date(job.createdAt),
            updatedAt: new Date(),
            ...(job.completedAt && { completedAt: new Date(job.completedAt) }),
            ...(job.errorMessage && { errorMessage: job.errorMessage })
          });
        });

      setItems(unifiedItems);
      
    } catch (error) {
      console.error('Erro ao sincronizar tracking unificado:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const convertJobStatusToStage = (status: string): UnifiedTrackingItem['currentStage'] => {
    switch (status) {
      case 'downloading': return 'downloading';
      case 'extracting': return 'extracting';
      case 'validating': return 'validating';
      case 'queued': return 'queued';
      case 'processing': return 'processing';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      default: return 'queued';
    }
  };

  // Sincronizar a cada 2 segundos
  useEffect(() => {
    syncWithAPIs();
    const interval = setInterval(syncWithAPIs, 2000);
    return () => clearInterval(interval);
  }, [syncWithAPIs]);

  // Calcular estatísticas
  const stats = React.useMemo(() => {
    const counts = items.reduce((acc, item) => {
      acc[item.currentStage]++;
      acc.total++;
      return acc;
    }, {
      downloading: 0,
      extracting: 0,
      validating: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0
    });
    
    return counts;
  }, [items]);

  // Ações para integração com outras telas
  const startDownload = useCallback((fileName: string, source: 'drive' | 'upload'): string => {
    const trackingId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newItem: UnifiedTrackingItem = {
      trackingId,
      fileName,
      source,
      currentStage: 'downloading',
      progress: 0,
      startedAt: new Date(),
      updatedAt: new Date()
    };

    setItems(prev => [...prev, newItem]);
    return trackingId;
  }, []);

  const updateProgress = useCallback((trackingId: string, stage: string, progress: number) => {
    setItems(prev => prev.map(item => 
      item.trackingId === trackingId 
        ? { 
            ...item, 
            currentStage: stage as UnifiedTrackingItem['currentStage'],
            progress, 
            updatedAt: new Date() 
          }
        : item
    ));
  }, []);

  const completeItem = useCallback((trackingId: string) => {
    setItems(prev => prev.map(item => 
      item.trackingId === trackingId 
        ? { 
            ...item, 
            currentStage: 'completed',
            progress: 100,
            completedAt: new Date(),
            updatedAt: new Date() 
          }
        : item
    ));
  }, []);

  const failItem = useCallback((trackingId: string, error: string) => {
    setItems(prev => prev.map(item => 
      item.trackingId === trackingId 
        ? { 
            ...item, 
            currentStage: 'failed',
            errorMessage: error,
            updatedAt: new Date() 
          }
        : item
    ));
  }, []);

  const value: UnifiedTrackingContextType = {
    items,
    stats,
    isLoading,
    startDownload,
    updateProgress,
    completeItem,
    failItem
  };

  return (
    <UnifiedTrackingContext.Provider value={value}>
      {children}
    </UnifiedTrackingContext.Provider>
  );
};

export const useUnifiedTracking = () => {
  const context = useContext(UnifiedTrackingContext);
  if (context === undefined) {
    throw new Error('useUnifiedTracking must be used within a UnifiedTrackingProvider');
  }
  return context;
};