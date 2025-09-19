// src/components/ui/FocusManager/FocusManager.tsx
import React from 'react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export interface FocusManagerProps {
  children: React.ReactNode;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
  onEscape?: () => void;
  className?: string;
}

export function FocusManager({
  children,
  autoFocus = false,
  restoreFocus = true,
  trapFocus = false,
  onEscape,
  className,
}: FocusManagerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  const { focusTrap, updateFocusableElements } = useKeyboardNavigation(containerRef as React.RefObject<HTMLElement>, {
    trapFocus,
    onEscape,
  });

  // Salvar elemento com foco anterior e gerenciar auto focus
  React.useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    if (autoFocus) {
      // Pequeno delay para garantir que o DOM foi renderizado
      const timer = setTimeout(() => {
        focusTrap();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, restoreFocus, focusTrap]);

  // Restaurar foco quando o componente for desmontado
  React.useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  // Atualizar elementos focáveis quando children mudarem
  React.useEffect(() => {
    updateFocusableElements();
  }, [children, updateFocusableElements]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="group"
      tabIndex={trapFocus ? -1 : undefined}
    >
      {children}
    </div>
  );
}

// Hook para gerenciar foco em componentes específicos
export function useFocusManagement() {
  const [isFocused, setIsFocused] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  const focus = React.useCallback(() => {
    if (elementRef.current) {
      elementRef.current.focus();
      setIsFocused(true);
    }
  }, []);

  const blur = React.useCallback(() => {
    if (elementRef.current) {
      elementRef.current.blur();
      setIsFocused(false);
    }
  }, []);

  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
  }, []);

  return {
    ref: elementRef,
    isFocused,
    focus,
    blur,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
}

// Componente para criar áreas de foco específicas
export function FocusArea({
  children,
  label,
  role = 'region',
  className,
}: {
  children: React.ReactNode;
  label?: string;
  role?: string;
  className?: string;
}) {
  const areaId = React.useId();

  return (
    <section
      id={areaId}
      role={role}
      aria-label={label}
      className={className}
      tabIndex={-1}
    >
      {children}
    </section>
  );
}
