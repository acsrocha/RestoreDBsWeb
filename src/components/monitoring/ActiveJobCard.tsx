import React, { useMemo, useState } from 'react';
import { FiClock, FiHardDrive, FiCheckCircle, FiAlertTriangle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import '../../styles/components/ActiveJobCard.css';

// Tipos para os estágios de processamento
type StageStatus = 'pending' | 'start' | 'processing' | 'complete' | 'failed';

interface ProcessingStage {
  status: StageStatus;
  details?: string;
}

interface ActiveJobProps {
  fileId: string;
  fileName: string;
  startedAt: string;
  currentStage: string;
  overallProgress: number;
  downloadStage: ProcessingStage;
  validationStage: ProcessingStage;
  restoreStage: ProcessingStage;
  finalizationStage: ProcessingStage;
}

const ActiveJobCard: React.FC<ActiveJobProps> = ({
  fileId,
  fileName,
  startedAt,
  currentStage,
  overallProgress,
  downloadStage,
  validationStage,
  restoreStage,
  finalizationStage
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  // Calcular o tempo decorrido desde o início do processamento
  const elapsedTime = useMemo(() => {
    const startTime = new Date(startedAt).getTime();
    const now = new Date().getTime();
    const elapsed = now - startTime;
    
    // Formatar o tempo decorrido
    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [startedAt]);

  // Determinar a cor da barra de progresso com base no estágio atual
  const progressBarColor = useMemo(() => {
    if (restoreStage.status === 'failed' || validationStage.status === 'failed') {
      return 'progress-bar-error';
    }
    if (overallProgress >= 100) {
      return 'progress-bar-success';
    }
    return 'progress-bar-info';
  }, [overallProgress, restoreStage.status, validationStage.status]);

  // Renderizar o ícone do estágio atual
  const renderStageIcon = (stage: string, status: StageStatus) => {
    if (status === 'complete') {
      return <FiCheckCircle className="stage-icon complete" />;
    }
    if (status === 'failed') {
      return <FiAlertTriangle className="stage-icon failed" />;
    }
    if (status === 'processing' || status === 'start') {
      return <div className="stage-icon processing"></div>;
    }
    return <div className="stage-icon pending"></div>;
  };

  // Mapear o nome do estágio para um nome amigável
  const getStageName = (stage: string): string => {
    switch (stage) {
      case 'download': return 'Download';
      case 'validation': return 'Validação';
      case 'restore': return 'Restauração';
      case 'finalization': return 'Finalização';
      default: return stage;
    }
  };

  // Obter o status do estágio atual
  const getCurrentStageStatus = (): ProcessingStage => {
    switch (currentStage) {
      case 'download': return downloadStage;
      case 'validation': return validationStage;
      case 'restore': return restoreStage;
      case 'finalization': return finalizationStage;
      default: return { status: 'pending' };
    }
  };

  const currentStageStatus = getCurrentStageStatus();

  return (
    <div className={`active-job-card ${isExpanded ? 'expanded' : ''}`} data-file-id={fileId}>
      <div className="job-header">
        <h3 className="job-filename" title={fileName}>
          <FiHardDrive className="file-icon" />
          {fileName}
        </h3>
        <div className="job-meta">
          <div className="job-time">
            <FiClock className="time-icon" />
            <span title={`Iniciado em: ${new Date(startedAt).toLocaleString()}`}>
              {elapsedTime}
            </span>
          </div>
          <button 
            className="expand-button" 
            onClick={toggleExpand} 
            aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
            title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>
      </div>
      
      <div className="job-progress">
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${progressBarColor}`} 
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {overallProgress}% - {getStageName(currentStage)}
        </div>
      </div>
      
      <div className="job-stages">
        <div className={`job-stage ${currentStage === 'download' ? 'active' : ''}`}>
          {renderStageIcon('download', downloadStage.status)}
          <span>Download</span>
        </div>
        <div className={`job-stage ${currentStage === 'validation' ? 'active' : ''}`}>
          {renderStageIcon('validation', validationStage.status)}
          <span>Validação</span>
        </div>
        <div className={`job-stage ${currentStage === 'restore' ? 'active' : ''}`}>
          {renderStageIcon('restore', restoreStage.status)}
          <span>Restauração</span>
        </div>
        <div className={`job-stage ${currentStage === 'finalization' ? 'active' : ''}`}>
          {renderStageIcon('finalization', finalizationStage.status)}
          <span>Finalização</span>
        </div>
      </div>
      
      {currentStageStatus.details && (
        <div className="job-details">
          <p>{currentStageStatus.details}</p>
        </div>
      )}
      
      {isExpanded && (
        <div className="job-expanded-details">
          <h4>Detalhes do Processamento</h4>
          
          <div className="stage-details-section">
            <h5>Download</h5>
            <div className={`stage-status-badge ${downloadStage.status}`}>
              {downloadStage.status === 'pending' ? 'Pendente' : 
               downloadStage.status === 'processing' ? 'Em Processamento' : 
               downloadStage.status === 'complete' ? 'Concluído' : 'Falha'}
            </div>
            {downloadStage.status !== 'pending' && (
              <div className="stage-steps">
                {downloadStage.steps && downloadStage.steps.length > 0 ? (
                  <ul>
                    {downloadStage.steps.map((step, index) => (
                      <li key={step.id || index} className={`step-item ${step.status}`}>
                        <div className="step-header">
                          <span className="step-timestamp">{new Date(step.timestamp).toLocaleTimeString()}</span>
                          <span className="step-message">{step.message}</span>
                        </div>
                        {step.details && <div className="step-details">{step.details}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-steps">Nenhum detalhe disponível</p>
                )}
              </div>
            )}
          </div>
          
          <div className="stage-details-section">
            <h5>Validação</h5>
            <div className={`stage-status-badge ${validationStage.status}`}>
              {validationStage.status === 'pending' ? 'Pendente' : 
               validationStage.status === 'processing' ? 'Em Processamento' : 
               validationStage.status === 'complete' ? 'Concluído' : 'Falha'}
            </div>
            {validationStage.status !== 'pending' && (
              <div className="stage-steps">
                {validationStage.steps && validationStage.steps.length > 0 ? (
                  <ul>
                    {validationStage.steps.map((step, index) => (
                      <li key={step.id || index} className={`step-item ${step.status}`}>
                        <div className="step-header">
                          <span className="step-timestamp">{new Date(step.timestamp).toLocaleTimeString()}</span>
                          <span className="step-message">{step.message}</span>
                        </div>
                        {step.details && <div className="step-details">{step.details}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-steps">Nenhum detalhe disponível</p>
                )}
              </div>
            )}
          </div>
          
          <div className="stage-details-section">
            <h5>Restauração</h5>
            <div className={`stage-status-badge ${restoreStage.status}`}>
              {restoreStage.status === 'pending' ? 'Pendente' : 
               restoreStage.status === 'processing' ? 'Em Processamento' : 
               restoreStage.status === 'complete' ? 'Concluído' : 'Falha'}
            </div>
            {restoreStage.status !== 'pending' && (
              <div className="stage-steps">
                {restoreStage.steps && restoreStage.steps.length > 0 ? (
                  <ul>
                    {restoreStage.steps.map((step, index) => (
                      <li key={step.id || index} className={`step-item ${step.status}`}>
                        <div className="step-header">
                          <span className="step-timestamp">{new Date(step.timestamp).toLocaleTimeString()}</span>
                          <span className="step-message">{step.message}</span>
                        </div>
                        {step.details && <div className="step-details">{step.details}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-steps">Nenhum detalhe disponível</p>
                )}
              </div>
            )}
          </div>
          
          <div className="stage-details-section">
            <h5>Finalização</h5>
            <div className={`stage-status-badge ${finalizationStage.status}`}>
              {finalizationStage.status === 'pending' ? 'Pendente' : 
               finalizationStage.status === 'processing' ? 'Em Processamento' : 
               finalizationStage.status === 'complete' ? 'Concluído' : 'Falha'}
            </div>
            {finalizationStage.status !== 'pending' && (
              <div className="stage-steps">
                {finalizationStage.steps && finalizationStage.steps.length > 0 ? (
                  <ul>
                    {finalizationStage.steps.map((step, index) => (
                      <li key={step.id || index} className={`step-item ${step.status}`}>
                        <div className="step-header">
                          <span className="step-timestamp">{new Date(step.timestamp).toLocaleTimeString()}</span>
                          <span className="step-message">{step.message}</span>
                        </div>
                        {step.details && <div className="step-details">{step.details}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-steps">Nenhum detalhe disponível</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveJobCard;