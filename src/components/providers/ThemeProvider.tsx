// src/components/providers/ThemeProvider.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { useTheme, UseThemeReturn } from '@/hooks/useTheme';

const ThemeContext = createContext<UseThemeReturn | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeValue = useTheme();

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
