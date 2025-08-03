import React from 'react';
import { FiClock, FiCheckCircle, FiAlertTriangle, FiLoader, FiDownload, FiShield, FiDatabase, FiSettings } from 'react-icons/fi';

interface ProcessingStage {
  status: string;
  details?: string;
  progress?: number;
  startTime?: string;
  endTime?: string;
  steps?: Array<{
    id: string;
    timestamp: string;
    status: string;
    message: string;
    details?: string;
    duration?: number;
  }>;
}

interface StageProgressDetailsProps {
  stageName: string;
  stageData: ProcessingStage;
  isExpanded: boolean;
}

const StageProgressDetails: React.FC<StageProgressDetailsProps> = ({
  stageName,
  stageData,
  isExpanded
}) => {
  const getStageIcon = (stageName: string) => {
    const icons = {
      'download': <FiDownload />,
      'validation': <FiShield />,
      'restore': <FiDatabase />,
      'finalization': <FiSettings />
    };
    return icons[stageName as keyof typeof icons] || <FiClock />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'complete':
        return <FiCheckCircle className="status-icon success" />;
      case 'failed':
        return <FiAlertTriangle className="status-icon error" />;
      case 'processing':
      case 'in_progress':
        return <FiLoader className="status-icon processing processing-spinner" />;
      default:
        return <FiClock className="status-icon pending" />;
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return null;
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStageName = (stage: string): string => {
    const names = {
      'download': 'Download',
      'validation': 'Validação',
      'restore': 'Restauração',
      'finalization': 'Finalização'
    };
    return names[stage as keyof typeof names] || stage;
  };

  if (!isExpanded) return null;

  return (
    <div className="stage-details-section">
      <h5>
        {getStageIcon(stageName)}
        {getStageName(stageName)}
        <span className={`stage-status-badge ${stageData.status}`}>
          {getStatusIcon(stageData.status)}
          {stageData.status}
        </span>
      </h5>
      
      {stageData.progress !== undefined && (
        <div className="stage-progress-bar">
          <div className="progress-text">
            <span>Progresso</span>
            <span>{Math.floor(stageData.progress)}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar progress-bar-info" 
              style={{ width: `${Math.max(3, stageData.progress)}%` }}
            />
          </div>
        </div>
      )}

      {(stageData.startTime || stageData.endTime) && (
        <div className="stage-timing">
          {stageData.startTime && (
            <div className="timing-info">
              <FiClock />
              <span>Iniciado: {new Date(stageData.startTime).toLocaleString()}</span>
            </div>
          )}
          {stageData.endTime && (
            <div className="timing-info">
              <FiCheckCircle />
              <span>Finalizado: {new Date(stageData.endTime).toLocaleString()}</span>
            </div>
          )}
          {formatDuration(stageData.startTime, stageData.endTime) && (
            <div className="timing-info">
              <span className="duration">Duração: {formatDuration(stageData.startTime, stageData.endTime)}</span>
            </div>
          )}
        </div>
      )}

      {stageData.details && (
        <div className="stage-details">
          <strong>Detalhes:</strong>
          <p>{stageData.details}</p>
        </div>
      )}

      {stageData.steps && stageData.steps.length > 0 && (
        <div className="stage-steps">
          <strong>Passos:</strong>
          <ul>
            {stageData.steps.map((step) => (
              <li key={step.id} className={`step-item ${step.status}`}>
                <div className="step-header">
                  <span className="step-timestamp">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="step-message">{step.message}</span>
                  {step.duration && (
                    <span className="step-duration">
                      ({Math.floor(step.duration / 1000)}s)
                    </span>
                  )}
                </div>
                {step.details && (
                  <div className="step-details">{step.details}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!stageData.steps || stageData.steps.length === 0) && stageData.status === 'pending' && (
        <div className="no-steps">
          Esta etapa ainda não foi iniciada
        </div>
      )}
    </div>
  );
};

export default StageProgressDetails;