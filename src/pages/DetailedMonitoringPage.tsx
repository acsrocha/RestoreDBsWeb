// src/pages/DetailedMonitoringPage.tsx
import React from 'react';
import { FiRefreshCw, FiClock } from 'react-icons/fi';
import FileProcessingList from '../components/monitoring/FileProcessingList';
import ErrorMessage from '../components/common/ErrorMessage';
import { useFileMonitoring } from '../contexts/FileMonitoringContext';

import '../styles/components/DetailedMonitoring.css';

const DetailedMonitoringPage: React.FC = () => {
  const { monitoringData, isLoading, error, lastUpdated, refreshData } = useFileMonitoring();

  // Formatar a hora da última atualização (memoizado para evitar re-renders)
  const formattedLastUpdate = React.useMemo(() => {
    return lastUpdated
      ? lastUpdated.toLocaleTimeString('pt-BR')
      : '--:--:--';
  }, [lastUpdated]);

  const handleManualRefresh = () => {
    // A guarda 'if (!isLoading)' já existe dentro do refreshData no contexto
    refreshData();
  };

  return (
    <div id="view-monitoramento-detalhado" className="view active detailed-monitoring-view">
      <div className="detailed-monitoring-header">
        <h1>Monitoramento Detalhado de Arquivos</h1>
        <div className="header-actions">
          <div className="last-update">
            <FiClock className="icon" />
            <span>Última atualização: {formattedLastUpdate}</span>
          </div>
          <button 
            className="refresh-button" 
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? 'icon spinning' : 'icon'} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <div className="detailed-monitoring-content">
        {error && !monitoringData ? (
          <ErrorMessage 
            message={error} 
            onRetry={handleManualRefresh} 
          />
        ) : (
          <>
            <section className="monitoring-section">
              <FileProcessingList
                files={monitoringData?.activeFiles || []}
                title="Arquivos em Processamento"
                emptyMessage="Nenhum arquivo em processamento no momento"
                isLoading={isLoading && !monitoringData}
              />
            </section>

            <section className="monitoring-section">
              <FileProcessingList
                files={monitoringData?.recentlyCompleted || []}
                title="Arquivos Concluídos Recentemente"
                emptyMessage="Nenhum arquivo concluído recentemente"
                isLoading={isLoading && !monitoringData}
              />
            </section>

            <section className="monitoring-section">
              <FileProcessingList
                files={monitoringData?.recentlyFailed || []}
                title="Arquivos com Falha"
                emptyMessage="Nenhum arquivo com falha recentemente"
                isLoading={isLoading && !monitoringData}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default DetailedMonitoringPage;