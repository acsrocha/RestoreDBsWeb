// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { LastUpdatedProvider } from './contexts/LastUpdatedContext.tsx';
import { DriveCycleProvider } from './contexts/DriveCycleContext.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <DriveCycleProvider> {/* ÚNICO DriveCycleProvider aqui, no topo */}
        <LastUpdatedProvider>
          <App />
        </LastUpdatedProvider>
      </DriveCycleProvider>
    </React.StrictMode>
  );
} else {
  console.error(
    'Elemento root não encontrado no DOM. Verifique seu index.html.'
  );
}