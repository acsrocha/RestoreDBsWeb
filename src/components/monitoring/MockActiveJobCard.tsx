import React, { useState, useEffect } from 'react';
import ActiveJobCard from './ActiveJobCard';

const MockActiveJobCard: React.FC = () => {
  const [currentStage, setCurrentStage] = useState('download');
  const [overallProgress, setOverallProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [finalizationProgress, setFinalizationProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const resetDemo = () => {
    setCurrentStage('download');
    setOverallProgress(0);
    setDownloadProgress(0);
    setValidationProgress(0);
    setRestoreProgress(0);
    setFinalizationProgress(0);
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      if (currentStage === 'download') {
        if (downloadProgress < 100) {
          setDownloadProgress(prev => Math.min(100, prev + 2));
          setOverallProgress(prev => Math.min(25, prev + 0.5));
        } else {
          setTimeout(() => setCurrentStage('validation'), 1000);
        }
      } else if (currentStage === 'validation') {
        if (validationProgress < 100) {
          setValidationProgress(prev => Math.min(100, prev + 5));
          setOverallProgress(prev => Math.min(50, prev + 1.25));
        } else {
          setTimeout(() => setCurrentStage('restore'), 1000);
        }
      } else if (currentStage === 'restore') {
        if (restoreProgress < 100) {
          setRestoreProgress(prev => Math.min(100, prev + 1));
          setOverallProgress(prev => Math.min(75, prev + 0.25));
        } else {
          setTimeout(() => setCurrentStage('finalization'), 1000);
        }
      } else if (currentStage === 'finalization') {
        if (finalizationProgress < 100) {
          setFinalizationProgress(prev => Math.min(100, prev + 8));
          setOverallProgress(prev => Math.min(100, prev + 2));
        } else {
          setIsRunning(false);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentStage, downloadProgress, validationProgress, restoreProgress, finalizationProgress, isRunning]);

  const getStageStatus = (stage: string) => {
    const stages = ['download', 'validation', 'restore', 'finalization'];
    const currentIndex = stages.indexOf(currentStage);
    const stageIndex = stages.indexOf(stage);
    
    if (stageIndex < currentIndex) return 'complete';
    if (stageIndex === currentIndex) return 'processing';
    return 'pending';
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <button 
          onClick={resetDemo}
          style={{
            padding: '8px 16px',
            backgroundColor: '#01c38e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Reiniciar Demo
        </button>
        <span style={{ marginLeft: '16px', fontSize: '14px', color: '#64748b' }}>
          Estágio atual: <strong>{currentStage}</strong> | Progresso: <strong>{Math.floor(overallProgress)}%</strong>
        </span>
      </div>
      <ActiveJobCard
      fileId="mock-test-123"
      fileName="teste_backup_cliente.fbk"
      startedAt={new Date(Date.now() - 60000).toISOString()}
      currentStage={currentStage}
      overallProgress={overallProgress}
      downloadStage={{
        status: getStageStatus('download') as any,
        progress: downloadProgress,
        details: currentStage === 'download' ? 'Baixando do Google Drive...' : undefined,
        startTime: currentStage === 'download' || downloadProgress > 0 ? new Date(Date.now() - 30000).toISOString() : undefined,
        endTime: downloadProgress === 100 ? new Date().toISOString() : undefined,
        steps: currentStage === 'download' ? [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            message: `Download ${Math.floor(downloadProgress)}% concluído`,
            details: 'Velocidade: 2.5 MB/s'
          }
        ] : []
      }}
      validationStage={{
        status: getStageStatus('validation') as any,
        progress: validationProgress,
        details: currentStage === 'validation' ? 'Validando arquivo de backup...' : undefined,
        startTime: currentStage === 'validation' || validationProgress > 0 ? new Date(Date.now() - 20000).toISOString() : undefined,
        endTime: validationProgress === 100 ? new Date().toISOString() : undefined,
        steps: currentStage === 'validation' ? [
          {
            id: '2',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            message: 'Verificando integridade do arquivo',
            details: `Validação ${Math.floor(validationProgress)}% concluída`
          }
        ] : []
      }}
      restoreStage={{
        status: getStageStatus('restore') as any,
        progress: restoreProgress,
        details: currentStage === 'restore' ? 'Restaurando banco de dados...' : undefined,
        startTime: currentStage === 'restore' || restoreProgress > 0 ? new Date(Date.now() - 10000).toISOString() : undefined,
        endTime: restoreProgress === 100 ? new Date().toISOString() : undefined,
        steps: currentStage === 'restore' ? [
          {
            id: '3',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            message: 'Executando gbak',
            details: `Progresso: ${Math.floor(restoreProgress)}%`
          }
        ] : []
      }}
      finalizationStage={{
        status: getStageStatus('finalization') as any,
        progress: finalizationProgress,
        details: currentStage === 'finalization' ? 'Finalizando processo...' : undefined,
        startTime: currentStage === 'finalization' || finalizationProgress > 0 ? new Date(Date.now() - 5000).toISOString() : undefined,
        endTime: finalizationProgress === 100 ? new Date().toISOString() : undefined,
        steps: currentStage === 'finalization' ? [
          {
            id: '4',
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            message: 'Criando alias no Firebird',
            details: `Finalização ${Math.floor(finalizationProgress)}% concluída`
          }
        ] : []
      }}
    />
    </div>
  );
};

export default MockActiveJobCard;