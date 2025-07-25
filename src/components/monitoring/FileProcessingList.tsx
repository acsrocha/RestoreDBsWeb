import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiClock, FiFileText } from 'react-icons/fi';
import '../../styles/components/FileProcessingList.css';

interface FileProcessingJob {
  fileId: string;
  fileName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  overallProgress: number;
  currentStage: string;
  downloadStageStatus: string;
  downloadStageDetails?: string;
  validationStageStatus: string;
  validationStageDetails?: string;
  restoreStageStatus: string;
  restoreStageDetails?: string;
  finalizationStageStatus: string;
  finalizationStageDetails?: string;
}

interface FileProcessingListProps {
  jobs: FileProcessingJob[];
  isLoading: boolean;
  emptyMessage: string;
  type: 'success' | 'error';
}

const FileProcessingList: React.FC<FileProcessingListProps> = ({
  jobs,
  isLoading,
  emptyMessage,
  type
}) => {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const toggleJobDetails = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
    }
  };

  // Formatar duração do processamento
  const formatDuration = (startTime: string, endTime?: string) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const durationMs = end - start;
    
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="file-processing-list">
      {jobs.map(job => (
        <div 
          key={job.fileId} 
          className={`file-item ${type} ${expandedJobId === job.fileId ? 'expanded' : ''}`}
        >
          <div 
            className="file-header" 
            onClick={() => toggleJobDetails(job.fileId)}
          >
            <div className="file-info">
              <FiFileText className="file-icon" />
              <span className="file-name" title={job.fileName}>
                {job.fileName}
              </span>
            </div>
            
            <div className="file-meta">
              <div className="file-time">
                <FiClock className="time-icon" />
                <span title={`Duração: ${formatDuration(job.startedAt, job.completedAt)}`}>
                  {formatDuration(job.startedAt, job.completedAt)}
                </span>
              </div>
              
              {expandedJobId === job.fileId ? (
                <FiChevronUp className="expand-icon" />
              ) : (
                <FiChevronDown className="expand-icon" />
              )}
            </div>
          </div>
          
          {expandedJobId === job.fileId && (
            <div className="file-details">
              <div className="detail-row">
                <span className="detail-label">Iniciado em:</span>
                <span className="detail-value">
                  {new Date(job.startedAt).toLocaleString()}
                </span>
              </div>
              
              {job.completedAt && (
                <div className="detail-row">
                  <span className="detail-label">Concluído em:</span>
                  <span className="detail-value">
                    {new Date(job.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">ID do Arquivo:</span>
                <span className="detail-value">{job.fileId}</span>
              </div>
              
              {type === 'error' && job.errorMessage && (
                <div className="detail-row error-message">
                  <span className="detail-label">Erro:</span>
                  <span className="detail-value">{job.errorMessage}</span>
                </div>
              )}
              
              <div className="stages-summary">
                <h4>Estágios de Processamento:</h4>
                
                <div className={`stage-item ${job.downloadStageStatus}`}>
                  <span className="stage-name">Download:</span>
                  <span className="stage-status">{job.downloadStageStatus}</span>
                  {job.downloadStageDetails && (
                    <div className="stage-details">{job.downloadStageDetails}</div>
                  )}
                </div>
                
                <div className={`stage-item ${job.validationStageStatus}`}>
                  <span className="stage-name">Validação:</span>
                  <span className="stage-status">{job.validationStageStatus}</span>
                  {job.validationStageDetails && (
                    <div className="stage-details">{job.validationStageDetails}</div>
                  )}
                </div>
                
                <div className={`stage-item ${job.restoreStageStatus}`}>
                  <span className="stage-name">Restauração:</span>
                  <span className="stage-status">{job.restoreStageStatus}</span>
                  {job.restoreStageDetails && (
                    <div className="stage-details">{job.restoreStageDetails}</div>
                  )}
                </div>
                
                <div className={`stage-item ${job.finalizationStageStatus}`}>
                  <span className="stage-name">Finalização:</span>
                  <span className="stage-status">{job.finalizationStageStatus}</span>
                  {job.finalizationStageDetails && (
                    <div className="stage-details">{job.finalizationStageDetails}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileProcessingList;