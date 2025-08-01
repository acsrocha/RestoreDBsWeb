import React from 'react';
import { useUnifiedTracking } from '../../contexts/UnifiedTrackingContext';
import { FiDownload, FiPackage, FiCheckSquare, FiClock, FiCpu, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import './UnifiedPipelineDashboard.css';

const UnifiedPipelineDashboard: React.FC = () => {
  const { stats, items } = useUnifiedTracking();

  const getItemsByStage = (stage: string) => {
    return items.filter(item => {
      const currentStage = item.currentStage?.toLowerCase() || '';
      const targetStage = stage.toLowerCase();
      
      // Mapeamento de estágios alternativos
      const stageMap: { [key: string]: string[] } = {
        'downloading': ['downloading', 'download', 'baixando'],
        'extracting': ['extracting', 'extract', 'extraindo', 'unzipping'],
        'validating': ['validating', 'validate', 'validation', 'validando'],
        'queued': ['queued', 'queue', 'fila', 'waiting'],
        'processing': ['processing', 'process', 'processando', 'restoring']
      };
      
      return stageMap[targetStage]?.includes(currentStage) || currentStage === targetStage;
    });
  };

  const stageConfig = [
    { 
      stage: 'downloading', 
      icon: FiDownload, 
      label: 'Baixando', 
      color: '#3b82f6',
      items: getItemsByStage('downloading')
    },
    { 
      stage: 'extracting', 
      icon: FiPackage, 
      label: 'Extraindo', 
      color: '#8b5cf6',
      items: getItemsByStage('extracting')
    },
    { 
      stage: 'validating', 
      icon: FiCheckSquare, 
      label: 'Validando', 
      color: '#06b6d4',
      items: getItemsByStage('validating')
    },
    { 
      stage: 'queued', 
      icon: FiClock, 
      label: 'Na Fila', 
      color: '#f59e0b',
      items: getItemsByStage('queued')
    },
    { 
      stage: 'processing', 
      icon: FiCpu, 
      label: 'Processando', 
      color: '#10b981',
      items: getItemsByStage('processing')
    }
  ];

  return (
    <div className="unified-pipeline-dashboard">
      <div className="pipeline-header">
        <h2>Pipeline de Processamento</h2>
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
                {stage === 'queued' ? (
                  // Para a fila, mostrar progresso geral
                  <div className="queue-summary">
                    <div className="queue-info">
                      <span className="queue-text">{items.length} arquivo{items.length > 1 ? 's' : ''} aguardando</span>
                      <span className="queue-next">
                        Próximo: {items.find(item => item.queuePosition === 1)?.fileName?.substring(0, 25) || 'N/A'}...
                      </span>
                    </div>
                    <div className="queue-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.max(10, 100 - (items.length * 10))}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                      <span className="progress-text">Fila: {items.length}</span>
                    </div>
                  </div>
                ) : (
                  // Para outros estágios, mostrar itens individuais
                  items.map(item => (
                    <div key={item.trackingId} className="pipeline-item">
                      <div className="item-info">
                        <span className="item-name" title={item.fileName}>
                          {item.fileName.length > 20 ? `${item.fileName.substring(0, 20)}...` : item.fileName}
                        </span>
                        <span className="item-source">{item.source}</span>
                        {item.queuePosition && (
                          <span className="queue-position">#{item.queuePosition}</span>
                        )}
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
                  ))
                )}
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


    </div>
  );
};

export default UnifiedPipelineDashboard;