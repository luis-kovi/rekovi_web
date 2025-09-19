// src/components/providers/SuspenseProvider.tsx
'use client';

import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorState';
import { Loading, SkeletonKanbanCard } from '@/components/ui';

export interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  loadingType?: 'spinner' | 'skeleton' | 'custom';
  skeletonCount?: number;
}

function DefaultLoadingFallback({ 
  loadingType = 'spinner', 
  skeletonCount = 1 
}: { 
  loadingType?: 'spinner' | 'skeleton' | 'custom';
  skeletonCount?: number;
}) {
  if (loadingType === 'skeleton') {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonKanbanCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loading 
        variant="spinner" 
        size="lg" 
        message="Carregando componente..." 
      />
    </div>
  );
}

export function SuspenseWrapper({
  children,
  fallback,
  errorFallback,
  loadingType = 'spinner',
  skeletonCount = 1,
}: SuspenseWrapperProps) {
  const loadingFallback = fallback || (
    <DefaultLoadingFallback 
      loadingType={loadingType} 
      skeletonCount={skeletonCount} 
    />
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// HOC para componentes que precisam de Suspense
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<SuspenseWrapperProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => (
    <SuspenseWrapper {...options}>
      <Component {...props} />
    </SuspenseWrapper>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Componente para lazy loading condicional
export interface ConditionalLazyProps {
  condition: boolean;
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

export function ConditionalLazy({
  condition,
  loader,
  fallback,
  props = {},
}: ConditionalLazyProps) {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!condition) {
      setComponent(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    loader()
      .then((module) => {
        if (isMounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [condition, loader]);

  if (!condition) return null;
  if (loading) return fallback || <Loading variant="spinner" />;
  if (error) throw error;
  if (!Component) return null;

  return <Component {...props} />;
}
