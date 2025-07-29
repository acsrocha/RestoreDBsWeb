import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchFileProcessingJobs } from '../services/fileMonitoringApi';
import { useInterval } from '../hooks/useInterval';
import { useNotification } from '../hooks/useNotification';
import ActiveJobCard from '../components/monitoring/ActiveJobCard';
import FileProcessingList from '../components/monitoring/FileProcessingList';
import JobDetails from '../components/monitoring/JobDetails';

import MonitoringPageHeader from '../components/monitoring/MonitoringPageHeader';
import StatisticsDashboard from '../components/monitoring/StatisticsDashboard';
import JobViewFilters from '../components/monitoring/JobViewFilters';
import { FiActivity, FiCheckCircle, FiAlertTriangle, FiDatabase } from 'react-icons/fi';
import '../styles/components/DetailedMonitoring.css';
import '../styles/theme.css';

// Intervalo de atualização em milissegundos
const REFRESH_INTERVAL = 2000;
const REFRESH_OPTIONS = [1000, 2000, 5000, 10000];

const DetailedMonitoringPage: React.FC = () => {
  const [processingJobs, setProcessingJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [failedJobs, setFailedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(REFRESH_INTERVAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({ total: 0, processing: 0, completed: 0, failed: 0 });
  const [selectedJobId, setSelectedJobId] = useState(null);
  const { showError } = useNotification();

  // Função para buscar os dados de monitoramento
  const fetchMonitoringData = useCallback(async () => {
    if (isPaused) return;
    
    try {
      const data = await fetchFileProcessingJobs();
      
      // Separar os jobs por status
      const active = data.filter(job => job.status === 'processing');
      const completed = data.filter(job => job.status === 'success');
      const failed = data.filter(job => job.status === 'failed');
      
      setProcessingJobs(active);
      setCompletedJobs(completed);
      setFailedJobs(failed);
      setLastUpdated(new Date());
      
      // Atualizar estatísticas
      setStats({
        total: data.length,
        processing: active.length,
        completed: completed.length,
        failed: failed.length
      });
      
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados de monitoramento:', err);
      setError(err.message || 'Erro ao buscar dados de monitoramento');
    } finally {
      setIsLoading(false);
    }
  }, [isPaused]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Configurar intervalo de atualização
  useInterval(() => {
    if (!isPaused) {
      fetchMonitoringData();
    }
  }, refreshInterval);

  // Funções de controle
  const togglePause = () => setIsPaused(!isPaused);
  const handleRefreshIntervalChange = (interval) => setRefreshInterval(interval);
  const handleManualRefresh = () => {
    setIsLoading(true);
    fetchMonitoringData();
  };



  const handleJobSelect = (jobId) => {
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
    } else {
      setSelectedJobId(jobId);
    }
  };

  // Job selecionado para mostrar detalhes
  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    const allJobs = [...processingJobs, ...completedJobs, ...failedJobs];
    const job = allJobs.find(job => job.fileId === selectedJobId);
    
    if (!job) return null;
    
    // Mapear para o formato esperado pelo JobDetails
    return {
      fileId: job.fileId,
      fileName: job.fileName,
      status: job.status === 'success' ? 'success' : job.status === 'failed' ? 'failed' : 'processing',
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      downloadStage: {
        status: job.downloadStageStatus === 'complete' ? 'success' : 
               job.downloadStageStatus === 'failed' ? 'failed' : 
               job.downloadStageStatus === 'processing' ? 'processing' : 'pending',
        details: job.downloadStageDetails
      },
      validationStage: {
        status: job.validationStageStatus === 'complete' ? 'success' : 
               job.validationStageStatus === 'failed' ? 'failed' : 
               job.validationStageStatus === 'processing' ? 'processing' : 'pending',
        details: job.validationStageDetails
      },
      restoreStage: {
        status: job.restoreStageStatus === 'complete' ? 'success' : 
               job.restoreStageStatus === 'failed' ? 'failed' : 
               job.restoreStageStatus === 'processing' ? 'processing' : 'pending',
        details: job.restoreStageDetails
      },
      finalizationStage: {
        status: job.finalizationStageStatus === 'complete' ? 'success' : 
               job.finalizationStageStatus === 'failed' ? 'failed' : 
               job.finalizationStageStatus === 'processing' ? 'processing' : 'pending',
        details: job.finalizationStageDetails
      }
    };
  }, [selectedJobId, processingJobs, completedJobs, failedJobs]);

  // Filtros e busca
  const filteredJobs = useMemo(() => {
    const allJobs = [...processingJobs, ...completedJobs, ...failedJobs];
    
    let filtered = allJobs;
    
    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.fileId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por view
    if (selectedView !== 'all') {
      filtered = filtered.filter(job => {
        switch (selectedView) {
          case 'processing': return job.status === 'processing';
          case 'completed': return job.status === 'success';
          case 'failed': return job.status === 'failed';
          default: return true;
        }
      });
    }
    
    return filtered;
  }, [processingJobs, completedJobs, failedJobs, searchTerm, selectedView]);

  // Estatísticas em tempo real
  const realtimeStats = useMemo(() => {
    const avgProgress = processingJobs.length > 0 
      ? processingJobs.reduce((sum, job) => sum + (job.overallProgress || 0), 0) / processingJobs.length
      : 0;
    
    const estimatedTime = processingJobs.length > 0
      ? processingJobs.reduce((sum, job) => {
          const elapsed = job.startedAt ? Date.now() - new Date(job.startedAt).getTime() : 0;
          const progress = job.overallProgress || 1;
          return sum + (elapsed / progress * (100 - progress));
        }, 0) / processingJobs.length
      : 0;
    
    return { avgProgress, estimatedTime };
  }, [processingJobs]);

  return (
    <div className="detailed-monitoring-page">
      <MonitoringPageHeader
        isPaused={isPaused}
        lastUpdated={lastUpdated}
        searchTerm={searchTerm}
        refreshInterval={refreshInterval}
        isLoading={isLoading}
        onTogglePause={togglePause}
        onSearchChange={setSearchTerm}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        onManualRefresh={handleManualRefresh}
        refreshOptions={REFRESH_OPTIONS}
      />

      <StatisticsDashboard
        stats={stats}
        realtimeStats={realtimeStats}
      />

      <JobViewFilters
        selectedView={selectedView}
        stats={stats}
        onViewChange={setSelectedView}
      />

      {/* Conteúdo principal */}
      {isLoading && filteredJobs.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dados de monitoramento...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <FiAlertTriangle className="error-icon" />
          <p>{error}</p>
          <button onClick={handleManualRefresh} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <FiDatabase className="empty-icon" />
          <p>Nenhum arquivo encontrado com os filtros aplicados.</p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="jobs-container">
          {/* Jobs em processamento */}
          {(selectedView === 'all' || selectedView === 'processing') && processingJobs.length > 0 && (
            <section className="monitoring-section">
              <h2>
                <FiActivity className="section-icon" />
                Arquivos em Processamento
                <span className="count-badge">{processingJobs.length}</span>
              </h2>
              <div className="active-jobs-grid">
                {processingJobs
                  .filter(job => !searchTerm || 
                    job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    job.fileId.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(job => (
                    <ActiveJobCard
                      key={job.fileId}
                      fileId={job.fileId}
                      fileName={job.fileName}
                      startedAt={job.startedAt}
                      currentStage={job.currentStage}
                      overallProgress={job.overallProgress}
                      downloadStage={{
                        status: job.downloadStageStatus,
                        details: job.downloadStageDetails
                      }}
                      validationStage={{
                        status: job.validationStageStatus,
                        details: job.validationStageDetails
                      }}
                      restoreStage={{
                        status: job.restoreStageStatus,
                        details: job.restoreStageDetails
                      }}
                      finalizationStage={{
                        status: job.finalizationStageStatus,
                        details: job.finalizationStageDetails
                      }}
                    />
                  ))
                }
              </div>
            </section>
          )}
          
          {/* Jobs concluídos */}
          {(selectedView === 'all' || selectedView === 'completed') && completedJobs.length > 0 && (
            <section className="monitoring-section">
              <h2>
                <FiCheckCircle className="section-icon success" />
                Arquivos Processados com Sucesso
                <span className="count-badge success">{completedJobs.length}</span>
              </h2>
              <FileProcessingList 
                jobs={completedJobs.filter(job => !searchTerm || 
                  job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  job.fileId.toLowerCase().includes(searchTerm.toLowerCase())
                )} 
                isLoading={false} 
                emptyMessage="Nenhum arquivo processado com sucesso." 
                type="success"
                onJobSelect={handleJobSelect}
                selectedJobId={selectedJobId}
                selectedJob={selectedJob}
              />
            </section>
          )}
          
          {/* Jobs com falha */}
          {(selectedView === 'all' || selectedView === 'failed') && failedJobs.length > 0 && (
            <section className="monitoring-section">
              <h2>
                <FiAlertTriangle className="section-icon error" />
                Arquivos com Falha no Processamento
                <span className="count-badge error">{failedJobs.length}</span>
              </h2>
              <FileProcessingList 
                jobs={failedJobs.filter(job => !searchTerm || 
                  job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  job.fileId.toLowerCase().includes(searchTerm.toLowerCase())
                )} 
                isLoading={false} 
                emptyMessage="Nenhum arquivo com falha no processamento." 
                type="error"
                onJobSelect={handleJobSelect}
                selectedJobId={selectedJobId}
                selectedJob={selectedJob}
              />
            </section>
          )}
        </div>
      )}
      

    </div>
  );
};

export default DetailedMonitoringPage;