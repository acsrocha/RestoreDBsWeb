/**
 * @deprecated This component was a temporary debugging solution
 * Proper error handling and state management should be used instead
 */
import React, { useState, useEffect } from 'react';

const DebugPanel: React.FC = () => {
  const [debugData, setDebugData] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);
  const [ghostDataDetected, setGhostDataDetected] = useState<string[]>([]);

  const checkForGhostData = async () => {
    try {
      // Mock data para evitar erros - este componente está deprecated
      const unifiedData = { stats: { processing: 0 }, activeJobs: [] };
      const statusData = { currentProcessing: '', queueCount: 0 };

      const issues: string[] = [];

      // Verificar inconsistências
      if (unifiedData.stats.processing > 0 && unifiedData.activeJobs.length === 0) {
        issues.push('Stats mostram processamento mas não há jobs ativos');
      }

      if (statusData.currentProcessing && statusData.currentProcessing !== '' && statusData.queueCount === 0) {
        issues.push(`currentProcessing: "${statusData.currentProcessing}" mas fila vazia`);
      }

      if (unifiedData.stats.processing !== statusData.queueCount) {
        issues.push(`Inconsistência: unified=${unifiedData.stats.processing}, status=${statusData.queueCount}`);
      }

      setGhostDataDetected(issues);
      setDebugData({
        unified: unifiedData,
        status: statusData,
        timestamp: new Date().toISOString(),
        issues
      });

    } catch (error) {
      console.error('Erro no debug:', error);
    }
  };

  useEffect(() => {
    // Verificar automaticamente a cada 10 segundos
    const interval = setInterval(checkForGhostData, 10000);
    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    // Limpar localStorage
    localStorage.clear();
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Forçar reload sem cache
    window.location.reload();
  };

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999
      }}>
        <button
          onClick={() => setIsVisible(true)}
          style={{
            padding: '8px',
            backgroundColor: ghostDataDetected.length > 0 ? '#ff4444' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🐛 Debug {ghostDataDetected.length > 0 && `(${ghostDataDetected.length})`}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '500px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      overflow: 'auto',
      fontSize: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>🐛 Debug Panel</h3>
        <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>

      {ghostDataDetected.length > 0 && (
        <div style={{ backgroundColor: '#ffebee', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
          <strong>🚨 Dados Fantasma Detectados:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
            {ghostDataDetected.map((issue, index) => (
              <li key={index} style={{ color: '#d32f2f' }}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <button onClick={checkForGhostData} style={{ marginRight: '8px', padding: '4px 8px', fontSize: '12px' }}>
          🔄 Verificar
        </button>
        <button onClick={clearCache} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          🧹 Limpar Cache
        </button>
      </div>

      {debugData.timestamp && (
        <div>
          <strong>Última verificação:</strong> {new Date(debugData.timestamp).toLocaleTimeString()}
          
          <details style={{ marginTop: '8px' }}>
            <summary style={{ cursor: 'pointer' }}>📊 Dados Unificados</summary>
            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
              {JSON.stringify(debugData.unified?.stats, null, 2)}
            </pre>
          </details>

          <details style={{ marginTop: '8px' }}>
            <summary style={{ cursor: 'pointer' }}>📈 Status</summary>
            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
              {JSON.stringify({
                currentProcessing: debugData.status?.currentProcessing,
                queueCount: debugData.status?.queueCount,
                queuedFiles: debugData.status?.queuedFiles
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;