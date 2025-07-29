import React from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiCopy } from 'react-icons/fi';
import { useNotification } from '../../hooks/useNotification';
import '../../styles/components/JobDetails.css';

interface JobStage {
  status: 'success' | 'failed' | 'processing' | 'pending';
  details?: string;
}

interface Job {
  fileId: string;
  fileName: string;
  status: 'success' | 'failed' | 'processing';
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  downloadStage: JobStage;
  validationStage: JobStage;
  restoreStage: JobStage;
  finalizationStage: JobStage;
}

interface JobDetailsProps {
  job: Job;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job }) => {
  const { showSuccess } = useNotification();

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'N/A';
    }
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copiado!`);
  };
  
  const renderTimelineStep = (stage: JobStage, name: string) => {
    let icon;
    let statusText;
    const iconClass = `timeline-icon status-${stage.status}`;

    switch (stage.status) {
      case 'success':
        icon = <FiCheckCircle />;
        statusText = 'Concluído com sucesso';
        break;
      case 'failed':
        icon = <FiXCircle />;
        statusText = 'Falhou';
        break;
      case 'processing':
        icon = <div className="loading-spinner" style={{ width: 16, height: 16 }}></div>;
        statusText = 'Em andamento...';
        break;
      case 'pending':
      default:
        icon = <FiClock />;
        statusText = 'Pendente';
        break;
    }

    return (
      <li className={`timeline-step status-${stage.status}`}>
        <div className={iconClass}>{icon}</div>
        <div className="timeline-content">
          <h4 className="stage-name">{name}</h4>
          <p className="stage-status">{statusText}</p>
          {stage.status === 'failed' && stage.details && (
            <pre className="stage-error-details">{stage.details}</pre>
          )}
        </div>
      </li>
    );
  };
  
  const statusClass = `job-details-card status-${job.status}`;
  
  return (
    <div className={statusClass}>
      <div className="job-details-header">
        <div className="job-title-group">
          <h3 className="job-filename">{job.fileName}</h3>
          {job.status === 'failed' && job.errorMessage && (
            <p className="job-error-summary">{job.errorMessage}</p>
          )}
        </div>

      </div>
      
      <div className="job-details-body">
        <div className="timeline-section">
           <ul className="timeline">
            {renderTimelineStep(job.downloadStage, 'Download do Arquivo')}
            {renderTimelineStep(job.validationStage, 'Validação de Arquivo')}
            {renderTimelineStep(job.restoreStage, 'Restauração do Banco')}
            {renderTimelineStep(job.finalizationStage, 'Finalização e Limpeza')}
          </ul>
        </div>
        
        <div className="metadata-section">
          <dl>
            <div className="metadata-item">
              <dt>ID do Arquivo</dt>
              <dd className="copyable" onClick={() => copyToClipboard(job.fileId, 'ID do Arquivo')}>
                {job.fileId} <FiCopy size={14} />
              </dd>
            </div>
            <div className="metadata-item">
              <dt>Iniciado em</dt>
              <dd>{formatDate(job.startedAt)}</dd>
            </div>
             <div className="metadata-item">
              <dt>Concluído em</dt>
              <dd>{formatDate(job.completedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;