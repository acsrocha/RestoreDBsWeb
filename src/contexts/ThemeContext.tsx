import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      document.body.style.setProperty('--card-bg', '#ffffff');
      document.body.style.setProperty('--dark-card-bg', '#1a2234');
      document.body.style.setProperty('--text-primary', '#e2e8f0');
      document.body.style.setProperty('--text-secondary', '#a0aec0');
      document.body.style.setProperty('--bg-primary', '#111827');
      document.body.style.setProperty('--bg-secondary', '#1f2937');
      document.body.style.setProperty('--border-color', '#374151');
    } else {
      root.removeAttribute('data-theme');
      document.body.style.setProperty('--card-bg', '#ffffff');
      document.body.style.setProperty('--dark-card-bg', '#ffffff');
      document.body.style.setProperty('--text-primary', '#2d3748');
      document.body.style.setProperty('--text-secondary', '#4a5568');
      document.body.style.setProperty('--bg-primary', '#ffffff');
      document.body.style.setProperty('--bg-secondary', '#f7fafc');
      document.body.style.setProperty('--border-color', '#e2e8f0');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme: isDarkMode ? 'dark' : 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;