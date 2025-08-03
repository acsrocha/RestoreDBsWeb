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
        'processing': ['processing', 'process', 'processando', 'restoring', 'finalizing'],
        'completed': ['completed', 'complete', 'concluído', 'success'],
        'failed': ['failed', 'error', 'falhou', 'erro']
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
    },
    { 
      stage: 'completed', 
      icon: FiCheckCircle, 
      label: 'Concluídos', 
      color: '#22c55e',
      items: getItemsByStage('completed')
    },
    { 
      stage: 'failed', 
      icon: FiAlertTriangle, 
      label: 'Falharam', 
      color: '#ef4444',
      items: getItemsByStage('failed')
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
                      {(() => {
                        const nextItem = items.find(item => item.queuePosition === 1);
                        if (nextItem) {
                          return (
                            <span className="queue-next">
                              Próximo: {nextItem.estimatedTime ? `~${nextItem.estimatedTime}` : nextItem.fileName.substring(0, 25) + '...'}
                            </span>
                          );
                        } else if (items.length > 0) {
                          return <span className="queue-next">Aguardando novos itens...</span>;
                        }
                        return null;
                      })()}
                    </div>
                    <div className="queue-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${(() => {
                              const activeItems = stats.processing + items.length;
                              return activeItems > 0 ? (stats.processing / activeItems) * 100 : 0;
                            })()}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                      <span className="progress-text">{Math.round((() => {
                        const activeItems = stats.processing + items.length;
                        return activeItems > 0 ? (stats.processing / activeItems) * 100 : 0;
                      })())}% da Fila</span>
                    </div>
                  </div>
                ) : stage === 'completed' || stage === 'failed' ? (
                  // Para jobs completos e falhados, mostrar resumo com últimos itens
                  <div className="completed-failed-summary">
                    <div className="summary-info">
                      <span className="summary-text">
                        {stage === 'completed' ? 'Concluídos' : 'Falharam'}: {items.length}
                      </span>
                      <span className="summary-time">
                        Último: {items.length > 0 ? new Date(Math.max(...items.map(i => new Date(i.updatedAt).getTime()))).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </span>
                    </div>
                    {items.slice(0, 3).map(item => (
                      <div key={item.trackingId} className={`pipeline-item ${stage}`}>
                        <div className="item-info">
                          <span className="item-name" title={item.fileName}>
                            {item.fileName.length > 20 ? `${item.fileName.substring(0, 20)}...` : item.fileName}
                          </span>
                          <span className="item-source">{item.source}</span>
                          {item.errorMessage && stage === 'failed' && (
                            <span className="error-indicator" title={item.errorMessage}>!</span>
                          )}
                        </div>
                        
                        <div className="item-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${Math.max(3, item.progress)}%`,
                                backgroundColor: color,
                                transition: 'width 0.3s ease'
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
                    {items.length > 3 && (
                      <div className="more-items">
                        +{items.length - 3} mais
                      </div>
                    )}
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
                              width: `${Math.max(3, item.progress)}%`,
                              backgroundColor: color,
                              transition: 'width 0.3s ease'
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