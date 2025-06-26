// src/pages/SystemMonitoringPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiActivity, 
  FiRefreshCw, 
  FiHardDrive, 
  FiAlertTriangle
} from 'react-icons/fi';
import { useInterval } from '../hooks/useInterval';
import { fetchHealthData, fetchSystemActivity } from '../services/api';
import SystemHealthCard from '../components/monitoring/SystemHealthCard';

interface HealthCheckData {
  status: string;
  timestamp: string;
  problems: string[];
  queue_size: number;
  current_processing: string;
  disk_space: Record<string, string>;
  firebird_status: string;
  gdrive_status: string;
}

interface SystemActivity {
  timestamp: string;
  message: string;
}

const SystemMonitoringPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthCheckData | null>(null);
  const [systemActivity, setSystemActivity] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchHealthDataLocal = async () => {
    try {
      const response = await fetchHealthData();
      console.log('Health data response:', response); // Debug log
      setHealthData(response);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao buscar dados de saúde:', error);
      // Set default data to show error state instead of loading
      setHealthData({
        status: 'error',
        timestamp: new Date().toISOString(),
        problems: [`Erro de conexão: ${error.message}`],
        queue_size: 0,
        current_processing: '',
        disk_space: {},
        firebird_status: 'erro',
        gdrive_status: 'erro'
      });
      setLastUpdated(new Date());
    }
  };

  const fetchSystemActivityLocal = async () => {
    try {
      const response = await fetchSystemActivity();
      setSystemActivity(response);
    } catch (error) {
      console.error('Erro ao buscar atividade do sistema:', error);
      setSystemActivity([`Erro ao carregar atividade: ${error.message}`]);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchHealthDataLocal(), fetchSystemActivityLocal()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  useInterval(() => {
    handleRefresh();
  }, 10000); // Atualiza a cada 10 segundos



  return (
    <div className="view active">
      {/* Header */}
      <div className="admin-areas-header">
        <h2>
          <FiActivity />
          Monitoramento do Sistema
        </h2>
        <div className="admin-areas-header-actions">
          <button
            className={`button-refresh ${isRefreshing ? 'spin-animation' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <FiRefreshCw />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button
            className="button-refresh"
            onClick={async () => {
              try {
                const response = await fetch('/api/health');
                const data = await response.json();
                console.log('Teste direto da API:', data);
                alert(`API funcionando! Status: ${data.status}`);
              } catch (error) {
                console.error('Erro no teste da API:', error);
                alert(`Erro na API: ${error.message}`);
              }
            }}
          >
            Testar API
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="grid-last-updated">
          Última atualização: {lastUpdated.toLocaleString('pt-BR')}
        </div>
      )}

      {/* Health Status Cards */}
      <SystemHealthCard healthData={healthData} />

      {/* Problems Section */}
      {healthData?.problems && healthData.problems.length > 0 && (
        <div className="list-card">
          <h2>
            <FiAlertTriangle />
            Problemas Detectados
          </h2>
          <ul>
            {healthData.problems.map((problem, index) => (
              <li key={index} className="error-summary">
                <span className="error-filename">{problem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disk Space Section */}
      {healthData?.disk_space && (
        <div className="list-card">
          <h2>
            <FiHardDrive />
            Espaço em Disco
          </h2>
          <ul>
            {Object.entries(healthData.disk_space).map(([path, space]) => (
              <li key={path}>
                <div className="error-summary">
                  <span className="error-filename">{path.split('\\').pop()}</span>
                  <span className="error-timestamp">{space}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* System Activity */}
      <div className="list-card">
        <h2>
          <FiActivity />
          Atividade do Sistema
        </h2>
        <ul>
          {systemActivity.length > 0 ? (
            systemActivity.map((activity, index) => (
              <li key={index} className="log-default">
                {activity}
              </li>
            ))
          ) : (
            <li className="empty-list">Nenhuma atividade do sistema registrada</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SystemMonitoringPage;