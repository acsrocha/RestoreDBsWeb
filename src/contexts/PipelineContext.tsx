import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PipelineItem, PipelineStats, PipelineStage } from '../types/pipeline';
import { useNotification } from '../hooks/useNotification';
import { fetchFileMonitoringData } from '../services/fileMonitoringApi';
import type { FileMonitoringData, FileProcessingDetail } from '../types/fileMonitoring';

interface PipelineContextType {
  items: PipelineItem[];
  stats: PipelineStats;
  isLoading: boolean;
  
  // Ações
  addItem: (fileName: string, source: 'upload' | 'drive' | 'upload_50gb') => string;
  updateItemStage: (trackingId: string, stage: PipelineStage, progress?: number, message?: string) => void;
  updateItemProgress: (trackingId: string, progress: number) => void;
  setItemError: (trackingId: string, error: string) => void;
  removeItem: (trackingId: string) => void;
  
  // Getters
  getItem: (trackingId: string) => PipelineItem | undefined;
  getItemsByStage: (stage: PipelineStage) => PipelineItem[];
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useNotification();

  // Calcular estatísticas
  const stats: PipelineStats = React.useMemo(() => {
    const counts = items.reduce((acc, item) => {
      acc[item.currentStage.toLowerCase() as keyof PipelineStats]++;
      acc.total++;
      return acc;
    }, {
      total: 0,
      downloading: 0,
      extracting: 0,
      validating: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0
    } as PipelineStats);
    
    return counts;
  }, [items]);

  // Adicionar novo item ao pipeline
  const addItem = useCallback((fileName: string, source: 'upload' | 'drive' | 'upload_50gb'): string => {
    const trackingId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newItem: PipelineItem = {
      trackingId,
      fileName,
      source,
      currentStage: source === 'drive' ? 'DOWNLOADING' : 'VALIDATING',
      progress: 0,
      startedAt: now,
      updatedAt: now,
      stages: {}
    };

    setItems(prev => [...prev, newItem]);
    return trackingId;
  }, []);

  // Atualizar estágio do item
  const updateItemStage = useCallback((trackingId: string, stage: PipelineStage, progress = 0, message?: string) => {
    setItems(prev => prev.map(item => {
      if (item.trackingId !== trackingId) return item;
      
      const now = new Date();
      const updatedItem = {
        ...item,
        currentStage: stage,
        progress,
        updatedAt: now,
        ...(stage === 'COMPLETED' && { completedAt: now })
      };

      // Atualizar detalhes do estágio
      const stageKey = stage.toLowerCase() as keyof typeof item.stages;
      updatedItem.stages = {
        ...item.stages,
        [stageKey]: {
          status: stage === 'FAILED' ? 'failed' : stage === 'COMPLETED' ? 'completed' : 'in_progress',
          startedAt: item.stages[stageKey]?.startedAt || now,
          ...(stage === 'COMPLETED' && { completedAt: now }),
          progress,
          message
        }
      };

      return updatedItem;
    }));
  }, []);

  // Atualizar progresso do item
  const updateItemProgress = useCallback((trackingId: string, progress: number) => {
    setItems(prev => prev.map(item => 
      item.trackingId === trackingId 
        ? { ...item, progress, updatedAt: new Date() }
        : item
    ));
  }, []);

  // Definir erro no item
  const setItemError = useCallback((trackingId: string, error: string) => {
    setItems(prev => prev.map(item => 
      item.trackingId === trackingId 
        ? { 
            ...item, 
            currentStage: 'FAILED', 
            errorMessage: error, 
            updatedAt: new Date() 
          }
        : item
    ));
  }, []);

  // Remover item
  const removeItem = useCallback((trackingId: string) => {
    setItems(prev => prev.filter(item => item.trackingId !== trackingId));
  }, []);

  // Getters
  const getItem = useCallback((trackingId: string) => {
    return items.find(item => item.trackingId === trackingId);
  }, [items]);

