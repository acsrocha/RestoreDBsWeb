// src/pages/MonitoringPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import HighlightCard from '../components/common/HighlightCard'; // Ajuste o caminho se necessário
import RecentActivityList from '../components/monitoring/RecentActivityList';
import FailedRestoresList from '../components/monitoring/FailedRestoresList';
import { fetchUnifiedMonitoringData, fetchRecentActivity } from '../services/unifiedMonitoringApi';
import type { UnifiedMonitoringData, ActivityLogEntry } from '../services/unifiedMonitoringApi';
import { useInterval } from '../hooks/useInterval'; // Presume que este hook existe
import { useLastUpdated } from '../contexts/LastUpdatedContext'; // Presume que este contexto existe
import { useNotification } from '../hooks/useNotification';

import { FiCpu, FiArchive, FiAlertTriangle, FiClock, FiList, FiFileText } from 'react-icons/fi';

import '../styles/components/RecentActivityList.css';
import '../styles/components/FailedRestoresList.css';
import '../styles/components/StickyCards.css';

const REFRESH_INTERVAL = 3000;

const MonitoringPage: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<UnifiedMonitoringData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<string>('--:--:--');
  
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const { signalUpdate } = useLastUpdated();
  const { showError } = useNotification();
  const isMountedRef = useRef(false);
  


  // Memoize a função de extração de timestamp
  const extractTimestamp = useCallback((activityLog: any): string => {
    if (typeof activityLog === 'string') {
      const timeMatch = activityLog.match(/^(\d{2}:\d{2}:\d{2})/);
      return timeMatch && timeMatch[1] ? timeMatch[1] : '--:--:--';
    } else if (activityLog && typeof activityLog === 'object' && 'timestamp' in activityLog) {
      return activityLog.timestamp || '--:--:--';
    }
    return '--:--:--';
  }, []);

  // Memoize a função de processamento de nome de arquivo
  const processFilename = useCallback((path: string): string => {
    return path.split(/[\\/]/).pop() || 'Nome inválido';
  }, []);

  const fetchData = useCallback(async (isPollRequest = false) => {
    if (!isPollRequest && !isMountedRef.current) {
      setInitialLoading(true);
    } else if (isPollRequest) {
      setIsPolling(true);
    }

    try {
      const data = await fetchUnifiedMonitoringData();
      setMonitoringData(data);
      // Usa logs do endpoint principal se existirem
      if (data.recentActivity) {
        setRecentActivity(data.recentActivity);
      }
      setLastActivityTimestamp(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setErrorLoading(null);
      signalUpdate();
    } catch (error) {
      console.error('Falha ao buscar dados unificados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao carregar dados.';
      setErrorLoading(errorMessage);
      if (!isPollRequest) {
        showError(errorMessage);
      }
      if (!isPollRequest && initialLoading) {
        setMonitoringData(null);
        setLastActivityTimestamp('Erro');
      }
    } finally {
      if (initialLoading) { 
        setInitialLoading(false);
      }
      if (isPollRequest) {
        setIsPolling(false);
      }
    }
  }, [signalUpdate, initialLoading, showError]);

  useEffect(() => {
    if (!isMountedRef.current) {
      fetchData(); 
      isMountedRef.current = true;
    }
  }, [fetchData]);

  useInterval(() => {
    if (!initialLoading && !isPolling) {
      fetchData(true);
    }
  }, REFRESH_INTERVAL);

  // Memoize os valores calculados
  const displayProcessingFilename = useMemo(() => {
    if (initialLoading) return 'Carregando...';
    if (errorLoading && !monitoringData) return 'Erro Dados';
    if (monitoringData?.currentProcessing) return processFilename(monitoringData.currentProcessing);
    return 'Nenhum';
  }, [initialLoading, errorLoading, monitoringData, processFilename]);

  const queueCount = useMemo(() => 
    initialLoading && !monitoringData ? 0 : (monitoringData?.stats.queued ?? 0),
    [initialLoading, monitoringData]
  );

  const errorCount = useMemo(() => 
    initialLoading && !monitoringData ? 0 : (monitoringData?.stats.failed ?? 0),
    [initialLoading, monitoringData]
  );

  const processingTitle = useMemo(() => 
    initialLoading && !monitoringData 
      ? 'Carregando...' 
      : monitoringData?.currentProcessing
        ? monitoringData.currentProcessing 
        : 'Nenhum arquivo em processamento',
    [initialLoading, monitoringData]
  );

  return (
    <div className="detailed-monitoring-page">
      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card processing">
          <div className="stat-icon"><FiCpu /></div>
          <div className="stat-content">
            <div className="stat-number">{monitoringData?.stats.processing || 0}</div>
            <div className="stat-label">Em Processamento</div>
            <div className="stat-detail">{displayProcessingFilename}</div>
          </div>
        </div>
        <div className="stat-card total">
          <div className="stat-icon"><FiArchive /></div>
          <div className="stat-content">
            <div className="stat-number">{queueCount}</div>
            <div className="stat-label">Arquivos na Fila</div>
          </div>
        </div>
        <div className="stat-card failed">
          <div className="stat-icon"><FiAlertTriangle /></div>
          <div className="stat-content">
            <div className="stat-number error">{errorCount}</div>
            <div className="stat-label">Falhas</div>
          </div>
        </div>
        <div className="stat-card eta">
          <div className="stat-icon"><FiClock /></div>
          <div className="stat-content">
            <div className="stat-number">{lastActivityTimestamp}</div>
            <div className="stat-label">Última Atividade</div>
          </div>
        </div>
      </div>

      {/* Jobs Container */}
      <div className="jobs-container">
        <section className="monitoring-section">
          <h2>
            <FiList className="section-icon" />
            Fila de Espera
            <span className="count-badge">{queueCount}</span>
          </h2>
          <ul className="queue-list">
            {initialLoading && !monitoringData ? (
              <li className="empty-list"><em>Carregando fila...</em></li>
            ) : monitoringData?.queuedFiles && monitoringData.queuedFiles.length > 0 ? (
              monitoringData.queuedFiles.map((file: string, index: number) => {
                const fileName = file.split(/[\\/]/).pop();
                return (
                  <li key={file || index} title={`Caminho completo: ${file}`}>
                    <FiFileText style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {fileName || 'Nome inválido'}
                  </li>
                );
              })
            ) : (
              !initialLoading && monitoringData && <li className="empty-list"><em>Fila vazia</em></li>
            )}
          </ul>
        </section>

        <section className="monitoring-section">
          <RecentActivityList
            activities={recentActivity}
            isLoading={initialLoading && recentActivity.length === 0}
          />
        </section>

        <section className="monitoring-section error">
          <FailedRestoresList
            errors={monitoringData?.recentlyFailed || []}
            isLoading={initialLoading && !monitoringData}
          />
        </section>
      </div>
    </div>
  );
};

export default MonitoringPage;