import React, { useMemo, useState, useCallback } from 'react';
import { FiClock, FiHardDrive, FiCheckCircle, FiAlertTriangle, FiChevronDown, FiChevronUp, FiLoader, FiX, FiDownload, FiShield, FiDatabase, FiCheck } from 'react-icons/fi';
import { monitoringService } from '../../services/monitoringService';
import { useMonitoringStore } from '../../store/monitoringStore';
import { useNotification } from '../../hooks/useNotification';
import { useElapsedTime } from '../../hooks/useElapsedTime';
import StageProgressDetails from './StageProgressDetails';
import '../../styles/components/ActiveJobCard.css';
import '../../styles/components/DetailedMonitoringSteps.css';
import '../../styles/components/StageProgressDetails.css';
import '../../styles/animations/job-card-transition.css';

import type { ProcessingStage } from '../../store/monitoringStore';

type StageStatus = 'pending' | 'processing' | 'complete' | 'completed' | 'failed' | 'start' | 'in_progress';

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
  onJobCancelled?: (jobId: string) => void;
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
  finalizationStage,
  onJobCancelled
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { showSuccess, showError } = useNotification();
  

  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const normalizeStatus = (status: StageStatus): string => {
    if (status === 'complete' || status === 'completed') return 'complete';
    if (status === 'start' || status === 'processing' || status === 'in_progress') return 'processing';
    return status;
  };

  const getStageStatus = (stageName: string, stageData: ProcessingStage) => {
    const stageOrder = ['download', 'validation', 'restore', 'finalization'];
    
    // Mapear currentStage do backend para nomes dos estágios
    const currentStageMapped = currentStage === 'downloading' ? 'download' :
                              currentStage === 'validating' ? 'validation' :
                              currentStage === 'processing' ? 'restore' :
                              currentStage === 'restoring' ? 'restore' :
                              currentStage === 'finalizing' ? 'finalization' :
                              currentStage;
    
    const currentStageIndex = stageOrder.indexOf(currentStageMapped);
    const thisStageIndex = stageOrder.indexOf(stageName);
    
    // Se há dados específicos do estágio, usar eles
    if (stageData && stageData.status) {
      const normalizedStatus = normalizeStatus(stageData.status);
      if (normalizedStatus === 'failed') return 'failed';
      if (normalizedStatus === 'complete') return 'complete';
      if (normalizedStatus === 'processing') return 'processing';
    }
    
    // Lógica baseada na posição do estágio atual
    if (currentStageIndex > thisStageIndex) return 'complete';
    if (currentStageIndex === thisStageIndex) return 'processing';
    
    // Se está em restore e o progresso > 0, marcar download e validation como completos
    if (currentStageMapped === 'restore' && overallProgress > 0) {
      if (stageName === 'download' || stageName === 'validation') return 'complete';
    }
    
    return 'pending';
  };

  const journeyProgress = useMemo(() => {
    const stages = { download: downloadStage, validation: validationStage, restore: restoreStage, finalization: finalizationStage };
    let completedStages = 0;
    Object.entries(stages).forEach(([stageName, stageData]) => {
      if (getStageStatus(stageName, stageData) === 'complete') completedStages++;
    });
    const baseProgress = (completedStages / 4) * 75;
    const currentStageProgress = (overallProgress / 100) * 25;
    return Math.min(100, baseProgress + currentStageProgress);
  }, [currentStage, overallProgress, downloadStage, validationStage, restoreStage, finalizationStage]);

  const handleCancelJob = async () => {
    if (!confirm(`Tem certeza que deseja cancelar o processamento de "${fileName}"?`)) {
      return;
    }

    setIsCancelling(true);
    try {
      await monitoringService.cancelJob(fileId);
      showSuccess(`Job "${fileName}" cancelado com sucesso`);
      if (onJobCancelled) {
        onJobCancelled(fileId);
      }
    } catch (error: any) {
      console.error('Erro ao cancelar job:', error);
      showError(`Erro ao cancelar job: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const elapsedTime = useElapsedTime(startedAt);


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

  const renderStageIcon = (status: StageStatus, stageName: string) => {
    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === 'complete') {
      return (
        <div className="stage-icon complete" title={`${getStageName(stageName)} - Concluído`}>
          <FiCheck />
        </div>
      );
    }
    if (normalizedStatus === 'failed') {
      return (
        <div className="stage-icon failed" title={`${getStageName(stageName)} - Falhou`}>
          <FiAlertTriangle />
        </div>
      );
    }
    if (normalizedStatus === 'processing') {
      return (
        <div className={`stage-icon processing ${stageName}`} title={`${getStageName(stageName)} - Em andamento`}>
          <FiLoader className="processing-spinner" />
        </div>
      );
    }
    
    // Ícones específicos para cada estágio quando pendente
    const stageIcons = {
      'download': <FiDownload />,
      'validation': <FiShield />,
      'restore': <FiDatabase />,
      'finalization': <FiCheckCircle />
    };
    
    return (
      <div className={`stage-icon pending ${stageName}`} title={`${getStageName(stageName)} - Aguardando`}>
        {stageIcons[stageName] || <div></div>}
      </div>
    );
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
    const normalizedStatus = normalizeStatus(status);
    return <span className={`stage-label ${normalizedStatus}`}>{getStageName(stageName)}</span>
  }




  
  // Determinar se um estágio deve mostrar o ícone de processamento
  const isCurrentStage = (stageName: string) => {
    return currentStage === stageName;
  };
  const cardClassName = `active-job-card ${isExpanded ? 'expanded' : ''} ${currentStage === 'processing' || currentStage === 'restore' ? 'processing' : ''}`.trim();

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
          <div className="job-actions">
            <button 
              className="cancel-button" 
              onClick={handleCancelJob}
              disabled={isCancelling}
              aria-label="Cancelar processamento"
              title="Cancelar processamento"
            >
              {isCancelling ? <FiLoader className="processing-spinner" /> : <FiX />}
            </button>
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
      </div>
      
      <div className="job-progress">
        <div className="progress-text">
            <span>{getStageName(currentStage)}</span>
            <span>{Math.floor(overallProgress)}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${progressBarColor}`} 
            style={{ width: `${Math.max(3, Math.min(100, overallProgress))}%` }}
          ></div>
        </div>
      </div>
      
      <div className="job-stages" style={{'--journey-progress': `${journeyProgress}%`} as React.CSSProperties}>
        {['download', 'validation', 'restore', 'finalization'].map((stageName) => {
          const stageData = { download: downloadStage, validation: validationStage, restore: restoreStage, finalization: finalizationStage }[stageName];
          const status = getStageStatus(stageName, stageData);
          return (
            <div key={stageName} className={`job-stage ${status} ${stageName}`}>
              {renderStageIcon(status as StageStatus, stageName)}
              {getStageLabel(stageName, status as StageStatus)}
            </div>
          );
        })}
      </div>
      
      {isExpanded && (
        <div className="job-expanded-details">
          <h4>Detalhes das Etapas</h4>
          {['download', 'validation', 'restore', 'finalization'].map((stageName) => {
            const stageData = { download: downloadStage, validation: validationStage, restore: restoreStage, finalization: finalizationStage }[stageName];
            return (
              <StageProgressDetails
                key={stageName}
                stageName={stageName}
                stageData={stageData}
                isExpanded={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveJobCard;