// src/pages/MonitoringPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import HighlightCard from '../components/common/HighlightCard';
import RecentActivityList from '../components/monitoring/RecentActivityList';
import FailedRestoresList from '../components/monitoring/FailedRestoresList';
import { fetchStatusData, fetchErrorsData } from '../services/api';
import type { StatusData, FailedRestoreItem } from '../types/api';
import { useInterval } from '../hooks/useInterval';
import { useLastUpdated } from '../contexts/LastUpdatedContext';
import { FiCpu, FiArchive, FiAlertTriangle, FiClock, FiList } from 'react-icons/fi';

const REFRESH_INTERVAL = 3000;

const MonitoringPage: React.FC = () => {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [errorsData, setErrorsData] = useState<FailedRestoreItem[]>([]);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<string>('--:--:--');
  
  const [initialLoading, setInitialLoading] = useState<boolean>(true); // Para carga inicial
  const [isPolling, setIsPolling] = useState<boolean>(false); // Para polling em background
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const { signalUpdate } = useLastUpdated();

  const fetchData = useCallback(async (isPollRequest = false) => {
    // Se for um refresh manual (não implementado com botão aqui, mas a lógica está pronta)
    // o chamador setaria initialLoading para true.
    // Para polling, usamos isPolling.
    if (isPollRequest) {
      setIsPolling(true);
    }
    // Não resetar errorLoading no início do polling para não piscar a UI se houver erro persistente.

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
        if (statusResult.value?.RecentActivity?.length > 0) {
          const lastActivityLog = statusResult.value.RecentActivity[0];
          const timeMatch = lastActivityLog.match(/^(\d{2}:\d{2}:\d{2})/);
          setLastActivityTimestamp(timeMatch && timeMatch[1] ? timeMatch[1] : '--:--:--');
        } else {
          setLastActivityTimestamp('--:--:--');
        }
      } else {
        console.error('Falha ao buscar dados de status:', statusResult.reason);
        const reasonMessage = statusResult.reason instanceof Error ? statusResult.reason.message : String(statusResult.reason);
        combinedErrorMessages.push(`Status: ${reasonMessage}`);
        if (!isPollRequest && initialLoading) setStatusData(null); // Limpa na carga inicial com erro
        setLastActivityTimestamp('Erro');
      }

      if (errorsResult.status === 'fulfilled') {
        setErrorsData(errorsResult.value);
      } else {
        console.error('Falha ao buscar dados de erros:', errorsResult.reason);
        const reasonMessage = errorsResult.reason instanceof Error ? errorsResult.reason.message : String(errorsResult.reason);
        combinedErrorMessages.push(`Erros: ${reasonMessage}`);
        if (!isPollRequest && initialLoading) setErrorsData([]); // Limpa na carga inicial com erro
      }

      if (combinedErrorMessages.length > 0) {
        setErrorLoading(combinedErrorMessages.join('; '));
      } else {
        setErrorLoading(null);
        signalUpdate();
      }

    } catch (error) {
      console.error('Falha crítica geral ao buscar dados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao carregar dados.';
      setErrorLoading(errorMessage);
      if (!isPollRequest && initialLoading) { // Erro crítico na carga inicial
          setStatusData(null);
          setErrorsData([]);
          setLastActivityTimestamp('Erro');
      }
    } finally {
      if (initialLoading) { // Só seta initialLoading para false após a primeira tentativa de fetch
        setInitialLoading(false);
      }
      if (isPollRequest) {
        setIsPolling(false);
      }
    }
  }, [signalUpdate, initialLoading]); // initialLoading aqui para que o finally seja executado com o valor correto na primeira vez

  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      // initialLoading já é true
      fetchData();
      isMountedRef.current = true;
    }
  }, [fetchData]); // fetchData depende de initialLoading e signalUpdate, mas isMountedRef previne loop

  useInterval(() => {
    if (!initialLoading && !isPolling) {
        fetchData(true);
    }
  }, REFRESH_INTERVAL);

  // Lógica de exibição para "Em Processamento"
  let displayProcessingFilename: string;
  if (initialLoading && !statusData) {
    displayProcessingFilename = 'Carregando...';
  } else if (errorLoading && !statusData) { // Se houve erro e NENHUM dado de status foi carregado antes
    displayProcessingFilename = 'Erro';
  } else if (statusData?.CurrentProcessing) {
    displayProcessingFilename = statusData.CurrentProcessing.split(/[\\/]/).pop() || 'Nome inválido';
  } else { // Dados carregados (statusData não é null), sem erro que impediu statusData, mas CurrentProcessing é vazio
    displayProcessingFilename = 'Nenhum';
  }

  const queueCount = statusData?.QueueCount ?? 0;
  const errorCount = errorsData?.length ?? 0;

  return (
    <div id="view-monitoramento" className="view active">
      <section className="status-highlight-grid" aria-label="Status de Destaque">
        <HighlightCard
          icon={<FiCpu />}
          label="Em Processamento"
          value={displayProcessingFilename}
          type="processing"
          title={statusData?.CurrentProcessing || 'Nenhum arquivo em processamento'}
        />
        <HighlightCard icon={<FiArchive />} label="Arquivos na Fila" value={String(queueCount)} type="queue" />
        <HighlightCard icon={<FiAlertTriangle />} label="Falhas" value={String(errorCount)} type="errors" />
        <HighlightCard icon={<FiClock />} label="Última Atividade" value={lastActivityTimestamp} type="activity-summary" />
      </section>

      {errorLoading && (
          <div className="error-message">
              {errorLoading}
          </div>
      )}

      <section className="monitor-detailed-lists-grid" aria-label="Listas Detalhadas de Monitoramento">
        <div className="list-card" id="queuedFilesListSection">
          <h2><span className="icon"><FiList /></span>Fila de Espera</h2>
          <ul id="queuedFiles" aria-live="polite">
            {initialLoading && !statusData ? ( // <<< CORRIGIDO: Usa initialLoading
              <li className="empty-list"><em>Carregando fila...</em></li>
            ) : statusData?.QueuedFiles && statusData.QueuedFiles.length > 0 ? (
              statusData.QueuedFiles.map((file, index) => {
                const fileName = file.split(/[\\/]/).pop();
                return <li key={file || index} title={`Caminho completo: ${file}`}>{fileName || 'Nome inválido'}</li>;
              })
            ) : (
              // Mostra "Fila vazia" se não estiver no carregamento inicial e houver statusData (mesmo que QueuedFiles seja vazio)
              !initialLoading && statusData && <li className="empty-list"><em>Fila vazia</em></li> // <<< CORRIGIDO: Usa initialLoading
            )}
          </ul>
        </div>

        <RecentActivityList
            activities={statusData?.RecentActivity || []}
            isLoading={initialLoading && !statusData} // <<< CORRIGIDO: Usa initialLoading
        />
      </section>

      <FailedRestoresList
          errors={errorsData}
          isLoading={initialLoading && errorsData.length === 0} // <<< CORRIGIDO: Usa initialLoading
       />
    </div>
  );
};

export default MonitoringPage;