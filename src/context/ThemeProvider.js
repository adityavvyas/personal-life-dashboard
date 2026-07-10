'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      const saved = localStorage.getItem('theme') || 'system';
      setTheme(saved);
    }, 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateDOM = (activeTheme) => {
      let isDark = false;
      if (activeTheme === 'system') {
        isDark = mediaQuery.matches;
      } else {
        isDark = activeTheme === 'dark';
      }
      
      const newResolved = isDark ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      document.documentElement.setAttribute('data-theme', newResolved);
    };

    updateDOM(theme);

    // Listen for OS theme changes if set to system
    const handler = (e) => {
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        document.documentElement.setAttribute('data-theme', newResolved);
      }
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, mounted]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
