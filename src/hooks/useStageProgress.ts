import { useMemo } from 'react';

export type StageStatus = 'pending' | 'start' | 'processing' | 'in_progress' | 'complete' | 'completed' | 'failed';

export interface ProcessingStage {
  status: StageStatus;
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

export interface StageProgressData {
  download: ProcessingStage;
  validation: ProcessingStage;
  restore: ProcessingStage;
  finalization: ProcessingStage;
}

export const useStageProgress = (
  currentStage: string,
  overallProgress: number,
  stagesData: StageProgressData
) => {
  const normalizeStatus = (status: StageStatus): string => {
    if (status === 'complete' || status === 'completed') return 'complete';
    if (status === 'start' || status === 'processing' || status === 'in_progress') return 'processing';
    return status;
  };

  const getStageStatus = (stageName: string, stageData: ProcessingStage) => {
    const stageOrder = ['download', 'validation', 'restore', 'finalization'];
    const currentStageIndex = stageOrder.indexOf(currentStage);
    const thisStageIndex = stageOrder.indexOf(stageName);
    
    // Primeiro, verificar o status real dos dados se disponível
    if (stageData && stageData.status) {
      const normalizedStatus = normalizeStatus(stageData.status);
      
      // Se o status é explicitamente failed, retornar failed
      if (normalizedStatus === 'failed') {
        return 'failed';
      }
      
      // Se o status é explicitamente complete, retornar complete
      if (normalizedStatus === 'complete') {
        return 'complete';
      }
      
      // Se é o estágio atual e está processando, retornar processing
      if (currentStageIndex === thisStageIndex && normalizedStatus === 'processing') {
        return 'processing';
      }
    }
    
    // Lógica baseada na posição do estágio atual
    // Se o estágio atual é posterior a este, este deve estar completo
    if (currentStageIndex > thisStageIndex) {
      return 'complete';
    }
    
    // Se é o estágio atual, verificar se está processando
    if (currentStageIndex === thisStageIndex) {
      // Se não há dados específicos, assumir que está processando
      return stageData?.status ? normalizeStatus(stageData.status) : 'processing';
    }
    
    // Se é um estágio futuro, está pendente
    return 'pending';
  };

  const calculateJourneyProgress = useMemo(() => {
    let completedStages = 0;
    const totalStages = 4;
    
    // Contar estágios completados
    Object.entries(stagesData).forEach(([stageName, stageData]) => {
      const status = getStageStatus(stageName, stageData);
      if (status === 'complete') {
        completedStages++;
      }
    });
    
    // Progresso base dos estágios completos (75% do total)
    const baseProgress = (completedStages / totalStages) * 75;
    
    // Adicionar progresso do estágio atual (25% do total)
    const currentStageProgress = (overallProgress / 100) * 25;
    
    return Math.min(100, baseProgress + currentStageProgress);
  }, [currentStage, overallProgress, stagesData]);

  const getStageDisplayInfo = (stageName: string) => {
    const stageData = stagesData[stageName as keyof StageProgressData];
    const status = getStageStatus(stageName, stageData);
    
    const stageNames = {
      'download': 'Download',
      'validation': 'Validação',
      'restore': 'Restauração',
      'finalization': 'Finalização'
    };

    const stageProgress = stageData?.progress || 0;
    const isCurrentStage = currentStage === stageName;
    
    return {
      name: stageNames[stageName as keyof typeof stageNames] || stageName,
      status,
      progress: stageProgress,
      isCurrentStage,
      startTime: stageData?.startTime,
      endTime: stageData?.endTime,
      details: stageData?.details,
      steps: stageData?.steps || []
    };
  };

  return {
    getStageStatus,
    getStageDisplayInfo,
    journeyProgress: calculateJourneyProgress,
    normalizeStatus
  };
};