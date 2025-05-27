// src/App.tsx
import React, { useState, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import MonitoringPage from './pages/MonitoringPage'
import UploadPage from './pages/UploadPage'
import ProcessedDatabasesPage from './pages/ProcessedDatabasesPage'
import CreateClientDriveAreaPage from './pages/CreateClientDriveAreaPage'
// Importa a nova página de administração
import AdminClientAreasPage from './pages/AdminClientAreasPage' // Certifique-se de que o caminho está correto
import { ThemeProvider } from './contexts/ThemeContext'
import './styles/global.css'

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })

  const [currentViewTitle, setCurrentViewTitle] =
    useState<string>('Monitoramento')

  const toggleSidebar = () => {
    setSidebarCollapsed(prevState => {
      const newState = !prevState
      localStorage.setItem('sidebarCollapsed', String(newState))
      return newState
    })
  }

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true')
    }
  }, [])

  return (
    <ThemeProvider>
      <Router>
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
            <main className='content-area'>
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
                {/* ROTA ADICIONADA PARA A PÁGINA DE ADMINISTRAÇÃO */}
                <Route
                  path='/admin/client-areas'
                  element={<AdminClientAreasPage />}
                />
                {/* Futuramente, adicionar uma rota para Página Não Encontrada (404)
                 <Route path="*" element={<NotFoundPage />} /> */}
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App