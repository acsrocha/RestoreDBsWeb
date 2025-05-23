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
import { ThemeProvider } from './contexts/ThemeContext'
import './styles/global.css'

const App: React.FC = () => {
  // Estado para controlar se o sidebar está colapsado ou não
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    // Tenta ler o estado inicial do localStorage
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })

  // Estado para armazenar o título da view atual (será atualizado pelo Sidebar)
  const [currentViewTitle, setCurrentViewTitle] =
    useState<string>('Monitoramento') // Valor inicial

  // Função para alternar o estado do sidebar e salvar no localStorage
  const toggleSidebar = () => {
    setSidebarCollapsed(prevState => {
      const newState = !prevState
      localStorage.setItem('sidebarCollapsed', String(newState))
      return newState
    })
  }

  // Efeito para garantir que o estado inicial do localStorage seja aplicado na montagem
  // (embora já esteja no useState inicial, isso garante sincronia se algo externo mudar)
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true')
    }
  }, [])

  return (
    // Provedor de Tema envolve toda a aplicação
    <ThemeProvider>
      {/* BrowserRouter para habilitar o roteamento */}
      <Router>
        <div className='app-layout'>
          {' '}
          {/* Classe principal do layout */}
          {/* Sidebar: recebe o estado colapsado e a função para atualizar o título */}
          <Sidebar
            collapsed={sidebarCollapsed}
            setCurrentViewTitle={setCurrentViewTitle}
          />
          {/* Wrapper para o conteúdo principal, ajusta a margem quando o sidebar colapsa */}
          <div
            className={`main-content-wrapper ${
              sidebarCollapsed ? 'sidebar-collapsed' : ''
            }`}
          >
            {/* Header: recebe a função para alternar o sidebar e o título atual */}
            <Header
              toggleSidebar={toggleSidebar}
              viewTitle={currentViewTitle}
            />

            {/* Área principal onde o conteúdo das páginas será renderizado */}
            <main className='content-area'>
              {/* Define as rotas da aplicação */}
              <Routes>
                {/* Rota padrão redireciona para /monitoramento */}
                <Route
                  path='/'
                  element={<Navigate to='/monitoramento' replace />}
                />
                {/* Rota para a página de Monitoramento */}
                <Route path='/monitoramento' element={<MonitoringPage />} />
                {/* Rota para a página de Upload */}
                <Route path='/upload' element={<UploadPage />} />
                {/* Rota para a página de Bancos Restaurados */}
                <Route
                  path='/bancos-restaurados'
                  element={<ProcessedDatabasesPage />}
                />
                {/* Futuramente, adicionar uma rota para Página Não Encontrada (404)
                 <Route path="*" element={<NotFoundPage />} /> */}
                <Route
                  path='/provisionar-pasta-cliente'
                  element={<CreateClientDriveAreaPage />}
                />
              </Routes>
            </main>

            {/* Rodapé da aplicação */}
            <Footer />
          </div>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
