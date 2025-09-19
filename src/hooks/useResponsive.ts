// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';

export interface BreakpointValues {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

export interface UseResponsiveReturn extends BreakpointValues {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: keyof BreakpointValues;
}

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive(): UseResponsiveReturn {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    // Função para atualizar o width da janela
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Definir o width inicial
    handleResize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpointValues: BreakpointValues = {
    sm: windowWidth >= breakpoints.sm,
    md: windowWidth >= breakpoints.md,
    lg: windowWidth >= breakpoints.lg,
    xl: windowWidth >= breakpoints.xl,
    '2xl': windowWidth >= breakpoints['2xl'],
  };

  // Determinar o breakpoint atual
  let currentBreakpoint: keyof BreakpointValues = 'sm';
  if (windowWidth >= breakpoints['2xl']) currentBreakpoint = '2xl';
  else if (windowWidth >= breakpoints.xl) currentBreakpoint = 'xl';
  else if (windowWidth >= breakpoints.lg) currentBreakpoint = 'lg';
  else if (windowWidth >= breakpoints.md) currentBreakpoint = 'md';

  return {
    ...breakpointValues,
    isMobile: windowWidth < breakpoints.md,
    isTablet: windowWidth >= breakpoints.md && windowWidth < breakpoints.lg,
    isDesktop: windowWidth >= breakpoints.lg && windowWidth < breakpoints['2xl'],
    isLargeDesktop: windowWidth >= breakpoints['2xl'],
    currentBreakpoint,
  };
}

// Hook para detectar se é mobile de forma simples
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

// Hook para usar breakpoints específicos
export function useBreakpoint(breakpoint: keyof BreakpointValues): boolean {
  const responsive = useResponsive();
  return responsive[breakpoint];
}
