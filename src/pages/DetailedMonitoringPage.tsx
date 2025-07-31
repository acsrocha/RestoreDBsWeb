import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchUnifiedMonitoringData } from '../services/unifiedMonitoringApi';
import type { UnifiedMonitoringData } from '../services/unifiedMonitoringApi';
import { useInterval } from '../hooks/useInterval';
import { useNotification } from '../hooks/useNotification';

import ActiveJobCard from '../components/monitoring/ActiveJobCard';
import FileProcessingList from '../components/monitoring/FileProcessingList';
import JobDetails from '../components/monitoring/JobDetails';
import UnifiedPipelineDashboard from '../components/pipeline/UnifiedPipelineDashboard';

import MonitoringPageHeader from '../components/monitoring/MonitoringPageHeader';
import StatisticsDashboard from '../components/monitoring/StatisticsDashboard';
import JobViewFilters from '../components/monitoring/JobViewFilters';
import { FiActivity, FiCheckCircle, FiAlertTriangle, FiDatabase } from 'react-icons/fi';
import '../styles/components/DetailedMonitoring.css';
import '../styles/animations/job-card-transition.css';
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
  const [exitingJobs, setExitingJobs] = useState<string[]>([]); // IDs dos jobs em fase de saída
  const [processedJobs, setProcessedJobs] = useState<string[]>([]); // IDs dos jobs já processados
  const { showError } = useNotification();
  


  // Função para buscar os dados de monitoramento
  const fetchMonitoringData = useCallback(async () => {
    if (isPaused) return;
    
    try {
      const data = await fetchUnifiedMonitoringData();
      const allJobs = [...data.activeJobs, ...data.recentlyCompleted, ...data.recentlyFailed];
      
      // Identificar IDs de jobs que estavam em processamento na renderização anterior
      const previouslyProcessingIds = new Set(processingJobs.map(j => j.fileId));

      const justFinishedJobs = allJobs.filter(job => {
        return (
          (job.status === 'completed' || job.status === 'failed') && 
          previouslyProcessingIds.has(job.id) &&
          !processedJobs.includes(job.id)
        );
      });

      const justFinishedIds = justFinishedJobs.map(j => j.id);
      if (justFinishedIds.length > 0) {
        setExitingJobs(prev => [...prev, ...justFinishedIds]);
        setProcessedJobs(prev => [...prev, ...justFinishedIds]);

        // Agendar a remoção definitiva da lista de saída após a animação
        setTimeout(() => {
          setExitingJobs(prev => prev.filter(id => !justFinishedIds.includes(id)));
        }, 3000);
      }

      // ATUALIZAÇÃO DAS LISTAS:
      const active = data.activeJobs;
      const completed = data.recentlyCompleted;
      const failed = data.recentlyFailed;
      
      setProcessingJobs(active);
      setCompletedJobs(completed);
      setFailedJobs(failed);
      setLastUpdated(new Date());
      
      setStats(data.stats);
      
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados de monitoramento:', err);
      setError(err.message || 'Erro ao buscar dados de monitoramento');
    } finally {
      setIsLoading(false);
    }
  }, [isPaused, processingJobs]);

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
      status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'failed' : 'processing',
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.error,
      downloadStage: job.stages?.[0] ? {
        status: job.stages[0].status === 'completed' ? 'success' : 
               job.stages[0].status === 'failed' ? 'failed' : 
               job.stages[0].status === 'in_progress' ? 'processing' : 'pending'
      } : { status: 'pending' },
      validationStage: job.stages?.[1] ? {
        status: job.stages[1].status === 'completed' ? 'success' : 
               job.stages[1].status === 'failed' ? 'failed' : 
               job.stages[1].status === 'in_progress' ? 'processing' : 'pending'
      } : { status: 'pending' },
      restoreStage: job.stages?.[2] ? {
        status: job.stages[2].status === 'completed' ? 'success' : 
               job.stages[2].status === 'failed' ? 'failed' : 
               job.stages[2].status === 'in_progress' ? 'processing' : 'pending'
      } : { status: 'pending' },
      finalizationStage: job.stages?.[3] ? {
        status: job.stages[3].status === 'completed' ? 'success' : 
               job.stages[3].status === 'failed' ? 'failed' : 
               job.stages[3].status === 'in_progress' ? 'processing' : 'pending'
      } : { status: 'pending' }
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
          case 'processing': return job.status === 'processing' || job.status === 'queued';
          case 'completed': return job.status === 'completed';
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

      {/* Pipeline de Processamento Unificado */}
      <UnifiedPipelineDashboard />

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
                  .map(job => {
                    // Mapear os estágios corretamente
                    const stages = job.stages || [];
                    const downloadStage = stages[0] || { status: 'pending', steps: [] };
                    const validationStage = stages[1] || { status: 'pending', steps: [] };
                    const restoreStage = stages[2] || { status: 'pending', steps: [] };
                    const finalizationStage = stages[3] || { status: 'pending', steps: [] };
                    
                    return (
                      <ActiveJobCard
                        key={job.id || job.fileId}
                        fileId={job.fileId || job.id}
                        fileName={job.fileName}
                        startedAt={job.startedAt}
                        currentStage={job.currentStage}
                        overallProgress={job.overallProgress}
                        downloadStage={{
                          status: downloadStage.status === 'completed' ? 'complete' : 
                                 downloadStage.status === 'in_progress' ? 'processing' : 
                                 downloadStage.status === 'failed' ? 'failed' : 'pending',
                          steps: downloadStage.steps
                        }}
                        validationStage={{
                          status: validationStage.status === 'completed' ? 'complete' : 
                                 validationStage.status === 'in_progress' ? 'processing' : 
                                 validationStage.status === 'failed' ? 'failed' : 'pending',
                          steps: validationStage.steps
                        }}
                        restoreStage={{
                          status: restoreStage.status === 'completed' ? 'complete' : 
                                 restoreStage.status === 'in_progress' ? 'processing' : 
                                 restoreStage.status === 'failed' ? 'failed' : 'pending',
                          steps: restoreStage.steps
                        }}
                        finalizationStage={{
                          status: finalizationStage.status === 'completed' ? 'complete' : 
                                 finalizationStage.status === 'in_progress' ? 'processing' : 
                                 finalizationStage.status === 'failed' ? 'failed' : 'pending',
                          steps: finalizationStage.steps
                        }}
                      />
                    );
                  })
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