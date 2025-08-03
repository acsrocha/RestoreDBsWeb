import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchUnifiedMonitoringData } from '../services/unifiedMonitoringApi';
import type { UnifiedMonitoringData, FileProcessingJob } from '../services/unifiedMonitoringApi';
import { realtimeSync } from '../services/realtimeSync';
import type { RealtimeEvent } from '../services/realtimeSync';

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
  estimatedTime?: string;
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
  startDownload: (fileName: string, source: 'drive' | 'upload' | 'backend', trackingId?: string) => string;
  updateProgress: (trackingId: string, stage: string, progress: number) => void;
  completeItem: (trackingId: string) => void;
  failItem: (trackingId: string, error: string) => void;
}

const UnifiedTrackingContext = createContext<UnifiedTrackingContextType | undefined>(undefined);

export const UnifiedTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<UnifiedTrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Configurar sincronização em tempo real
  useEffect(() => {
    realtimeSync.connect();
    
    const unsubscribe = realtimeSync.subscribe((event: RealtimeEvent) => {
      switch (event.type) {
        case 'download_started':
          setItems(prev => {
            const exists = prev.find(item => item.trackingId === event.data.trackingId);
            if (exists) return prev;
            
            return [...prev, {
              trackingId: event.data.trackingId,
              fileName: event.data.fileName,
              source: event.data.source as any,
              currentStage: 'downloading',
              progress: 0,
              startedAt: new Date(),
              updatedAt: new Date()
            }];
          });
          break;
          
        case 'download_progress':
          setItems(prev => prev.map(item => 
            item.trackingId === event.data.trackingId
              ? { 
                  ...item, 
                  currentStage: event.data.stage as any,
                  progress: event.data.progress || 0,
                  updatedAt: new Date() 
                }
              : item
          ));
          break;
          
        case 'download_completed':
          setItems(prev => prev.map(item => 
            item.trackingId === event.data.trackingId
              ? { 
                  ...item, 
                  currentStage: 'completed',
                  progress: 100,
                  completedAt: new Date(),
                  updatedAt: new Date() 
                }
              : item
          ));
          break;
          
        case 'download_failed':
          setItems(prev => prev.map(item => 
            item.trackingId === event.data.trackingId
              ? { 
                  ...item, 
                  currentStage: 'failed',
                  errorMessage: event.data.error,
                  updatedAt: new Date() 
                }
              : item
          ));
          break;
      }
    });
    
    return unsubscribe;
  }, []);

  const convertJobStatusToStage = (status: string): UnifiedTrackingItem['currentStage'] => {
    switch (status?.toLowerCase()) {
      case 'downloading': return 'downloading';
      case 'extracting': return 'extracting';
      case 'validating': return 'validating';
      case 'queued': return 'queued';
      case 'processing': return 'processing';
      case 'finalizing': return 'processing';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      default: 
        return 'queued';
    }
  };

  const syncWithAPIs = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const data = await fetchUnifiedMonitoringData();
      const unifiedItems: UnifiedTrackingItem[] = [];

      // Converter jobs para items unificados - JOBS ATIVOS, COMPLETOS E FALHADOS
      const allJobs = [
        ...(data.activeJobs || []),
        ...(data.recentlyCompleted || []).slice(0, 10), // Últimos 10 completos
        ...(data.recentlyFailed || []).slice(0, 5)      // Últimos 5 falhados
      ];

      allJobs.forEach((job: FileProcessingJob) => {
        
        // Se currentStage estiver vazio, usar o status do job
        const stage = (job.currentStage && job.currentStage.trim()) ? job.currentStage : convertJobStatusToStage(job.status);
        
        const finalStage = job.status === 'completed' ? 'completed' : job.status === 'failed' ? 'failed' : stage;
        
        unifiedItems.push({
          trackingId: job.id,
          fileName: job.fileName,
          source: job.sourceType === 'google_drive' ? 'drive' : job.sourceType === 'upload' ? 'upload' : 'local',
          currentStage: finalStage as any,
          progress: job.overallProgress || 0,
          startedAt: new Date(job.createdAt),
          updatedAt: new Date(),
          ...(job.completedAt && { completedAt: new Date(job.completedAt) }),
          ...(job.errorMessage && { errorMessage: job.errorMessage })
        });
      });

      // Preservar itens manuais (downloads iniciados manualmente)
      setItems(prev => {
        const manualItems = prev.filter(item => 
          item.trackingId.startsWith('drive_') || item.trackingId.startsWith('upload_')
        );
        
        // Mesclar com dados da API, evitando duplicatas
        const apiTrackingIds = new Set(unifiedItems.map(item => item.trackingId));
        const filteredManualItems = manualItems.filter(item => !apiTrackingIds.has(item.trackingId));
        
        return [...filteredManualItems, ...unifiedItems];
      });
      
    } catch (error) {
      console.error('Erro ao sincronizar tracking unificado:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincronizar apenas quando necessário - deixar a página controlar o intervalo
  useEffect(() => {
    syncWithAPIs();
    
    // Configurar intervalo para sincronização automática
    const interval = setInterval(syncWithAPIs, 3000); // A cada 3 segundos
    
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
  const startDownload = useCallback((fileName: string, source: 'drive' | 'upload' | 'backend', customTrackingId?: string): string => {
    const trackingId = customTrackingId || `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Emitir evento em tempo real
    realtimeSync.emitDownloadStarted(trackingId, fileName, source);
    
    return trackingId;
  }, []);

  const updateProgress = useCallback((trackingId: string, stage: string, progress: number) => {
    // Emitir evento em tempo real
    realtimeSync.emitDownloadProgress(trackingId, stage, progress);
  }, []);

  const completeItem = useCallback((trackingId: string) => {
    // Emitir evento em tempo real
    realtimeSync.emitDownloadCompleted(trackingId);
  }, []);

  const failItem = useCallback((trackingId: string, error: string) => {
    // Emitir evento em tempo real
    realtimeSync.emitDownloadFailed(trackingId, error);
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