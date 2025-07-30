// src/components/layout/Footer.tsx
import React, { useEffect, useState } from 'react';
import { useLastUpdated } from '../../contexts/LastUpdatedContext';
import { useDriveCycle } from '../../contexts/DriveCycleContext';
import { SiGoogledrive } from 'react-icons/si';

const Footer: React.FC = () => {
  const { lastUpdateTime } = useLastUpdated();
  const { isDriveConnected, lastSuccessfulSyncTime } = useDriveCycle();
  const [displayTime, setDisplayTime] = useState<string>('Nunca');

  useEffect(() => {
    if (lastUpdateTime) {
      setDisplayTime(lastUpdateTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    }
  }, [lastUpdateTime]);

  return (
    <footer className="content-footer">
      <div className="footer-status">
        <div className="drive-status">
          <SiGoogledrive className={`drive-icon ${isDriveConnected ? 'connected' : 'disconnected'} ${!isDriveConnected ? 'pulse' : ''}`} />
          <span className="drive-text">
            {isDriveConnected ? 'Conectado' : 'Desconectado'}
          </span>
          {lastSuccessfulSyncTime && (
            <span className="sync-time">Sync: {lastSuccessfulSyncTime}</span>
          )}
        </div>
        <div className="update-time">
          Atualizado às: <time dateTime={lastUpdateTime?.toISOString() || new Date().toISOString()}>{displayTime}</time>
        </div>
      </div>
    </footer>
  );
};

export default Footer;