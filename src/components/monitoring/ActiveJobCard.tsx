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
  const [isExpanded, setIsExpanded] = useState(false);
  
  // --- INÍCIO DA CORREÇÃO ---
  // Estados para controlar as fases da animação de saída
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    // A animação é disparada quando o status da finalização é 'complete' (ou 'completed')
    // e o estado 'isCompleting' ainda não foi ativado, para evitar múltiplos disparos.
    const isDone = finalizationStage.status === 'complete' || finalizationStage.status === 'completed';
    if (isDone && !isCompleting) {
      setIsCompleting(true); // 1. Ativa o estado de "completando" para adicionar a classe do pulso.

      // 2. Aguarda a animação de pulso (2s) terminar antes de iniciar o fade out.
      setTimeout(() => {
        setIsFadingOut(true);
      }, 2000); 

      // 3. Aguarda o fade out (1s) terminar para remover o componente do DOM.
      setTimeout(() => {
        setIsRemoved(true);
      }, 3000); // 2s de pulso + 1s de fade out
    }
  }, [finalizationStage.status, isCompleting]);
  
  // Se o componente estiver no estado final de remoção, ele retorna null e desaparece.
  if (isRemoved) {
    return null;
  }
  // --- FIM DA CORREÇÃO ---
  
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
    
    const iconClass = `stage-icon ${finalStatus}`;

    if (finalStatus === 'completed') {
      return <div className={iconClass}><FiCheckCircle/></div>;
    }
    if (finalStatus === 'failed') {
      return <div className={iconClass}><FiAlertTriangle/></div>;
    }
    if (finalStatus === 'processing') {
      // Usando o ícone FiLoader para a animação de processamento
      return <div className={iconClass}><FiLoader className="processing-spinner" /></div>;
    }
    return <div className={iconClass}></div>; // Ícone pendente
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

  // Combina as classes dinamicamente
  const cardClassName = `active-job-card ${isExpanded ? 'expanded' : ''} ${isCompleting ? 'completing' : ''} ${isFadingOut ? 'fade-out' : ''}`.trim();

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