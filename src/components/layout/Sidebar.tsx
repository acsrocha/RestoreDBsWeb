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
  FiUsers,
  FiSettings,
  FiActivity,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si';

interface SidebarProps {
  collapsed: boolean;
  setCurrentViewTitle: (title: string) => void;
}

interface NavItem {
  path?: string;
  icon: React.ReactNode;
  text: string;
  submenu?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/monitoramento', icon: <FiBarChart2 />, text: 'Monitoramento' },
  { path: '/upload', icon: <FiUploadCloud />, text: 'Enviar Backup' },
  { path: '/bancos-restaurados', icon: <FiDatabase />, text: 'Bancos Restaurados' },
  { path: '/provisionar-pasta-cliente', icon: <SiGoogledrive />, text: 'Criar Área Cliente' },
  { path: '/admin/client-areas', icon: <FiUsers />, text: 'Gerenciar Áreas Cliente' },
  {
    icon: <FiSettings />,
    text: 'Configurações',
    submenu: [
      { path: '/configuracoes/monitoramento-sistema', icon: <FiActivity />, text: 'Monitoramento do Serviço' }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCurrentViewTitle }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = React.useState<string[]>([]);

  const findActiveItem = (items: NavItem[], path: string): NavItem | null => {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.submenu) {
        const found = findActiveItem(item.submenu, path);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleSubmenu = (text: string) => {
    setOpenSubmenus(prev => 
      prev.includes(text) 
        ? prev.filter(item => item !== text)
        : [...prev, text]
    );
  };

  React.useEffect(() => {
    const activeItem = findActiveItem(navItems, location.pathname);
    if (activeItem) {
      setCurrentViewTitle(activeItem.text);
    } else {
      if (location.pathname === '/') {
        const defaultItem = findActiveItem(navItems, '/monitoramento');
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
            <li key={item.path || item.text}>
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-text">{item.text}</span>}
                </NavLink>
              ) : (
                <>
                  <button
                    className={`nav-link submenu-toggle ${openSubmenus.includes(item.text) ? 'open' : ''}`}
                    onClick={() => toggleSubmenu(item.text)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="nav-text">{item.text}</span>
                        <span className="submenu-arrow">
                          {openSubmenus.includes(item.text) ? <FiChevronDown /> : <FiChevronRight />}
                        </span>
                      </>
                    )}
                  </button>
                  {item.submenu && openSubmenus.includes(item.text) && !collapsed && (
                    <ul className="submenu">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path!}
                            className={({ isActive }) => (isActive ? 'nav-link submenu-link active' : 'nav-link submenu-link')}
                          >
                            <span className="nav-icon">{subItem.icon}</span>
                            <span className="nav-text">{subItem.text}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
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