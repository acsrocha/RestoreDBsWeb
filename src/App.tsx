// src/App.tsx
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BackendDiagnostic from './components/monitoring/BackendDiagnostic';
import MonitoringPage from './pages/MonitoringPage';
import DetailedMonitoringPage from './pages/DetailedMonitoringPage';
import UploadPage from './pages/UploadPage';
import RobustUploadPage from './pages/RobustUploadPage';
import ProcessedDatabasesPage from './pages/ProcessedDatabasesPage';
import CreateClientDriveAreaPage from './pages/CreateClientDriveAreaPage';
import AdminClientAreasPage from './pages/AdminClientAreasPage';
import SystemMonitoringPage from './pages/SystemMonitoringPage';
import ServerConfigPage from './pages/ServerConfigPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import SkipLink from './components/common/SkipLink';
import { ThemeProvider } from './contexts/ThemeContext';
import { UnifiedTrackingProvider } from './contexts/UnifiedTrackingContext';
// import { ServerProvider } from './contexts/ServerContext';

 

// Ordem correta: base → específicos
import './styles/theme.css';
import './styles/global.css';
import './styles/standardization.css';
import './styles/grid-views.css';
import './styles/toast-custom.css';
import './styles/components/ErrorBoundary.css';
import './styles/components/SkipLink.css';
import './styles/components/NotificationBanner.css';
import './styles/components/UploadProgress.css';
import './styles/components/DetailedMonitoring.css';
import './styles/components/HighlightCard.css';
import './styles/components/MonitoringCards.css';
import './components/common/LoadingSpinner.css';

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [currentViewTitle, setCurrentViewTitle] =
    useState<string>('Monitoramento');

  const toggleSidebar = () => {
    setSidebarCollapsed(prevState => {
      const newState = !prevState;
      localStorage.setItem('sidebarCollapsed', String(newState));
      return newState;
    });
  };

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  return (
    <ThemeProvider>
      <UnifiedTrackingProvider>
        <ErrorBoundary>
        <Router>
          <SkipLink targetId="main-content" />
          <div className='app-layout'>
            <Sidebar
              collapsed={sidebarCollapsed}
              setCurrentViewTitle={setCurrentViewTitle}
            />
            <div
              className={`main-content-wrapper ${
                sidebarCollapsed ? 'sidebar-collapsed' : ''
              }`}
            >
              <Header
                toggleSidebar={toggleSidebar}
                viewTitle={currentViewTitle}
              />
              <main 
                id="main-content" 
                className='content-area'
                tabIndex={-1}
                role="main"
                aria-label={currentViewTitle}
              >
                <Routes>
                  <Route
                    path='/'
                    element={<Navigate to='/monitoramento' replace />}
                  />
                  <Route path='/monitoramento' element={<MonitoringPage />} />
                  <Route path='/monitoramento-detalhado' element={<DetailedMonitoringPage />} />
                  <Route path='/upload' element={<UploadPage />} />
                  <Route path='/upload-robusto' element={<RobustUploadPage />} />
                  <Route
                    path='/bancos-restaurados'
                    element={<ProcessedDatabasesPage />}
                  />
                  <Route
                    path='/provisionar-pasta-cliente'
                    element={<CreateClientDriveAreaPage />}
                  />
                  <Route
                    path='/admin/client-areas'
                    element={<AdminClientAreasPage />}
                  />
                  <Route
                    path='/configuracoes/monitoramento-sistema'
                    element={<SystemMonitoringPage />}
                  />
                  <Route
                    path='/configuracoes/servidor'
                    element={<ServerConfigPage />}
                  />
                </Routes>
              </main>
              <BackendDiagnostic />
            </div>
          </div>
        </Router>
        <Toaster />
      </ErrorBoundary>
      </UnifiedTrackingProvider>
    </ThemeProvider>
  );
};

export default App;