  const getItemsByStage = useCallback((stage: PipelineStage) => {
    return items.filter(item => item.currentStage === stage);
  }, [items]);

  // Sincronizar com dados reais da API de file monitoring
  useEffect(() => {
    const syncWithAPI = async () => {
      try {
        const monitoringData: FileMonitoringData = await fetchFileMonitoringData();
        
        // Converter dados da API para o formato do pipeline
        const convertToStage = (status: string, stages: any[]): PipelineStage => {
          if (status === 'queued') return 'QUEUED';
          if (status === 'processing') {
            // Determinar estágio baseado nos stages
            const currentStage = stages.find(s => s.status === 'in_progress');
            if (currentStage) {
              switch (currentStage.name) {
                case 'download': return 'DOWNLOADING';
                case 'extract': return 'EXTRACTING';
                case 'validate': return 'VALIDATING';
                case 'restore': return 'PROCESSING';
                default: return 'PROCESSING';
              }
            }
            return 'PROCESSING';
          }
          if (status === 'completed') return 'COMPLETED';
          if (status === 'failed') return 'FAILED';
          return 'QUEUED';
        };
        
        // Combinar todos os arquivos ativos
        const allFiles = [...monitoringData.activeFiles];
        
        setItems(allFiles.map((file: FileProcessingDetail) => {
          const stage = convertToStage(file.status, file.stages || []);
          
          return {
            trackingId: file.fileId,
            fileName: file.fileName,
            source: file.sourceType === 'google_drive' ? 'drive' : 'upload',
            currentStage: stage,
            progress: file.overallProgress || 0,
            startedAt: new Date(file.startedAt || file.createdAt),
            updatedAt: new Date(),
            ...(file.completedAt && { completedAt: new Date(file.completedAt) }),
            ...(file.error && { errorMessage: file.error }),
            stages: {
              ...(stage === 'DOWNLOADING' && {
                downloading: {
                  status: 'in_progress',
                  startedAt: new Date(file.startedAt || file.createdAt),
                  progress: file.overallProgress || 0
                }
              }),
              ...(stage === 'EXTRACTING' && {
                extracting: {
                  status: 'in_progress',
                  startedAt: new Date(file.startedAt || file.createdAt),
                  progress: file.overallProgress || 0
                }
              }),
              ...(stage === 'VALIDATING' && {
                validating: {
                  status: 'in_progress',
                  startedAt: new Date(file.startedAt || file.createdAt),
                  progress: file.overallProgress || 0
                }
              }),
              ...(stage === 'QUEUED' && {
                queued: {
                  status: 'pending',
                  startedAt: new Date(file.createdAt),
                  progress: 0
                }
              }),
              ...(stage === 'PROCESSING' && {
                processing: {
                  status: 'in_progress',
                  startedAt: new Date(file.startedAt || file.createdAt),
                  progress: file.overallProgress || 0
                }
              })
            }
          } as PipelineItem;
        }));
        
      } catch (error) {
        console.error('Erro ao sincronizar pipeline com API:', error);
      }
    };

    // Sincronizar imediatamente
    syncWithAPI();
    
    // Sincronizar a cada 2 segundos (mesmo intervalo do monitoramento detalhado)
    const syncInterval = setInterval(syncWithAPI, 2000);
    
    return () => clearInterval(syncInterval);
  }, []);

  // Auto-limpeza de itens completados/falhados após 5 minutos
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      setItems(prev => prev.filter(item => {
        if ((item.currentStage === 'COMPLETED' || item.currentStage === 'FAILED') && 
            item.updatedAt < fiveMinutesAgo) {
          return false;
        }
        return true;
      }));
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(cleanup);
  }, []);

  const value: PipelineContextType = {
    items,
    stats,
    isLoading,
    addItem,
    updateItemStage,
    updateItemProgress,
    setItemError,
    removeItem,
    getItem,
    getItemsByStage
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
};