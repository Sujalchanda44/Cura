import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.setAttribute('name', 'theme-color');
    document.head.appendChild(themeMeta);
  }

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    root.style.backgroundColor = '#0D1109';
    root.style.color = '#F8FAFC';
    themeMeta.setAttribute('content', '#0D1109');
    if (body) {
      body.classList.add('dark');
      body.classList.remove('light');
      body.style.backgroundColor = '#0D1109';
      body.style.color = '#F8FAFC';
    }
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    root.style.backgroundColor = '#FBFDF8';
    root.style.color = '#0F172A';
    themeMeta.setAttribute('content', '#FBFDF8');
    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
      body.style.backgroundColor = '#FBFDF8';
      body.style.color = '#0F172A';
    }
  }

  // Dispatch custom event for any non-React listeners
  window.dispatchEvent(new CustomEvent('cura_theme_applied', { detail: { theme } }));
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('cura_theme');
      if (stored === 'dark' || stored === 'light') {
        applyThemeToDOM(stored);
        return stored;
      }
    } catch (e) {
      // Ignore localStorage read errors
    }
    applyThemeToDOM('light');
    return 'light';
  });

  useEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('cura_theme', theme);
    } catch (e) {
      // Ignore localStorage write errors
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cura_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        applyThemeToDOM(e.newValue);
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    applyThemeToDOM(nextTheme);
    try {
      localStorage.setItem('cura_theme', nextTheme);
    } catch (e) {
      // Ignore
    }
    setThemeState(nextTheme);
  };

  const setTheme = (newTheme: Theme) => {
    applyThemeToDOM(newTheme);
    try {
      localStorage.setItem('cura_theme', newTheme);
    } catch (e) {
      // Ignore
    }
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
