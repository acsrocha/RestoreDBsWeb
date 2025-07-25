import React from 'react';
import { FiSearch, FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi';

interface MonitoringPageHeaderProps {
  isPaused: boolean;
  lastUpdated: Date | null;
  searchTerm: string;
  refreshInterval: number;
  isLoading: boolean;
  onTogglePause: () => void;
  onSearchChange: (value: string) => void;
  onRefreshIntervalChange: (interval: number) => void;
  onManualRefresh: () => void;
  refreshOptions: number[];
}

const MonitoringPageHeader: React.FC<MonitoringPageHeaderProps> = ({
  isPaused,
  lastUpdated,
  searchTerm,
  refreshInterval,
  isLoading,
  onTogglePause,
  onSearchChange,
  onRefreshIntervalChange,
  onManualRefresh,
  refreshOptions
}) => {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <select 
          value={refreshInterval} 
          onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
          className="refresh-select"
        >
          {refreshOptions.map(interval => (
            <option key={interval} value={interval}>
              {interval / 1000}s
            </option>
          ))}
        </select>
        
        <button 
          onClick={onTogglePause} 
          className={`control-btn ${isPaused ? 'play' : 'pause'}`}
          title={isPaused ? 'Retomar' : 'Pausar'}
        >
          {isPaused ? <FiPlay /> : <FiPause />}
        </button>
        
        <button 
          onClick={onManualRefresh} 
          className="control-btn refresh"
          disabled={isLoading}
          title="Atualizar agora"
        >
          <FiRefreshCw className={isLoading ? 'spinning' : ''} />
        </button>
      </div>
    </div>
  );
};

export default MonitoringPageHeader;