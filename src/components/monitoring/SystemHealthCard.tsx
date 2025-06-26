// src/components/monitoring/SystemHealthCard.tsx
import React from 'react';
import { 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiServer,
  FiClock,
  FiDatabase,
  FiCloud
} from 'react-icons/fi';

interface HealthCheckData {
  status: string;
  timestamp: string;
  problems: string[];
  queue_size: number;
  current_processing: string;
  disk_space: Record<string, string>;
  firebird_status: string;
  gdrive_status: string;
}

interface SystemHealthCardProps {
  healthData: HealthCheckData | null;
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ healthData }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <FiCheckCircle className="text-success" />;
      case 'warning':
        return <FiAlertTriangle className="text-warning" />;
      default:
        return <FiAlertTriangle className="text-error" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'status--success';
      case 'warning':
        return 'status--warning';
      default:
        return 'status--error';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="status-highlight-grid">
      {/* Overall Health */}
      <div className="highlight-card">
        <div className="card-icon">
          {healthData ? getStatusIcon(healthData.status) : <FiServer />}
        </div>
        <div className="card-content">
          <div className="card-value">
            {healthData ? (
              <span className={`status-badge ${getStatusColor(healthData.status)}`}>
                {healthData.status === 'healthy' ? 'Saudável' : 'Atenção'}
              </span>
            ) : 'Carregando...'}
          </div>
          <div className="card-label">Status Geral</div>
          {healthData?.timestamp && (
            <div className="card-subtitle">
              {formatTimestamp(healthData.timestamp)}
            </div>
          )}
        </div>
      </div>

      {/* Queue Status */}
      <div className="highlight-card queue">
        <div className="card-icon">
          <FiClock />
        </div>
        <div className="card-content">
          <div className="card-value">{healthData?.queue_size || 0}</div>
          <div className="card-label">Arquivos na Fila</div>
          {healthData?.current_processing && (
            <div className="card-subtitle">
              Processando: {healthData.current_processing}
            </div>
          )}
        </div>
      </div>

      {/* Firebird Status */}
      <div className="highlight-card">
        <div className="card-icon">
          <FiDatabase />
        </div>
        <div className="card-content">
          <div className="card-value">
            {healthData ? (
              <span className={`status-badge ${
                healthData.firebird_status === 'ok' ? 'status--success' : 'status--error'
              }`}>
                {healthData.firebird_status === 'ok' ? 'OK' : 'Erro'}
              </span>
            ) : (
              <span className="status-badge status--warning">Carregando...</span>
            )}
          </div>
          <div className="card-label">Firebird</div>
        </div>
      </div>

      {/* Google Drive Status */}
      <div className="highlight-card">
        <div className="card-icon">
          <FiCloud />
        </div>
        <div className="card-content">
          <div className="card-value">
            {healthData ? (
              <span className={`status-badge ${
                healthData.gdrive_status === 'ok' ? 'status--success' : 
                healthData.gdrive_status === 'desabilitado' ? 'status--archived' : 'status--error'
              }`}>
                {healthData.gdrive_status === 'ok' ? 'OK' : 
                 healthData.gdrive_status === 'desabilitado' ? 'Desabilitado' : 'Erro'}
              </span>
            ) : (
              <span className="status-badge status--warning">Carregando...</span>
            )}
          </div>
          <div className="card-label">Google Drive</div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;