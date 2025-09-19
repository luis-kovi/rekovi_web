// src/hooks/useAccessibility.ts
import React from 'react';

interface AccessibilityOptions {
  announceChanges?: boolean;
  manageFocus?: boolean;
  reduceMotion?: boolean;
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceChanges = true,
    manageFocus = true,
    reduceMotion = false,
  } = options;

  // Detectar preferências de acessibilidade do usuário
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);
  const [screenReaderActive, setScreenReaderActive] = React.useState(false);

  // Detectar reduced motion
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detectar high contrast
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detectar screen reader (heurística)
  React.useEffect(() => {
    // Detectar se há elementos de screen reader ativos
    const hasScreenReader = 
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      window.speechSynthesis?.speaking ||
      !!document.querySelector('[aria-live]');

    setScreenReaderActive(hasScreenReader);
  }, []);

  // Função para anunciar mudanças para screen readers
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove após um tempo para não acumular elementos
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }, [announceChanges]);

  // Função para gerenciar foco
  const manageFocusForElement = React.useCallback((element: HTMLElement | null) => {
    if (!manageFocus || !element) return;

    // Salvar elemento com foco atual
    const previousActiveElement = document.activeElement as HTMLElement;

    // Focar no novo elemento
    element.focus();

    // Retornar função para restaurar foco
    return () => {
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [manageFocus]);

  // Skip links para navegação rápida
  const createSkipLink = React.useCallback((targetId: string, label: string) => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = label;
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary-600 focus:text-white focus:no-underline';
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return skipLink;
  }, []);

  // Gerar IDs únicos para acessibilidade
  const generateId = React.useCallback((prefix: string = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Verificar se um elemento está visível
  const isElementVisible = React.useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           rect.top >= 0 && rect.bottom <= window.innerHeight &&
           rect.left >= 0 && rect.right <= window.innerWidth;
  }, []);

  // Função para adicionar landmarks ARIA
  const addLandmark = React.useCallback((element: HTMLElement, role: string, label?: string) => {
    element.setAttribute('role', role);
    if (label) {
      element.setAttribute('aria-label', label);
    }
  }, []);

  return {
    // Estados de acessibilidade
    prefersReducedMotion: reduceMotion || prefersReducedMotion,
    highContrast,
    screenReaderActive,
    
    // Funções utilitárias
    announce,
    manageFocusForElement,
    createSkipLink,
    generateId,
    isElementVisible,
    addLandmark,
  };
}

// Hook para gerenciar ARIA attributes dinâmicos
export function useAriaAttributes() {
  const [attributes, setAttributes] = React.useState<Record<string, string>>({});

  const updateAttribute = React.useCallback((key: string, value: string) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeAttribute = React.useCallback((key: string) => {
    setAttributes(prev => {
      const newAttributes = { ...prev };
      delete newAttributes[key];
      return newAttributes;
    });
  }, []);

  const toggleAttribute = React.useCallback((key: string, trueValue: string, falseValue?: string) => {
    setAttributes(prev => ({
      ...prev,
      [key]: prev[key] === trueValue ? (falseValue || '') : trueValue
    }));
  }, []);

  return {
    attributes,
    updateAttribute,
    removeAttribute,
    toggleAttribute,
  };
}
