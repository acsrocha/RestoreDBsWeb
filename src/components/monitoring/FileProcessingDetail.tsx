// src/components/monitoring/FileProcessingDetail.tsx
import React, { useState } from 'react';
import { 
  FiFile, FiChevronDown, FiChevronRight, FiClock, 
  FiCheckCircle, FiAlertCircle, FiLoader, FiInfo 
} from 'react-icons/fi';
import type { FileProcessingDetail as FileProcessingDetailType, FileProcessingStage, FileProcessingStep } from '../../types/fileMonitoring';

import '../../styles/components/FileProcessingDetail.css';

interface FileProcessingDetailProps {
  file: FileProcessingDetailType;
}

const formatDuration = (ms?: number): string => {
  if (typeof ms !== 'number') return '--';
  
  if (ms < 1000) return `${ms}ms`; // Mostra milissegundos
  
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`; // Segundos com uma casa decimal
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <FiCheckCircle className="status-icon completed" />;
    case 'failed':
      return <FiAlertCircle className="status-icon failed" />;
    case 'in_progress':
      return <FiLoader className="status-icon in-progress" />;
    case 'pending':
      return <FiClock className="status-icon pending" />;
    default:
      return <FiInfo className="status-icon" />;
  }
};

const FileProcessingDetail: React.FC<FileProcessingDetailProps> = ({ file }) => {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const toggleSteps = (stageId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const renderStep = (step: FileProcessingStep) => (
    <div key={step.id} className={`file-processing-step status-${step.status}`}>
      <div className="step-header">
        {getStatusIcon(step.status)}
        <span className="step-timestamp">{step.timestamp}</span>
        <span className="step-message">{step.message}</span>
        {step.duration && <span className="step-duration">{formatDuration(step.duration)}</span>}
      </div>
      {step.details && (
        <div className="step-details">
          <pre><code>{step.details}</code></pre>
        </div>
      )}
    </div>
  );

  const renderStage = (stage: FileProcessingStage) => {
    const isExpanded = expandedStages[stage.id] || false;
    const areStepsExpanded = expandedSteps[stage.id] || false;
    
    return (
      <div key={stage.id} className={`file-processing-stage status-${stage.status}`}>
        <div className="stage-header" onClick={() => toggleStage(stage.id)}>
          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          {getStatusIcon(stage.status)}
          <span className="stage-name">{stage.name}</span>
          <div className="stage-progress-container">
            <div 
              className="stage-progress-bar" 
              style={{ width: `${stage.progress}%` }}
              aria-valuenow={stage.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="stage-progress-text">{stage.progress}%</span>
        </div>
        
        <div className={`stage-content ${isExpanded ? 'expanded' : ''}`} style={{ maxHeight: isExpanded ? '1000px' : '0', padding: isExpanded ? '12px' : '0' }}>
          <div className="stage-info">
            <p className="stage-description">{stage.description}</p>
            {stage.startTime && (
              <p className="stage-time">
                <span>Início: {stage.startTime}</span>
                {stage.endTime && <span> | Fim: {stage.endTime}</span>}
              </p>
            )}
          </div>
          
          {stage.steps.length > 0 && (
            <div className="stage-steps">
              <div className="steps-header" onClick={() => toggleSteps(stage.id)}>
                {areStepsExpanded ? <FiChevronDown /> : <FiChevronRight />}
                <span>Detalhes ({stage.steps.length})</span>
              </div>
              
              <div className="steps-list" style={{ maxHeight: areStepsExpanded ? '1000px' : '0' }}>
                {stage.steps.map(renderStep)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="file-processing-detail">
      <div className="file-header">
        <FiFile className="file-icon" />
        <h3 className="file-name" title={file.originalPath}>{file.fileName}</h3>
        <div className="file-progress-container">
          <div 
            className="file-progress-bar" 
            style={{ width: `${file.overallProgress}%` }}
            aria-valuenow={file.overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className="file-progress-text">{file.overallProgress}%</span>
      </div>
      
      <div className="file-info">
        <div className="file-metadata">
          <span>Origem: {file.sourceType === 'upload' ? 'Upload' : file.sourceType === 'google_drive' ? 'Google Drive' : 'Local'}</span>
          <span>Criado em: {file.createdAt}</span>
          {file.startedAt && <span>Iniciado em: {file.startedAt}</span>}
          {file.completedAt && <span>Concluído em: {file.completedAt}</span>}
        </div>
        
        {file.error && (
          <div className="file-error">
            <FiAlertCircle className="error-icon" />
            <span>{file.error}</span>
          </div>
        )}
      </div>
      
      <div className="file-stages">
        {file.stages.map(renderStage)}
      </div>
    </div>
  );
};

export default FileProcessingDetail;