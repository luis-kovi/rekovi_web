// src/hooks/useResponsive.ts
import { useState, useEffect, useCallback } from 'react';

export interface BreakpointValues {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
  pixelRatio: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  aspectRatio: number;
  isWidescreen: boolean;
}

export interface UseResponsiveReturn extends BreakpointValues {
  // Estados principais
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: keyof BreakpointValues;
  
  // Informações do dispositivo
  device: DeviceInfo;
  viewport: ViewportInfo;
  
  // Funções utilitárias
  isBreakpointUp: (breakpoint: keyof BreakpointValues) => boolean;
  isBreakpointDown: (breakpoint: keyof BreakpointValues) => boolean;
  isBreakpointBetween: (min: keyof BreakpointValues, max: keyof BreakpointValues) => boolean;
  
  // Estados específicos
  showMobileNavigation: boolean;
  showSidebar: boolean;
  useCompactLayout: boolean;
  gridColumns: number;
}

const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive(): UseResponsiveReturn {
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [windowHeight, setWindowHeight] = useState<number>(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [touchDevice, setTouchDevice] = useState<boolean>(false);
  const [pixelRatio, setPixelRatio] = useState<number>(1);

  // Função otimizada para detectar mudanças
  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setWindowWidth(width);
    setWindowHeight(height);
    setOrientation(width > height ? 'landscape' : 'portrait');
    setPixelRatio(window.devicePixelRatio || 1);
  }, []);

  // Detectar se é touch device
  useEffect(() => {
    const isTouchDevice = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
    setTouchDevice(isTouchDevice);
  }, []);

  useEffect(() => {
    // Definir dimensões iniciais
    updateDimensions();

    // Debounced resize handler para performance
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 150);
    };

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions]);

  // Calcular breakpoints
  const breakpointValues: BreakpointValues = {
    xs: windowWidth >= breakpoints.xs,
    sm: windowWidth >= breakpoints.sm,
    md: windowWidth >= breakpoints.md,
    lg: windowWidth >= breakpoints.lg,
    xl: windowWidth >= breakpoints.xl,
    '2xl': windowWidth >= breakpoints['2xl'],
  };

  // Determinar o breakpoint atual
  let currentBreakpoint: keyof BreakpointValues = 'xs';
  if (windowWidth >= breakpoints['2xl']) currentBreakpoint = '2xl';
  else if (windowWidth >= breakpoints.xl) currentBreakpoint = 'xl';
  else if (windowWidth >= breakpoints.lg) currentBreakpoint = 'lg';
  else if (windowWidth >= breakpoints.md) currentBreakpoint = 'md';
  else if (windowWidth >= breakpoints.sm) currentBreakpoint = 'sm';

  // Determinar tipo de dispositivo
  const deviceType: DeviceInfo['type'] = 
    windowWidth < breakpoints.md ? 'mobile' :
    windowWidth < breakpoints.lg ? 'tablet' :
    windowWidth < breakpoints['2xl'] ? 'desktop' : 'large-desktop';

  // Informações do dispositivo
  const device: DeviceInfo = {
    type: deviceType,
    orientation,
    touchDevice,
    pixelRatio,
  };

  // Informações do viewport
  const viewport: ViewportInfo = {
    width: windowWidth,
    height: windowHeight,
    aspectRatio: windowWidth / windowHeight,
    isWidescreen: (windowWidth / windowHeight) >= 1.7,
  };

  // Funções utilitárias
  const isBreakpointUp = useCallback((breakpoint: keyof BreakpointValues) => {
    return windowWidth >= breakpoints[breakpoint];
  }, [windowWidth]);

  const isBreakpointDown = useCallback((breakpoint: keyof BreakpointValues) => {
    return windowWidth < breakpoints[breakpoint];
  }, [windowWidth]);

  const isBreakpointBetween = useCallback((
    min: keyof BreakpointValues, 
    max: keyof BreakpointValues
  ) => {
    return windowWidth >= breakpoints[min] && windowWidth < breakpoints[max];
  }, [windowWidth]);

  // Estados específicos para UI
  const showMobileNavigation = deviceType === 'mobile';
  const showSidebar = deviceType !== 'mobile' && windowWidth >= breakpoints.lg;
  const useCompactLayout = deviceType === 'mobile' || deviceType === 'tablet';
  
  // Número de colunas baseado no breakpoint
  const gridColumns = 
    windowWidth < breakpoints.sm ? 1 :
    windowWidth < breakpoints.md ? 2 :
    windowWidth < breakpoints.lg ? 3 :
    windowWidth < breakpoints.xl ? 4 : 6;

  return {
    ...breakpointValues,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isLargeDesktop: deviceType === 'large-desktop',
    currentBreakpoint,
    device,
    viewport,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
    showMobileNavigation,
    showSidebar,
    useCompactLayout,
    gridColumns,
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
