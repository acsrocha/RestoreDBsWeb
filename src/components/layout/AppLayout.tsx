import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
// Seus estilos para AppLayout podem ir em AppLayout.module.css ou em global.css
// import styles from './AppLayout.module.css';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [viewTitle, setViewTitle] = useState('Monitoramento'); // Título inicial

    // Persistir estado do sidebar
    useEffect(() => {
        const storedState = localStorage.getItem('sidebarCollapsed');
        if (storedState) {
            setSidebarCollapsed(JSON.parse(storedState));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    // Estilos inline para margin-left são uma forma, mas classes CSS são mais limpas
    const mainContentStyle: React.CSSProperties = {
        marginLeft: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        // Outros estilos do .main-content-wrapper podem vir de global.css ou um .module.css
    };

    return (
        <div className="app-layout"> {/* Classe de global.css */}
            {/* CORREÇÃO APLICADA ABAIXO */}
            <Sidebar collapsed={sidebarCollapsed} setCurrentViewTitle={setViewTitle} />
            <div className="main-content-wrapper" style={mainContentStyle}> {/* Classe de global.css */}
                {/* CORREÇÃO APLICADA ABAIXO */}
                <Header
                    toggleSidebar={toggleSidebar}
                    viewTitle={viewTitle}
                />
                <main className="content-area"> {/* Classe de global.css */}
                    {children}
                </main>
                <footer className="content-footer"> {/* Classe de global.css */}
                    <p>Interface atualizada pela última vez às: <time id="lastUpdated">{new Date().toLocaleTimeString()}</time></p>
                    {/* O lastUpdated precisará ser atualizado via estado se for dinâmico */}
                </footer>
            </div>
        </div>
    );
};

export default AppLayout;