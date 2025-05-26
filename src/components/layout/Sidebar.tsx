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
  // FiFolderPlus, // Removido, pois será substituído pelo ícone do Google Drive
  FiMoon,
  FiSun
} from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si'; // <<< ÍCONE DO GOOGLE DRIVE ADICIONADO

interface SidebarProps {
  collapsed: boolean;
  setCurrentViewTitle: (title: string) => void;
}

// Atualizando navItems com o novo ícone para "Área Cliente (Drive)"
const navItems = [
  { path: '/monitoramento', icon: <FiBarChart2 />, text: 'Monitoramento' },
  { path: '/upload', icon: <FiUploadCloud />, text: 'Enviar Backup' },
  { path: '/bancos-restaurados', icon: <FiDatabase />, text: 'Bancos Restaurados' },
  { path: '/provisionar-pasta-cliente', icon: <SiGoogledrive />, text: 'Área Cliente (Drive)' }, // <<< ÍCONE ATUALIZADO AQUI
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCurrentViewTitle }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  React.useEffect(() => {
    const activeItem = navItems.find(item => item.path === location.pathname);
    if (activeItem) {
      setCurrentViewTitle(activeItem.text);
    } else {
      if (location.pathname === '/') {
        const defaultItem = navItems.find(item => item.path === '/monitoramento');
        if (defaultItem) {
          setCurrentViewTitle(defaultItem.text);
        } else {
          setCurrentViewTitle('RestoreDB');
        }
      } else {
        setCurrentViewTitle('RestoreDB');
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
                {/* A classe "nav-icon" já deve estar sendo aplicada pelo seu CSS global ao span */}
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
          id="themeToggleCheckbox"
          title="Alternar tema claro/escuro"
          checked={theme === 'dark'}
          onChange={toggleTheme}
        />
      </div>
    </aside>
  );
};

export default Sidebar;