// src/components/ui/ErrorState/ErrorState.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Wifi, Server } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type ErrorType = 'generic' | 'network' | 'server' | 'notFound' | 'forbidden' | 'validation';

export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  className?: string;
  showIcon?: boolean;
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
      loading?: boolean;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  children?: React.ReactNode;
}

const errorConfig = {
  generic: {
    icon: AlertTriangle,
    title: 'Ops! Algo deu errado',
    message: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
    iconColor: 'text-danger-500',
  },
  network: {
    icon: Wifi,
    title: 'Problema de conexão',
    message: 'Verifique sua conexão com a internet e tente novamente.',
    iconColor: 'text-warning-500',
  },
  server: {
    icon: Server,
    title: 'Erro no servidor',
    message: 'Nossos servidores estão temporariamente indisponíveis.',
    iconColor: 'text-danger-500',
  },
  notFound: {
    icon: AlertTriangle,
    title: 'Página não encontrada',
    message: 'A página que você está procurando não existe ou foi movida.',
    iconColor: 'text-info-500',
  },
  forbidden: {
    icon: AlertTriangle,
    title: 'Acesso negado',
    message: 'Você não tem permissão para acessar este recurso.',
    iconColor: 'text-warning-500',
  },
  validation: {
    icon: Bug,
    title: 'Dados inválidos',
    message: 'Por favor, verifique os dados informados e tente novamente.',
    iconColor: 'text-warning-500',
  },
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  className,
  showIcon = true,
  actions,
  children,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 space-y-4',
        className
      )}
    >
      {showIcon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-current opacity-10 rounded-full blur-xl" />
          <Icon className={cn('h-16 w-16 relative', config.iconColor)} />
        </motion.div>
      )}

      <div className="space-y-2 max-w-md">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-gray-900 dark:text-gray-100"
        >
          {title || config.title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 dark:text-gray-400 leading-relaxed"
        >
          {message || config.message}
        </motion.p>
      </div>

      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      )}

      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          {actions.primary && (
            <Button
              onClick={actions.primary.onClick}
              disabled={actions.primary.loading}
              className="flex items-center gap-2"
            >
              {actions.primary.loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {actions.primary.label}
            </Button>
          )}

          {actions.secondary && (
            <Button
              variant="outline"
              onClick={actions.secondary.onClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {actions.secondary.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Componentes específicos para diferentes tipos de erro
export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorState
      type="notFound"
      title="404 - Página não encontrada"
      message="A página que você está procurando não existe ou foi removida."
      actions={{
        primary: {
          label: 'Voltar ao início',
          onClick: onGoHome || (() => window.location.href = '/'),
        },
      }}
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      type="network"
      actions={{
        primary: {
          label: 'Tentar novamente',
          onClick: onRetry || (() => window.location.reload()),
        },
      }}
    />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      type="server"
      actions={{
        primary: {
          label: 'Tentar novamente',
          onClick: onRetry || (() => window.location.reload()),
        },
      }}
    />
  );
}

// Error Boundary Component
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <ErrorState
          type="generic"
          title="Erro inesperado"
          message="Algo deu errado na aplicação. Tente recarregar a página."
          actions={{
            primary: {
              label: 'Tentar novamente',
              onClick: this.resetError,
            },
            secondary: {
              label: 'Recarregar página',
              onClick: () => window.location.reload(),
            },
          }}
        />
      );
    }

    return this.props.children;
  }
}
