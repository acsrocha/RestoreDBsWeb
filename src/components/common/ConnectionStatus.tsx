// src/components/common/ConnectionStatus.tsx
import React, { useState, useEffect } from 'react';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        
        if (response.ok) {
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setStatus('disconnected');
      }
      
      setLastChecked(new Date());
    };

    // Verificar conexão imediatamente
    checkConnection();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className="connection-status checking">
        Verificando conexão com o servidor...
      </div>
    );
  }

  return (
    <div className={`connection-status ${status}`}>
      {status === 'connected' ? (
        <>✅ Conectado ao servidor</>
      ) : (
        <>❌ Sem conexão com o servidor</>
      )}
      {lastChecked && (
        <div className="last-checked">
          Última verificação: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;