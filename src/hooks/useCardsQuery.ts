// src/hooks/useCardsQuery.ts
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { Card } from '@/types/card.types';
import { calcularSLA } from '@/utils/helpers';

// Função auxiliar para criar objeto SLA com mais informações
function createSLAObject(dataCriacao: string) {
  const slaNumber = calcularSLA(dataCriacao);
  const hours = slaNumber * 24; // Converter dias para horas aproximadamente
  
  let formatted: string;
  if (slaNumber === 0) {
    formatted = 'Hoje';
  } else if (slaNumber === 1) {
    formatted = '1 dia';
  } else {
    formatted = `${slaNumber} dias`;
  }
  
  return {
    days: slaNumber,
    hours,
    formatted,
  };
}

// Query keys organizados
export const cardsQueryKeys = {
  all: ['cards'] as const,
  lists: () => [...cardsQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...cardsQueryKeys.lists(), filters] as const,
  details: () => [...cardsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardsQueryKeys.details(), id] as const,
};

// Função para buscar cards com filtros
async function fetchCards(filters: {
  search?: string;
  phase?: string;
  origin?: string;
  chofer?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (filters.search) {
    query = query.or(`placa.ilike.%${filters.search}%,driver.ilike.%${filters.search}%`);
  }
  
  if (filters.phase) {
    query = query.eq('phase', filters.phase);
  }
  
  if (filters.origin) {
    query = query.eq('origin', filters.origin);
  }
  
  if (filters.chofer) {
    query = query.eq('chofer', filters.chofer);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  // Adicionar SLA calculado
  return (data || []).map((card: any) => ({
    ...card,
    sla: createSLAObject(card.created_at),
  }));
}

// Hook principal para buscar cards
export function useCardsQuery(filters: {
  search?: string;
  phase?: string;
  origin?: string;
  chofer?: string;
} = {}) {
  return useQuery({
    queryKey: cardsQueryKeys.list(filters),
    queryFn: () => fetchCards(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 30, // Refetch a cada 30 segundos
    refetchIntervalInBackground: false,
  });
}

// Hook para um card específico
export function useCardQuery(cardId: string) {
  return useQuery({
    queryKey: cardsQueryKeys.detail(cardId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        sla: createSLAObject(data.created_at),
      };
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 5, // 5 minutos para card individual
  });
}

// Hook para estatísticas de cards
export function useCardsStats() {
  return useQuery({
    queryKey: [...cardsQueryKeys.all, 'stats'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cards')
        .select('phase, origin');
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        byPhase: {} as Record<string, number>,
        byOrigin: {} as Record<string, number>,
      };
      
      data.forEach((card: any) => {
        stats.byPhase[card.phase] = (stats.byPhase[card.phase] || 0) + 1;
        stats.byOrigin[card.origin] = (stats.byOrigin[card.origin] || 0) + 1;
      });
      
      return stats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Mutation para atualizar card
export function useUpdateCardMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: { id: string; updates: Partial<Card> }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cards')
        .update(variables.updates)
        .eq('id', variables.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedCard) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: cardsQueryKeys.lists() });
      
      // Atualizar cache do card específico
      queryClient.setQueryData(
        cardsQueryKeys.detail(updatedCard.id),
        {
          ...updatedCard,
          sla: createSLAObject(updatedCard.created_at),
        }
      );
    },
  });
}

// Hook para subscription em tempo real (complementa o cache)
export function useCardsSubscription() {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    const supabase = createClient();
    const subscription = supabase
      .channel('cards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
        },
        (payload) => {
          // Invalidar queries quando há mudanças
          queryClient.invalidateQueries({ queryKey: cardsQueryKeys.all });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
}
