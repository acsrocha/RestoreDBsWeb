// src/components/layout/Footer.tsx
import React, { useEffect, useState } from 'react';
import { useLastUpdated } from '../../contexts/LastUpdatedContext';

const Footer: React.FC = () => {
  const { lastUpdateTime } = useLastUpdated();
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
      <p>Interface atualizada pela última vez às: <time dateTime={lastUpdateTime?.toISOString() || new Date().toISOString()}>{displayTime}</time></p>
    </footer>
  );
};

export default Footer;