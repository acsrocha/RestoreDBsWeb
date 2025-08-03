import React from 'react';
import { FiActivity, FiCheckCircle, FiAlertTriangle, FiDatabase } from 'react-icons/fi';

import { useMonitoring } from '../hooks/useMonitoring';
import { useMonitoringStore } from '../store/monitoringStore';
import { useNotification } from '../hooks/useNotification';

import ActiveJobCard from '../components/monitoring/ActiveJobCard';
import UnifiedPipelineDashboard from '../components/pipeline/UnifiedPipelineDashboard';
import FinishedJobsSection from '../components/monitoring/FinishedJobsSection';
import MonitoringPageHeader from '../components/monitoring/MonitoringPageHeader';
import StatisticsDashboard from '../components/monitoring/StatisticsDashboard';
import JobViewFilters from '../components/monitoring/JobViewFilters';

import '../styles/components/DetailedMonitoring.css';
import '../styles/animations/job-card-transition.css';
import '../styles/components/FinishedJobsSection.css';
import '../styles/theme.css';

const REFRESH_OPTIONS = [1000, 2000, 5000, 10000];

const DetailedMonitoringPage: React.FC = () => {
  const { showError } = useNotification();
  
  const {
    searchTerm,
    selectedView,
    selectedJobId,
    isPaused,
    refreshInterval,
    setSearchTerm,
    setSelectedView,
    setSelectedJobId,
    setPaused,
    setRefreshInterval
  } = useMonitoringStore();

  const {
    stats,
    lastUpdated,
    isLoading,
    error,
    processingJobs,
    completedJobs,
    failedJobs,
    filteredJobs,
    refresh
  } = useMonitoring({
    enabled: true,
    interval: refreshInterval,
    onError: (error) => showError(error.message)
  });

  const togglePause = () => setPaused(!isPaused);
  const handleRefreshIntervalChange = (interval: number) => setRefreshInterval(interval);
  const handleManualRefresh = () => refresh();

  const handleJobCancelled = (jobId: string) => {
    // O store já será atualizado pelo polling automático
    setTimeout(refresh, 1000);
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(selectedJobId === jobId ? null : jobId);
  };

  const realtimeStats = React.useMemo(() => {
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

  if (error && !lastUpdated) {
    return (
      <div className="detailed-monitoring-page">
        <div className="error-container">
          <FiAlertTriangle className="error-icon" />
          <p>{error}</p>
          <button onClick={handleManualRefresh} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

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

      {isLoading && filteredJobs.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dados de monitoramento...</p>
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
                      key={job.id || job.fileId}
                      fileId={job.fileId || job.id}
                      fileName={job.fileName}
                      startedAt={job.startedAt}
                      currentStage={job.currentStage}
                      overallProgress={job.overallProgress}
                      downloadStage={job.stages.download}
                      validationStage={job.stages.validation}
                      restoreStage={job.stages.restore}
                      finalizationStage={job.stages.finalization}
                      onJobCancelled={handleJobCancelled}
                    />
                  ))
                }
              </div>
            </section>
          )}
          
          {(selectedView === 'all' || selectedView === 'completed' || selectedView === 'failed') && 
           (completedJobs.length > 0 || failedJobs.length > 0) && (
            <FinishedJobsSection 
              completedJobs={completedJobs}
              failedJobs={failedJobs}
              searchTerm={searchTerm}
              selectedView={selectedView}
              onJobSelect={handleJobSelect}
              selectedJobId={selectedJobId}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DetailedMonitoringPage;