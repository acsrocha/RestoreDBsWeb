import { useEffect, useCallback, useRef } from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { monitoringService } from '../services/monitoringService';
import { useUnifiedTracking } from '../contexts/UnifiedTrackingContext';

interface UseMonitoringOptions {
  enabled?: boolean;
  interval?: number;
  onError?: (error: Error) => void;
}

export const useMonitoring = (options: UseMonitoringOptions = {}) => {
  const {
    enabled = true,
    interval = 2000,
    onError
  } = options;

  const {
    jobs,
    stats,
    lastUpdated,
    isLoading,
    error,
    isPaused,
    refreshInterval,
    setJobs,
    setStats,
    setLoading,
    setError,
    updateLastUpdated,
    getProcessingJobs,
    getCompletedJobs,
    getFailedJobs,
    getFilteredJobs
  } = useMonitoringStore();

  const { startDownload, updateProgress } = useUnifiedTracking();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled || isPaused || (isPollingRef.current && !force)) {
      return;
    }

    isPollingRef.current = true;
    
    if (force) {
      setLoading(true);
    }

    try {
      const data = await monitoringService.fetchUnifiedData();
      
      // Mapear dados para o formato do store
      const allJobs = [
        ...data.activeJobs,
        ...data.recentlyCompleted,
        ...data.recentlyFailed
      ];

      setJobs(allJobs);
      setStats(data.stats);
      setError(null);
      updateLastUpdated();

      // Sincronizar com Pipeline em tempo real
      allJobs.forEach(job => {
        if (job.status === 'processing' || job.status === 'queued') {
          const trackingId = `job-${job.id || job.fileId}`;
          const stage = job.currentStage === 'download' ? 'downloading' : 
                      job.currentStage === 'validation' ? 'validating' : 
                      job.currentStage === 'restore' ? 'processing' : 'queued';
          
          startDownload(job.fileName, 'backend', trackingId);
          updateProgress(trackingId, stage as any, job.overallProgress || 0);
        }
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
      isPollingRef.current = false;
    }
  }, [enabled, isPaused, setJobs, setStats, setLoading, setError, updateLastUpdated, onError]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refreshInterval);
  }, [fetchData, refreshInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Inicialização
  useEffect(() => {
    if (enabled) {
      fetchData(true);
    }
  }, [enabled, fetchData]);

  // Gerenciar polling
  useEffect(() => {
    if (enabled && !isPaused && interval > 0) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, isPaused, interval, startPolling, stopPolling]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
      monitoringService.destroy();
    };
  }, [stopPolling]);

  return {
    // Dados
    jobs,
    stats,
    lastUpdated,
    
    // Estado
    isLoading,
    error,
    isPaused,
    
    // Seletores
    processingJobs: getProcessingJobs(),
    completedJobs: getCompletedJobs(),
    failedJobs: getFailedJobs(),
    filteredJobs: getFilteredJobs(),
    
    // Ações
    refresh,
    
    // Utilitários
    isPolling: isPollingRef.current
  };
};