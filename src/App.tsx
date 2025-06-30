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
import Footer from './components/layout/Footer';
import MonitoringPage from './pages/MonitoringPage';
import UploadPage from './pages/UploadPage';
import ProcessedDatabasesPage from './pages/ProcessedDatabasesPage';
import CreateClientDriveAreaPage from './pages/CreateClientDriveAreaPage';
import AdminClientAreasPage from './pages/AdminClientAreasPage';
import SystemMonitoringPage from './pages/SystemMonitoringPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import SkipLink from './components/common/SkipLink';
import { ThemeProvider } from './contexts/ThemeContext';

 

import './styles/global.css';
import './styles/components/ErrorBoundary.css';
import './styles/components/SkipLink.css';
import './styles/toast-custom.css';
import './styles/grid-views.css';

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
                  <Route path='/upload' element={<UploadPage />} />
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
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </Router>
        <Toaster />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;