import React, { useMemo, useState, useEffect } from 'react';
import { FiClock, FiHardDrive, FiCheckCircle, FiAlertTriangle, FiChevronDown, FiChevronUp, FiLoader } from 'react-icons/fi';
import '../../styles/components/ActiveJobCard.css';
import '../../styles/components/DetailedMonitoringSteps.css';

// Tipos para os estágios de processamento
type StageStatus = 'pending' | 'start' | 'processing' | 'complete' | 'completed' | 'failed';

interface ProcessingStage {
  status: StageStatus;
  details?: string;
  steps?: Array<{
    id: string;
    timestamp: string;
    status: string;
    message: string;
    details?: string;
    duration?: number;
  }>;
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
  // LOG 1: VER AS PROPS A CADA RENDERIZAÇÃO
  console.log(`[CARD: ${fileId}] Renderizando. Status de Finalização: ${finalizationStage.status}`);

  // LOG 2: VER QUANDO O COMPONENTE É MONTADO E DESMONTADO
  useEffect(() => {
    // Roda quando o componente é montado
    console.log(`%c[CARD: ${fileId}] MONTADO NO DOM`, 'color: green; font-weight: bold;');

    // A função de retorno do useEffect roda quando o componente vai ser desmontado
    return () => {
      console.log(`%c[CARD: ${fileId}] SENDO DESMONTADO`, 'color: red; font-weight: bold;');
    };
  }, [fileId]); // Dependência em fileId para ser específico da instância do card

  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Lógica para o tempo decorrido (otimizada com useEffect e setInterval)
  const [elapsedTime, setElapsedTime] = useState('0s');
  useEffect(() => {
      const interval = setInterval(() => {
          if (!startedAt) {
              setElapsedTime('N/A');
              return;
          }
          const startTime = new Date(startedAt).getTime();
          const now = new Date().getTime();
          const elapsed = now - startTime;

          const seconds = Math.floor((elapsed / 1000) % 60);
          const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
          const hours = Math.floor(elapsed / (1000 * 60 * 60));

          if (hours > 0) setElapsedTime(`${hours}h ${minutes}m`);
          else if (minutes > 0) setElapsedTime(`${minutes}m ${seconds}s`);
          else setElapsedTime(`${seconds}s`);
      }, 1000);
      return () => clearInterval(interval);
  }, [startedAt]);


  const progressBarColor = useMemo(() => {
    if (restoreStage.status === 'failed' || validationStage.status === 'failed') {
      return 'progress-bar-error';
    }
    // Garante que a barra fique verde ao completar 100% ou ao finalizar
    if (overallProgress >= 100 || finalizationStage.status === 'complete' || finalizationStage.status === 'completed') {
      return 'progress-bar-success';
    }
    return 'progress-bar-info';
  }, [overallProgress, restoreStage.status, validationStage.status, finalizationStage.status]);

  const renderStageIcon = (status: StageStatus) => {
    const finalStatus = (status === 'complete' || status === 'completed') ? 'completed' 
                      : (status === 'start' || status === 'processing') ? 'processing' 
                      : status;

    if (finalStatus === 'completed') {
      return <FiCheckCircle className="stage-icon complete" />;
    }
    if (finalStatus === 'failed') {
      return <FiAlertTriangle className="stage-icon failed" />;
    }
    if (finalStatus === 'processing') {
      return <div className="stage-icon processing"><FiLoader className="processing-spinner" /></div>;
    }
    return <div className="stage-icon pending"></div>;
  };

  const getStageName = (stage: string): string => {
    switch (stage) {
      case 'download': return 'Download';
      case 'validation': return 'Validação';
      case 'restore': return 'Restauração';
      case 'finalization': return 'Finalização';
      default: return stage;
    }
  };
  
  const getStageLabel = (stageName: string, status: StageStatus) => {
    const finalStatus = (status === 'complete' || status === 'completed') ? 'complete' : status;
    return <span className={`stage-label ${finalStatus}`}>{getStageName(stageName)}</span>
  }

  const cardClassName = `active-job-card ${isExpanded ? 'expanded' : ''}`.trim();

  return (
    <div className={cardClassName} data-file-id={fileId}>
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
        <div className="progress-text">
            <span>{getStageName(currentStage)}</span>
            <span>{Math.floor(overallProgress)}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${progressBarColor}`} 
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="job-stages">
        <div className="job-stage">
          {renderStageIcon(downloadStage.status)}
          {getStageLabel('download', downloadStage.status)}
        </div>
        <div className="job-stage">
          {renderStageIcon(validationStage.status)}
          {getStageLabel('validation', validationStage.status)}
        </div>
        <div className="job-stage">
          {renderStageIcon(restoreStage.status)}
          {getStageLabel('restore', restoreStage.status)}
        </div>
        <div className="job-stage">
          {renderStageIcon(finalizationStage.status)}
          {getStageLabel('finalization', finalizationStage.status)}
        </div>
      </div>
    </div>
  );
};

export default ActiveJobCard;