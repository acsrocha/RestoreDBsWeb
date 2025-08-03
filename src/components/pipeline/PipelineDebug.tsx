import React, { useEffect, useState } from 'react';
import { fetchUnifiedMonitoringData } from '../../services/unifiedMonitoringApi';

const PipelineDebug: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchUnifiedMonitoringData();
        setDebugData(data);
        console.log('PipelineDebug: Dados da API:', data);
      } catch (err: any) {
        setError(err.message);
        console.error('PipelineDebug: Erro:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div style={{ background: '#ffebee', padding: '10px', margin: '10px', border: '1px solid #f44336' }}>
        <h3>Erro na API:</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!debugData) {
    return <div>Carregando dados de debug...</div>;
  }

  return (
    <div style={{ background: '#f5f5f5', padding: '15px', margin: '10px', border: '1px solid #ccc' }}>
      <h3>Debug - Dados da API Unificada</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Stats:</strong>
        <pre>{JSON.stringify(debugData.stats, null, 2)}</pre>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Jobs Ativos ({debugData.activeJobs?.length || 0}):</strong>
        <pre>{JSON.stringify(debugData.activeJobs?.slice(0, 3) || [], null, 2)}</pre>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Jobs Concluídos ({debugData.recentlyCompleted?.length || 0}):</strong>
        <pre>{JSON.stringify(debugData.recentlyCompleted?.slice(0, 2) || [], null, 2)}</pre>
      </div>
      <div>
        <strong>Jobs Falhados ({debugData.recentlyFailed?.length || 0}):</strong>
        <pre>{JSON.stringify(debugData.recentlyFailed?.slice(0, 2) || [], null, 2)}</pre>
      </div>
    </div>
  );
};

export default PipelineDebug;