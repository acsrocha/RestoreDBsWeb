// src/pages/MonitoringPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import HighlightCard from '../components/common/HighlightCard'; // Ajuste o caminho se necessário
import RecentActivityList from '../components/monitoring/RecentActivityList';
import FailedRestoresList from '../components/monitoring/FailedRestoresList';
import { fetchStatusData, fetchErrorsData } from '../services/api'; // Presume que services/api.ts está correto
import type { StatusData, FailedRestoreItem } from '../types/api'; // Presume que types/api.ts está corrigido
import { useInterval } from '../hooks/useInterval'; // Presume que este hook existe
import { useLastUpdated } from '../contexts/LastUpdatedContext'; // Presume que este contexto existe
import { useNotification } from '../hooks/useNotification';
import { FiCpu, FiArchive, FiAlertTriangle, FiClock, FiList, FiFileText } from 'react-icons/fi';

import '../styles/components/HighlightCard.css';
import '../styles/components/RecentActivityList.css';
import '../styles/components/FailedRestoresList.css';
import '../styles/components/MonitoringCards.css';
import '../styles/components/StickyCards.css';

const REFRESH_INTERVAL = 3000;

const MonitoringPage: React.FC = () => {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [errorsData, setErrorsData] = useState<FailedRestoreItem[]>([]);
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
    
    let combinedErrorMessages: string[] = [];

    try {
      const results = await Promise.allSettled([
        fetchStatusData(),
        fetchErrorsData()
      ]);

      const statusResult = results[0];
      const errorsResult = results[1];

      if (statusResult.status === 'fulfilled') {
        setStatusData(statusResult.value);
        if (statusResult.value?.recentActivity?.length > 0) {
          const lastActivityLog = statusResult.value.recentActivity[0];
          setLastActivityTimestamp(extractTimestamp(lastActivityLog));
        } else {
          setLastActivityTimestamp('--:--:--');
        }
      } else {
        console.error('Falha ao buscar dados de status:', statusResult.reason);
        const reasonMessage = statusResult.reason instanceof Error ? statusResult.reason.message : String(statusResult.reason);
        combinedErrorMessages.push(`Status: ${reasonMessage}`);
        if (!isPollRequest && initialLoading) setStatusData(null);
        setLastActivityTimestamp('Erro');
      }

      if (errorsResult.status === 'fulfilled') {
        setErrorsData(errorsResult.value);
      } else {
        console.error('Falha ao buscar dados de erros:', errorsResult.reason);
        const reasonMessage = errorsResult.reason instanceof Error ? errorsResult.reason.message : String(errorsResult.reason);
        combinedErrorMessages.push(`Erros: ${reasonMessage}`);
        if (!isPollRequest && initialLoading) setErrorsData([]);
      }

      if (combinedErrorMessages.length > 0) {
        const errorMessage = combinedErrorMessages.join('; ');
        setErrorLoading(errorMessage);
        if (!isPollRequest) {
          showError(errorMessage);
        }
      } else {
        setErrorLoading(null);
        signalUpdate();
      }

    } catch (error) {
      console.error('Falha crítica geral ao buscar dados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao carregar dados.';
      setErrorLoading(errorMessage);
      if (!isPollRequest) {
        showError(errorMessage);
      }
      if (!isPollRequest && initialLoading) {
        setStatusData(null);
        setErrorsData([]);
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
  }, [signalUpdate, initialLoading, showError, extractTimestamp]);

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
    if (errorLoading && !statusData) return 'Erro Dados';
    if (statusData?.currentProcessing) return processFilename(statusData.currentProcessing);
    return 'Nenhum';
  }, [initialLoading, errorLoading, statusData, processFilename]);

  const queueCount = useMemo(() => 
    initialLoading && !statusData ? 0 : (statusData?.queueCount ?? 0),
    [initialLoading, statusData]
  );

  const errorCount = useMemo(() => 
    initialLoading && errorsData.length === 0 && !errorLoading ? 0 : (errorsData?.length ?? 0),
    [initialLoading, errorsData.length, errorLoading]
  );

  const processingTitle = useMemo(() => 
    initialLoading && !statusData 
      ? 'Carregando...' 
      : statusData?.currentProcessing
        ? statusData.currentProcessing 
        : 'Nenhum arquivo em processamento',
    [initialLoading, statusData]
  );

  return (
    <div className="detailed-monitoring-page">
      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card processing">
          <div className="stat-icon"><FiCpu /></div>
          <div className="stat-content">
            <div className="stat-number">{statusData?.currentProcessing ? '1' : '0'}</div>
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
            {initialLoading && !statusData ? (
              <li className="empty-list"><em>Carregando fila...</em></li>
            ) : statusData?.queuedFiles && statusData.queuedFiles.length > 0 ? (
              statusData.queuedFiles.map((file: string, index: number) => {
                const fileName = file.split(/[\\/]/).pop();
                return (
                  <li key={file || index} title={`Caminho completo: ${file}`}>
                    <FiFileText style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {fileName || 'Nome inválido'}
                  </li>
                );
              })
            ) : (
              !initialLoading && statusData && <li className="empty-list"><em>Fila vazia</em></li>
            )}
          </ul>
        </section>

        <section className="monitoring-section">
          <RecentActivityList
            activities={statusData?.recentActivity || []}
            isLoading={initialLoading && !statusData}
          />
        </section>

        <section className="monitoring-section error">
          <FailedRestoresList
            errors={errorsData}
            isLoading={initialLoading && errorsData.length === 0 && !errorLoading}
          />
        </section>
      </div>
    </div>
  );
};

export default MonitoringPage;