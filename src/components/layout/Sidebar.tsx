// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/firebird-logo.png';

// Importando ícones do Feather Icons
import { 
  FiBarChart2, 
  FiUploadCloud, 
  FiDatabase, 
  FiFolderPlus, // <<< NOVO ÍCONE ADICIONADO
  FiMoon, 
  FiSun 
} from 'react-icons/fi';

interface SidebarProps {
  collapsed: boolean;
  setCurrentViewTitle: (title: string) => void;
}

// Atualizando navItems com o novo item de menu
const navItems = [
  { path: '/monitoramento', icon: <FiBarChart2 />, text: 'Monitoramento' },
  { path: '/upload', icon: <FiUploadCloud />, text: 'Enviar Backup' },
  { path: '/bancos-restaurados', icon: <FiDatabase />, text: 'Bancos Restaurados' },
  // NOVO ITEM DE NAVEGAÇÃO:
  { path: '/provisionar-pasta-cliente', icon: <FiFolderPlus />, text: 'Área Cliente (Drive)' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCurrentViewTitle }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  React.useEffect(() => {
    const activeItem = navItems.find(item => item.path === location.pathname);
    if (activeItem) {
      setCurrentViewTitle(activeItem.text);
    } else {
      // Fallback para o título se a rota não estiver nos navItems principais
      // Poderia ser ajustado para outros casos, se necessário
      if (location.pathname === '/') { // Rota raiz que redireciona
        const defaultItem = navItems.find(item => item.path === '/monitoramento');
        if (defaultItem) {
          setCurrentViewTitle(defaultItem.text);
        } else {
          setCurrentViewTitle('RestoreDB'); // Um fallback genérico
        }
      } else {
         // Tenta encontrar um título para rotas que não estão no menu principal mas podem ter um título lógico
         // Por exemplo, se você tivesse uma página de "Detalhes do Usuário" acessada de outro lugar
         // Aqui, para rotas não mapeadas no navItems, você pode definir um título padrão ou deixar como está.
         // Para o novo item, como ele está em navItems, o título será definido corretamente.
        setCurrentViewTitle('RestoreDB'); // Ou um título mais apropriado para rotas não listadas
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