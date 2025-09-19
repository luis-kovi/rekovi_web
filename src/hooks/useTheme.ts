// src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Função para detectar preferência do sistema
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Função para aplicar o tema
  const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setResolvedTheme(newTheme);
  }, []);

  // Função para definir o tema
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      if (newTheme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', newTheme);
      }
    }

    // Aplicar o tema
    const actualTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    applyTheme(actualTheme);
  }, [getSystemTheme, applyTheme]);

  // Função para alternar entre light e dark
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, resolvedTheme, setTheme]);

  // Inicializar tema ao carregar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme || 'system';
    
    setThemeState(initialTheme);
    
    const actualTheme = initialTheme === 'system' ? getSystemTheme() : initialTheme;
    applyTheme(actualTheme);
  }, [getSystemTheme, applyTheme]);

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme, applyTheme]);

  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
  };
}
