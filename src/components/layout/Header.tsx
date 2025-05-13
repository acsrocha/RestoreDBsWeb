// src/components/layout/Header.tsx
import React from 'react';

interface HeaderProps {
  toggleSidebar: () => void;
  viewTitle: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, viewTitle }) => {
  return (
    <header className="main-header">
      <button id="sidebarToggleBtn" aria-label="Alternar menu lateral" title="Alternar menu lateral" onClick={toggleSidebar}>
        ☰
      </button>
      <h1 id="viewTitle">{viewTitle}</h1>
    </header>
  );
};

export default Header;