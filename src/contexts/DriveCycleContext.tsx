// src/contexts/DriveCycleContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { fetchStatusData } from '../services/api';
import type { StatusData } from '../types/api';

// --- Interfaces e Constantes (sem alterações) ---
interface DriveCycleContextType {
  timeLeftSeconds: number;
  cycleDurationMinutes: number;
  displayMinutes: string;
  displaySeconds: string;
  progressPercent: number;
  isCycling: boolean;
  forceSync: () => void;
  lastSuccessfulSyncTime: string | null;
  isSyncing: boolean;
  syncError: string | null;
}

const DriveCycleContext = createContext<DriveCycleContextType | undefined>(
  undefined,
);

const DEFAULT_FALLBACK_INTERVAL_MINUTES = 15;
const PERIODIC_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const POST_CYCLE_SYNC_DELAY_MS = 1000;

const STORAGE_KEYS = {
  NEXT_RUN_EPOCH: 'driveNextRunEpoch',
  INTERVAL_MINUTES: 'driveIntervalMinutes',
};

interface DriveCycleProviderProps {
  children: React.ReactNode;
}


// --- Componente Provider Modificado ---
export const DriveCycleProvider: React.FC<DriveCycleProviderProps> = ({
  children,
}) => {

  // 1. MODIFICAÇÃO: O estado inicial agora tenta ler do sessionStorage.
  const getInitialState = () => {
    const storedEpoch = sessionStorage.getItem(STORAGE_KEYS.NEXT_RUN_EPOCH);
    const storedInterval = sessionStorage.getItem(STORAGE_KEYS.INTERVAL_MINUTES);
    const now = Math.floor(Date.now() / 1000);

    const duration = storedInterval ? parseInt(storedInterval, 10) : DEFAULT_FALLBACK_INTERVAL_MINUTES;
    let timeLeft = duration * 60;

    if (storedEpoch) {
      const epoch = parseInt(storedEpoch, 10);
      if (epoch > now) {
        timeLeft = epoch - now;
      } else {
        // O tempo já passou, força uma sincronização em breve.
        timeLeft = 1;
      }
    }
    
    return {
      initialTimeLeft: timeLeft,
      initialDuration: duration
    };
  };

  const { initialTimeLeft, initialDuration } = getInitialState();

  const [cycleDurationMinutes, setCycleDurationMinutes] = useState<number>(initialDuration);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(initialTimeLeft);
  const [isCycling, setIsCycling] = useState<boolean>(initialTimeLeft > 0);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSyncedRef = useRef(false);

  const syncWithBackend = useCallback(async (triggeredBy?: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const status: StatusData = await fetchStatusData();
      hasSyncedRef.current = true;
      const nowEpochSeconds = Math.floor(Date.now() / 1000);
      let newTimeLeft = DEFAULT_FALLBACK_INTERVAL_MINUTES * 60;
      let newCycleDuration = DEFAULT_FALLBACK_INTERVAL_MINUTES;

      if (
        typeof status.driveMonitorIntervalMinutes === 'number' &&
        status.driveMonitorIntervalMinutes > 0
      ) {
        newCycleDuration = status.driveMonitorIntervalMinutes;
      }

      setCycleDurationMinutes(newCycleDuration);

      if (status.driveMonitorNextRunEpoch && status.driveMonitorNextRunEpoch > 0) {
        const calculatedTimeLeft = status.driveMonitorNextRunEpoch - nowEpochSeconds;
        newTimeLeft = Math.max(0, calculatedTimeLeft);

        // 2. MODIFICAÇÃO: Salva o estado recebido do backend no sessionStorage.
        sessionStorage.setItem(STORAGE_KEYS.NEXT_RUN_EPOCH, String(status.driveMonitorNextRunEpoch));
        sessionStorage.setItem(STORAGE_KEYS.INTERVAL_MINUTES, String(newCycleDuration));

      } else {
         // Limpa o storage se o backend não retornar dados válidos
         sessionStorage.removeItem(STORAGE_KEYS.NEXT_RUN_EPOCH);
         sessionStorage.removeItem(STORAGE_KEYS.INTERVAL_MINUTES);
      }
      
      setTimeLeftSeconds(newTimeLeft);
      setIsCycling(newTimeLeft > 0);
      setLastSuccessfulSync(new Date());

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido ao sincronizar.';
      setSyncError(errMsg);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncFnRef = useRef(syncWithBackend);
  useEffect(() => {
    syncFnRef.current = syncWithBackend;
  }, [syncWithBackend]);

  useEffect(() => {
    // Se o estado foi recuperado do storage, não precisa sincronizar imediatamente.
    const storedEpoch = sessionStorage.getItem(STORAGE_KEYS.NEXT_RUN_EPOCH);
    if (!storedEpoch || !hasSyncedRef.current) {
        syncFnRef.current("initialMount");
    }

    const periodicSyncId = setInterval(() => {
      syncFnRef.current("periodicInterval");
    }, PERIODIC_SYNC_INTERVAL_MS);

    return () => clearInterval(periodicSyncId);
  }, []); // Dependência vazia para rodar apenas uma vez na montagem do provider.


  useEffect(() => {
    if (!isCycling || timeLeftSeconds <= 0) {
      if (isCycling && timeLeftSeconds <= 0) {
        setIsCycling(false);
        setTimeout(() => {
          syncFnRef.current("cycleEnd");
        }, POST_CYCLE_SYNC_DELAY_MS);
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeftSeconds((prevTime) => Math.max(0, prevTime - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeftSeconds, isCycling]);

  const forceSync = useCallback(() => {
     syncFnRef.current("forceSync");
  }, []);

  const value = useMemo(() => {
    const currentCycleDurationSeconds = cycleDurationMinutes * 60;
    const progressPercent =
      currentCycleDurationSeconds > 0 && timeLeftSeconds >= 0
        ? ((currentCycleDurationSeconds - timeLeftSeconds) / currentCycleDurationSeconds) * 100
        : timeLeftSeconds <= 0 ? 100 : 0;

    return {
        timeLeftSeconds,
        cycleDurationMinutes,
        displayMinutes: String(Math.floor(timeLeftSeconds / 60)).padStart(2, '0'),
        displaySeconds: String(timeLeftSeconds % 60).padStart(2, '0'),
        progressPercent: Math.min(100, Math.max(0, progressPercent)),
        isCycling: isCycling && timeLeftSeconds > 0,
        forceSync,
        lastSuccessfulSyncTime: lastSuccessfulSync
        ? lastSuccessfulSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : null,
        isSyncing,
        syncError,
        // instanceKey não é mais necessária para a lógica, mas podemos manter se algum componente depender dela para animações.
        // Se não, pode ser removida. Vou mantê-la por enquanto.
        instanceKey: 0 
    }
  }, [
      timeLeftSeconds, cycleDurationMinutes, isCycling, forceSync, 
      lastSuccessfulSync, isSyncing, syncError
  ]);

  return (
    <DriveCycleContext.Provider value={value}>
      {children}
    </DriveCycleContext.Provider>
  );
};

// Hook useDriveCycle (sem alterações)
export const useDriveCycle = (): DriveCycleContextType => {
  const context = useContext(DriveCycleContext);
  if (context === undefined) {
    throw new Error('useDriveCycle must be used within a DriveCycleProvider');
  }
  return context;
};