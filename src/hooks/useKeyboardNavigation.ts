// src/hooks/useKeyboardNavigation.ts
import React from 'react';

interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  enableEscapeKey?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  trapFocus?: boolean;
}

export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) {
  const {
    enableArrowKeys = true,
    enableTabNavigation = true,
    enableEscapeKey = true,
    onEscape,
    onEnter,
    trapFocus = false,
  } = options;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [focusableElements, setFocusableElements] = React.useState<HTMLElement[]>([]);

  // Selecionar elementos focáveis
  const updateFocusableElements = React.useCallback(() => {
    if (!containerRef.current) return;

    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
      '[role="tab"]:not([disabled])',
    ].join(', ');

    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelector)
    ) as HTMLElement[];

    setFocusableElements(elements);
    return elements;
  }, [containerRef]);

  // Atualizar elementos focáveis quando o container muda
  React.useEffect(() => {
    updateFocusableElements();
  }, [updateFocusableElements]);

  // Gerenciar navegação por teclado
  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current || focusableElements.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          if (enableArrowKeys) {
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % focusableElements.length;
            setCurrentIndex(nextIndex);
            focusableElements[nextIndex]?.focus();
          }
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          if (enableArrowKeys) {
            event.preventDefault();
            const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
            setCurrentIndex(prevIndex);
            focusableElements[prevIndex]?.focus();
          }
          break;

        case 'Home':
          if (enableArrowKeys) {
            event.preventDefault();
            setCurrentIndex(0);
            focusableElements[0]?.focus();
          }
          break;

        case 'End':
          if (enableArrowKeys) {
            event.preventDefault();
            const lastIndex = focusableElements.length - 1;
            setCurrentIndex(lastIndex);
            focusableElements[lastIndex]?.focus();
          }
          break;

        case 'Tab':
          if (trapFocus) {
            event.preventDefault();
            const nextIndex = event.shiftKey
              ? currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
              : (currentIndex + 1) % focusableElements.length;
            setCurrentIndex(nextIndex);
            focusableElements[nextIndex]?.focus();
          }
          break;

        case 'Escape':
          if (enableEscapeKey && onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
        case ' ':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
      }
    },
    [
      containerRef,
      focusableElements,
      currentIndex,
      enableArrowKeys,
      enableEscapeKey,
      trapFocus,
      onEscape,
      onEnter,
    ]
  );

  // Adicionar event listeners
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, containerRef]);

  // Gerenciar foco quando o index muda
  const focusElement = React.useCallback(
    (index: number) => {
      if (focusableElements[index]) {
        setCurrentIndex(index);
        focusableElements[index].focus();
      }
    },
    [focusableElements]
  );

  // Focus trap para modais
  const focusTrap = React.useCallback(() => {
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      setCurrentIndex(0);
    }
  }, [focusableElements]);

  return {
    currentIndex,
    focusableElements,
    focusElement,
    focusTrap,
    updateFocusableElements,
  };
}
