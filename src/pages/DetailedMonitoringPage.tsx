import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchFileProcessingJobs } from '../services/fileMonitoringApi';
import { useInterval } from '../hooks/useInterval';
import { useNotification } from '../hooks/useNotification';
import ActiveJobCard from '../components/monitoring/ActiveJobCard';
import FileProcessingList from '../components/monitoring/FileProcessingList';
import BackendDiagnostic from '../components/monitoring/BackendDiagnostic';
import { 
  FiActivity, FiCheckCircle, FiAlertTriangle, FiRefreshCw, 
  FiPause, FiPlay, FiFilter, FiSearch, FiBarChart,
  FiClock, FiTrendingUp, FiDatabase
} from 'react-icons/fi';
import '../styles/components/DetailedMonitoring.css';

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
      if (!isPaused) {
        showError('Falha ao atualizar dados de monitoramento: ' + (err.message || 'Erro desconhecido'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [showError, isPaused]);

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
      {/* Header com controles */}
      <div className="monitoring-header">
        <div className="header-left">
          <h1>Monitoramento Detalhado</h1>
          <div className="status-indicator">
            <div className={`status-dot ${isPaused ? 'paused' : 'active'}`}></div>
            <span>{isPaused ? 'Pausado' : 'Ativo'}</span>
            {lastUpdated && (
              <span className="last-update">
                Última atualização: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="header-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={refreshInterval} 
            onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
            className="refresh-select"
          >
            {REFRESH_OPTIONS.map(interval => (
              <option key={interval} value={interval}>
                {interval / 1000}s
              </option>
            ))}
          </select>
          
          <button 
            onClick={togglePause} 
            className={`control-btn ${isPaused ? 'play' : 'pause'}`}
            title={isPaused ? 'Retomar' : 'Pausar'}
          >
            {isPaused ? <FiPlay /> : <FiPause />}
          </button>
          
          <button 
            onClick={handleManualRefresh} 
            className="control-btn refresh"
            disabled={isLoading}
            title="Atualizar agora"
          >
            <FiRefreshCw className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Dashboard de estatísticas */}
      <div className="stats-dashboard">
        <div className="stat-card total">
          <FiDatabase className="stat-icon" />
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total de Arquivos</div>
          </div>
        </div>
        
        <div className="stat-card processing">
          <FiActivity className="stat-icon" />
          <div className="stat-content">
            <div className="stat-number">{stats.processing}</div>
            <div className="stat-label">Em Processamento</div>
            {realtimeStats.avgProgress > 0 && (
              <div className="stat-detail">{realtimeStats.avgProgress.toFixed(1)}% médio</div>
            )}
          </div>
        </div>
        
        <div className="stat-card completed">
          <FiCheckCircle className="stat-icon" />
          <div className="stat-content">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Concluídos</div>
          </div>
        </div>
        
        <div className="stat-card failed">
          <FiAlertTriangle className="stat-icon" />
          <div className="stat-content">
            <div className="stat-number">{stats.failed}</div>
            <div className="stat-label">Com Falha</div>
          </div>
        </div>
        
        {realtimeStats.estimatedTime > 0 && (
          <div className="stat-card eta">
            <FiClock className="stat-icon" />
            <div className="stat-content">
              <div className="stat-number">
                {Math.round(realtimeStats.estimatedTime / 60000)}min
              </div>
              <div className="stat-label">Tempo Estimado</div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros de visualização */}
      <div className="view-filters">
        <button 
          className={`filter-btn ${selectedView === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedView('all')}
        >
          <FiBarChart /> Todos ({stats.total})
        </button>
        <button 
          className={`filter-btn ${selectedView === 'processing' ? 'active' : ''}`}
          onClick={() => setSelectedView('processing')}
        >
          <FiActivity /> Processando ({stats.processing})
        </button>
        <button 
          className={`filter-btn ${selectedView === 'completed' ? 'active' : ''}`}
          onClick={() => setSelectedView('completed')}
        >
          <FiCheckCircle /> Concluídos ({stats.completed})
        </button>
        <button 
          className={`filter-btn ${selectedView === 'failed' ? 'active' : ''}`}
          onClick={() => setSelectedView('failed')}
        >
          <FiAlertTriangle /> Falhas ({stats.failed})
        </button>
      </div>

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
              />
            </section>
          )}
        </div>
      )}
      
      <BackendDiagnostic />
    </div>
  );
};

export default DetailedMonitoringPage;