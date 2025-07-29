import React, { useState, useEffect, useCallback } from 'react';
import { FiServer, FiHardDrive, FiDatabase, FiRefreshCw, FiZap, FiWifiOff } from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si';
import { fetchHealthData } from '../../services/api';
import { useInterval } from '../../hooks/useInterval';
import '../../styles/components/BackendDiagnostic.css';

const REFRESH_INTERVAL = 30000;

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
      setError(err.message || 'Erro ao buscar dados de diagnóstico');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnosticData();
  }, [fetchDiagnosticData]);

  useInterval(() => {
    fetchDiagnosticData();
  }, REFRESH_INTERVAL);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'healthy': return { className: 'status-healthy', text: 'Saudável' };
      case 'warning': return { className: 'status-warning', text: 'Atenção' };
      default: return { className: 'status-error', text: 'Erro' };
    }
  };

  const getConnectionStatusInfo = (status: string) => {
    switch (status) {
      case 'ok': return { className: 'status-healthy', text: 'Conectado' };
      case 'desabilitado': return { className: 'status-neutral', text: 'Desabilitado' };
      default: return { className: 'status-error', text: 'Falha' };
    }
  };
  
  if (error) {
    return (
      <div className="diagnostic-footer-bar error">
        <div className="diagnostic-items">
          <div className="diagnostic-item status-error">
            <FiWifiOff />
            <span>Erro ao conectar ao backend: {error}</span>
          </div>
        </div>
        <div className="diagnostic-actions">
          <button className="refresh-button" onClick={fetchDiagnosticData} disabled={isLoading}>
            <FiRefreshCw className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
      </div>
    );
  }
  
  if (isLoading && !healthData) {
     return (
      <div className="diagnostic-footer-bar loading">
         <div className="diagnostic-items">
            <div className="diagnostic-item">
               <FiZap />
               <span>Carregando diagnóstico do sistema...</span>
            </div>
         </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(healthData?.status || 'error');
  const firebirdStatus = getConnectionStatusInfo(healthData?.firebird_status || 'erro');
  const driveStatus = getConnectionStatusInfo(healthData?.gdrive_status || 'erro');
  const diskSpaceKey = Object.keys(healthData?.disk_space || {})[0];
  const diskSpaceValue = healthData?.disk_space?.[diskSpaceKey] || 'N/A';

  return (
    <footer className="diagnostic-footer-bar">
      <div className="diagnostic-items">
        <div className={`diagnostic-item ${statusInfo.className}`}>
          <FiServer />
          <span className="diagnostic-label">Status:</span>
          <span className="diagnostic-value">{statusInfo.text}</span>
        </div>
        <div className="diagnostic-item">
          <FiHardDrive />
          <span className="diagnostic-label">Disco:</span>
          <span className="diagnostic-value" title={diskSpaceKey}>{diskSpaceValue}</span>
        </div>
        <div className={`diagnostic-item ${firebirdStatus.className}`}>
          <FiDatabase />
          <span className="diagnostic-value">{firebirdStatus.text}</span>
        </div>
        <div className={`diagnostic-item ${driveStatus.className}`}>
          <SiGoogledrive />
          <span className="diagnostic-value">{driveStatus.text}</span>
        </div>
      </div>
      
      <div className="diagnostic-actions">
        <span className="last-updated">
          Atualizado: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
        </span>
        <button className="refresh-button" onClick={fetchDiagnosticData} disabled={isLoading}>
          <FiRefreshCw className={isLoading ? 'spinning' : ''} />
        </button>
      </div>
    </footer>
  );
};

export default BackendDiagnostic;