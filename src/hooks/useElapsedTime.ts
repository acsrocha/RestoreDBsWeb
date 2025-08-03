import { useMemo } from 'react';

export const useElapsedTime = (startedAt: string): string => {
  return useMemo(() => {
    if (!startedAt) {
      return 'N/A';
    }

    const startTime = new Date(startedAt).getTime();
    const now = new Date().getTime();
    const elapsed = now - startTime;

    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [startedAt]); // Agora só recalcula quando startedAt muda ou quando o componente pai re-renderiza
};