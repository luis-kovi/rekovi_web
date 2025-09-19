// src/hooks/useToast.ts
import { useState, useCallback } from 'react';
import { Toast, ToastType } from '@/components/ui/Toast/Toast';

export interface UseToastReturn {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => string;
  success: (title: string, message?: string, options?: Partial<Toast>) => string;
  error: (title: string, message?: string, options?: Partial<Toast>) => string;
  warning: (title: string, message?: string, options?: Partial<Toast>) => string;
  info: (title: string, message?: string, options?: Partial<Toast>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000, // 5 segundos por padrão
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, [generateId]);

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return toast({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [toast]);

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return toast({
      type: 'error',
      title,
      message,
      ...options,
    });
  }, [toast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return toast({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }, [toast]);

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return toast({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [toast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  };
}
