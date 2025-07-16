import React, { createContext, useContext, useState, useEffect } from 'react';

interface ServerContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  resetToDefault: () => void;
}

const DEFAULT_SERVER = 'http://localhost:8558';
const STORAGE_KEY = 'restoredb_server_url';

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrlState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_SERVER;
  });

  const setServerUrl = React.useCallback((url: string) => {
    const cleanUrl = url.replace(/\/$/, '');
    setServerUrlState(cleanUrl);
    localStorage.setItem(STORAGE_KEY, cleanUrl);
  }, []);

  const resetToDefault = React.useCallback(() => {
    setServerUrlState(DEFAULT_SERVER);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = React.useMemo(() => ({
    serverUrl,
    setServerUrl,
    resetToDefault
  }), [serverUrl, setServerUrl, resetToDefault]);

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};