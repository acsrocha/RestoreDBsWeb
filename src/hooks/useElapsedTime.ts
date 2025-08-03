import { useState, useEffect } from 'react';

export const useElapsedTime = (startedAt: string): string => {
  const [elapsedTime, setElapsedTime] = useState('0s');

  useEffect(() => {
    if (!startedAt) {
      setElapsedTime('N/A');
      return;
    }

    const updateElapsedTime = () => {
      const startTime = new Date(startedAt).getTime();
      const now = new Date().getTime();
      const elapsed = now - startTime;

      const seconds = Math.floor((elapsed / 1000) % 60);
      const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
      const hours = Math.floor(elapsed / (1000 * 60 * 60));

      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setElapsedTime(`${minutes}m ${seconds}s`);
      } else {
        setElapsedTime(`${seconds}s`);
      }
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsedTime;
};