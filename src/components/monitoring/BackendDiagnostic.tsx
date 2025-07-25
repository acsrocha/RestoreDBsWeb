import React, { useState, useEffect, useCallback } from 'react';
import { FiServer, FiHardDrive, FiDatabase, FiRefreshCw } from 'react-icons/fi';
import { fetchHealthData } from '../../services/api';
import { useInterval } from '../../hooks/useInterval';
import '../../styles/components/BackendDiagnostic.css';

// Intervalo de atualização em milissegundos
const REFRESH_INTERVAL = 30000; // 30 segundos

const BackendDiagnostic: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDiagnosticData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchHealthData();
      setHealthData(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao buscar dados de diagnóstico:', err);
      setError(err.message || 'Erro ao buscar dados de diagnóstico');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchDiagnosticData();
  }, [fetchDiagnosticData]);

  // Configurar intervalo de atualização
  useInterval(() => {
    fetchDiagnosticData();
  }, REFRESH_INTERVAL);

  // Formatar o timestamp de última atualização
  const formattedLastUpdated = lastUpdated 
    ? lastUpdated.toLocaleTimeString() 
    : '--:--:--';

  return (
    <section className="diagnostic-section">
      <div className="diagnostic-header">
        <h2>
          <FiServer className="section-icon" />
          Diagnóstico do Sistema
        </h2>
        <div className="diagnostic-actions">
          <span className="last-updated">
            Atualizado: {formattedLastUpdated}
          </span>
          <button 
            className="refresh-button" 
            onClick={fetchDiagnosticData}
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? 'spinning' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {error ? (
        <div className="diagnostic-error">
          <p>Erro ao carregar dados de diagnóstico: {error}</p>
          <button onClick={fetchDiagnosticData} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      ) : isLoading && !healthData ? (
        <div className="diagnostic-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados de diagnóstico...</p>
        </div>
      ) : healthData ? (
        <div className="diagnostic-grid">
          {/* Status Geral */}
          <div className={`diagnostic-card status-${healthData.status}`}>
            <h3>Status Geral</h3>
            <div className="diagnostic-value">
              {healthData.status === 'healthy' ? 'Saudável' : 'Atenção'}
            </div>
            {healthData.problems && healthData.problems.length > 0 && (
              <div className="diagnostic-problems">
                <h4>Problemas Detectados:</h4>
                <ul>
                  {healthData.problems.map((problem: string, index: number) => (
                    <li key={index}>{problem}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Espaço em Disco */}
          <div className="diagnostic-card">
            <h3>
              <FiHardDrive className="card-icon" />
              Espaço em Disco
            </h3>
            {healthData.disk_space && (
              <div className="disk-space-grid">
                {Object.entries(healthData.disk_space).map(([dir, space]: [string, any]) => (
                  <div key={dir} className="disk-space-item">
                    <div className="disk-dir">{dir}</div>
                    <div className="disk-space">{space}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status do Firebird */}
          <div className="diagnostic-card">
            <h3>
              <FiDatabase className="card-icon" />
              Firebird
            </h3>
            <div className={`diagnostic-value status-${healthData.firebird_status === 'ok' ? 'healthy' : 'warning'}`}>
              {healthData.firebird_status === 'ok' ? 'Conectado' : 'Problema de Conexão'}
            </div>
            {healthData.firebird_status !== 'ok' && (
              <div className="diagnostic-detail error">
                {healthData.firebird_status}
              </div>
            )}
          </div>

          {/* Status do Google Drive */}
          <div className="diagnostic-card">
            <h3>
              <svg className="card-icon gdrive-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 14.5L8 5.5H16L12.5 14.5H4.5Z" fill="currentColor" />
                <path d="M12.5 14.5L16 5.5L19.5 14.5H12.5Z" fill="currentColor" />
                <path d="M4.5 14.5L8 18.5H19.5L16 14.5H4.5Z" fill="currentColor" />
              </svg>
              Google Drive
            </h3>
            <div className={`diagnostic-value status-${
              healthData.gdrive_status === 'ok' 
                ? 'healthy' 
                : healthData.gdrive_status === 'desabilitado' 
                  ? 'neutral' 
                  : 'warning'
            }`}>
              {healthData.gdrive_status === 'ok' 
                ? 'Conectado' 
                : healthData.gdrive_status === 'desabilitado' 
                  ? 'Desabilitado' 
                  : 'Problema de Conexão'}
            </div>
            {healthData.gdrive_status !== 'ok' && healthData.gdrive_status !== 'desabilitado' && (
              <div className="diagnostic-detail error">
                {healthData.gdrive_status}
              </div>
            )}
          </div>

          {/* Informações da Fila */}
          <div className="diagnostic-card">
            <h3>Fila de Processamento</h3>
            <div className="queue-info">
              <div className="queue-item">
                <span className="queue-label">Tamanho da Fila:</span>
                <span className="queue-value">{healthData.queue_size || 0}</span>
              </div>
              <div className="queue-item">
                <span className="queue-label">Em Processamento:</span>
                <span className="queue-value">
                  {healthData.current_processing 
                    ? healthData.current_processing.split(/[\\/]/).pop() 
                    : 'Nenhum'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="diagnostic-card timestamp-card">
            <h3>Timestamp do Servidor</h3>
            <div className="diagnostic-value">
              {healthData.timestamp 
                ? new Date(healthData.timestamp).toLocaleString() 
                : 'N/A'}
            </div>
          </div>
        </div>
      ) : (
        <div className="diagnostic-empty">
          <p>Nenhum dado de diagnóstico disponível.</p>
        </div>
      )}
    </section>
  );
};

export default BackendDiagnostic;