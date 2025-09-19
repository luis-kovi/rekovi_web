// src/components/providers/QueryProvider.tsx
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuração otimizada do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 1000 * 60 * 5,
      // Manter cache por 10 minutos após ficar inativo
      gcTime: 1000 * 60 * 10,
      // Retry automático em caso de erro
      retry: (failureCount, error: any) => {
        // Não retry em erros 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Máximo 3 tentativas para outros erros
        return failureCount < 3;
      },
      // Refetch quando a janela recebe foco
      refetchOnWindowFocus: true,
      // Refetch quando a conexão é restaurada
      refetchOnReconnect: true,
      // Não refetch no mount se dados estão fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry automático para mutations
      retry: (failureCount, error: any) => {
        // Não retry em erros de validação (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}

// Hook para acessar o QueryClient
export function useQueryClient() {
  return queryClient;
}

// Utilitários para prefetch e invalidação
export const queryUtils = {
  // Prefetch de dados antes de navegar
  prefetchQuery: async (queryKey: string[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  },

  // Invalidar queries específicas
  invalidateQueries: (queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  },

  // Limpar cache específico
  removeQueries: (queryKey: string[]) => {
    queryClient.removeQueries({ queryKey });
  },

  // Setar dados no cache manualmente
  setQueryData: (queryKey: string[], data: any) => {
    queryClient.setQueryData(queryKey, data);
  },

  // Obter dados do cache
  getQueryData: (queryKey: string[]) => {
    return queryClient.getQueryData(queryKey);
  },

  // Prefetch múltiplas queries
  prefetchMultiple: async (queries: Array<{ key: string[]; fn: () => Promise<any> }>) => {
    await Promise.all(
      queries.map(({ key, fn }) =>
        queryClient.prefetchQuery({
          queryKey: key,
          queryFn: fn,
        })
      )
    );
  },
};
