// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { LastUpdatedProvider } from './contexts/LastUpdatedContext.tsx';
import { DriveCycleProvider } from './contexts/DriveCycleContext.tsx';
import { FileMonitoringProvider } from './contexts/FileMonitoringContext.tsx';
import { GlobalRefreshProvider } from './contexts/GlobalRefreshContext.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalRefreshProvider>
        <DriveCycleProvider>
          <LastUpdatedProvider>
            <FileMonitoringProvider>
              <App />
            </FileMonitoringProvider>
          </LastUpdatedProvider>
        </DriveCycleProvider>
      </GlobalRefreshProvider>
    </React.StrictMode>
  );
} else {
  console.error(
    'Elemento root não encontrado no DOM. Verifique seu index.html.'
  );
}