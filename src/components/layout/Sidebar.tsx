// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/firebird-logo.png';

// Importando ícones do Feather Icons e Simple Icons
import {
  FiBarChart2,
  FiUploadCloud,
  FiDatabase,
  FiMoon,
  FiSun,
  FiUsers // <<< NOVO ÍCONE ADICIONADO PARA GERENCIAMENTO
} from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si';

interface SidebarProps {
  collapsed: boolean;
  setCurrentViewTitle: (title: string) => void;
}

// Atualizando navItems com o novo ícone para "Área Cliente (Drive)" e o novo item de menu
const navItems = [
  { path: '/monitoramento', icon: <FiBarChart2 />, text: 'Monitoramento' },
  { path: '/upload', icon: <FiUploadCloud />, text: 'Enviar Backup' },
  { path: '/bancos-restaurados', icon: <FiDatabase />, text: 'Bancos Restaurados' },
  { path: '/provisionar-pasta-cliente', icon: <SiGoogledrive />, text: 'Criar Área Cliente' }, // Mantém o formulário de criação
  { path: '/admin/client-areas', icon: <FiUsers />, text: 'Gerenciar Áreas Cliente' }, // <<< NOVO ITEM DE MENU ADICIONADO
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCurrentViewTitle }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  React.useEffect(() => {
    const activeItem = navItems.find(item => item.path === location.pathname);
    if (activeItem) {
      setCurrentViewTitle(activeItem.text);
    } else {
      // Se a rota atual não está nos navItems (ex: rota inicial '/')
      // define um título padrão ou baseado na rota '/' se necessário.
      if (location.pathname === '/') {
        // Para a rota '/', redirecionamos para /monitoramento no App.tsx
        // então o título de Monitoramento deve ser pego.
        const defaultItem = navItems.find(item => item.path === '/monitoramento');
        if (defaultItem) {
          setCurrentViewTitle(defaultItem.text);
        } else {
          setCurrentViewTitle('RestoreDB'); // Fallback genérico
        }
      } else {
        // Para outras rotas não listadas (ex: uma futura página 404 ou sub-rotas não primárias)
        setCurrentViewTitle('RestoreDB'); // Ou um título mais específico se puder ser determinado
      }
    }
  }, [location.pathname, setCurrentViewTitle]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img src={logo} alt="Logo Firebird" className="logo-sidebar" />
        {!collapsed && <h2>RestoreDB</h2>}
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-text">{item.text}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className={`theme-switcher-sidebar ${collapsed ? 'collapsed-theme-switcher' : ''}`}>
        {!collapsed && <label htmlFor="themeToggleCheckbox">
          {theme === 'dark' ? <FiMoon style={{ marginRight: '8px', verticalAlign: 'middle' }} /> : <FiSun style={{ marginRight: '8px', verticalAlign: 'middle' }} />}
          Modo {theme === 'dark' ? 'Escuro' : 'Claro'}
        </label>}
        <input
          type="checkbox"
          id="themeToggleCheckbox" // O id era "themeToggle" no seu global.css para o switch estilizado, mudei para consistência com o label
          title="Alternar tema claro/escuro"
          checked={theme === 'dark'}
          onChange={toggleTheme}
          className="visually-hidden" // Esconde o checkbox padrão, o label estilizado fará o trabalho
        />
         {/* Se você tiver um switch customizado que usa o label, pode precisar ajustar o htmlFor e id */}
      </div>
    </aside>
  );
};

export default Sidebar;