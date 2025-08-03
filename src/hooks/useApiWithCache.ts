import { useState, useCallback, useEffect, useRef } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApiWithCache = <T>(
  fetchFunction: () => Promise<T>,
  interval: number = 3000,
  dependencies: any[] = []
) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });
  
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const isPollingRef = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Evitar requisições simultâneas
    if (isPollingRef.current && !forceRefresh) return;
    
    // Cache busting - evitar dados antigos
    const now = Date.now();
    if (!forceRefresh && now - lastFetchRef.current < 1000) return;
    
    isPollingRef.current = true;
    lastFetchRef.current = now;

    try {
      if (!isMountedRef.current) return;
      
      const data = await fetchFunction();
      
      if (!isMountedRef.current) return;
      
      setState(prev => ({
        data,
        loading: false,
        error: null
      }));
      
    } catch (error) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        data: forceRefresh ? null : prev.data, // Manter dados antigos se não for refresh forçado
        loading: false,
        error: errorMessage
      }));
    } finally {
      isPollingRef.current = false;
    }
  }, [fetchFunction, ...dependencies]);

  const forceRefresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetchData(true);
  }, [fetchData]);

  const clearData = useCallback(() => {
    setState({
      data: null,
      loading: true,
      error: null
    });
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (interval <= 0) return;
    
    const intervalId = setInterval(() => {
      if (!state.loading && !isPollingRef.current) {
        fetchData();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [fetchData, interval, state.loading]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    forceRefresh,
    clearData,
    isPolling: isPollingRef.current
  };
};