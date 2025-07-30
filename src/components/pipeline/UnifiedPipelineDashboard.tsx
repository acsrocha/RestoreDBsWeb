import React from 'react';
import { usePipeline } from '../../contexts/PipelineContext';
import { FiDownload, FiPackage, FiCheckSquare, FiClock, FiCpu, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import './UnifiedPipelineDashboard.css';

const UnifiedPipelineDashboard: React.FC = () => {
  const { stats, items, getItemsByStage } = usePipeline();

  const stageConfig = [
    { 
      stage: 'DOWNLOADING', 
      icon: FiDownload, 
      label: 'Baixando', 
      color: '#3b82f6',
      items: getItemsByStage('DOWNLOADING')
    },
    { 
      stage: 'EXTRACTING', 
      icon: FiPackage, 
      label: 'Extraindo', 
      color: '#8b5cf6',
      items: getItemsByStage('EXTRACTING')
    },
    { 
      stage: 'VALIDATING', 
      icon: FiCheckSquare, 
      label: 'Validando', 
      color: '#06b6d4',
      items: getItemsByStage('VALIDATING')
    },
    { 
      stage: 'QUEUED', 
      icon: FiClock, 
      label: 'Na Fila', 
      color: '#f59e0b',
      items: getItemsByStage('QUEUED')
    },
    { 
      stage: 'PROCESSING', 
      icon: FiCpu, 
      label: 'Processando', 
      color: '#10b981',
      items: getItemsByStage('PROCESSING')
    }
  ];

  return (
    <div className="unified-pipeline-dashboard">
      <div className="pipeline-header">
        <h2>Pipeline de Processamento Unificado</h2>
        <div className="pipeline-summary">
          <span className="total-items">Total: {stats.total}</span>
          <span className="completed-items">
            <FiCheckCircle /> {stats.completed}
          </span>
          <span className="failed-items">
            <FiAlertTriangle /> {stats.failed}
          </span>
        </div>
      </div>

      <div className="pipeline-stages">
        {stageConfig.map(({ stage, icon: Icon, label, color, items }) => (
          <div key={stage} className="pipeline-stage" style={{ '--stage-color': color } as React.CSSProperties}>
            <div className="stage-header">
              <Icon className="stage-icon" />
              <span className="stage-label">{label}</span>
              <span className="stage-count">{items.length}</span>
            </div>
            
            {items.length > 0 && (
              <div className="stage-items">
                {items.map(item => (
                  <div key={item.trackingId} className="pipeline-item">
                    <div className="item-info">
                      <span className="item-name" title={item.fileName}>
                        {item.fileName.length > 20 ? `${item.fileName.substring(0, 20)}...` : item.fileName}
                      </span>
                      <span className="item-source">{item.source}</span>
                    </div>
                    
                    <div className="item-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${item.progress}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                      <span className="progress-text">{Math.round(item.progress)}%</span>
                    </div>
                    
                    <div className="item-time">
                      {new Date(item.updatedAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {items.length === 0 && (
              <div className="stage-empty">
                <span>Nenhum item</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Seção de Concluídos/Falhados */}
      {(stats.completed > 0 || stats.failed > 0) && (
        <div className="pipeline-completed">
          <h3>Recentemente Finalizados</h3>
          <div className="completed-grid">
            {getItemsByStage('COMPLETED').slice(0, 5).map(item => (
              <div key={item.trackingId} className="completed-item success">
                <FiCheckCircle />
                <span>{item.fileName}</span>
                <span className="completion-time">
                  {item.completedAt?.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
            
            {getItemsByStage('FAILED').slice(0, 5).map(item => (
              <div key={item.trackingId} className="completed-item error">
                <FiAlertTriangle />
                <span>{item.fileName}</span>
                <span className="error-message" title={item.errorMessage}>
                  {item.errorMessage?.substring(0, 30)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedPipelineDashboard;