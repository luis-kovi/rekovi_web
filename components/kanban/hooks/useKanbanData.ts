// components/kanban/hooks/useKanbanData.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import type { Card } from '@/types';
import { logger } from '@/utils/logger';
import { useEffect } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Function to fetch cards from Supabase
const fetchCards = async (permissionType?: string): Promise<Card[]> => {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const validPhases = [
    'Fila de Recolha',
    'Aprovar Custo de Recolha',
    'Tentativa 1 de Recolha',
    'Tentativa 2 de Recolha',
    'Tentativa 3 de Recolha',
    'Desbloquear Veículo',
    'Solicitar Guincho',
    'Tentativa 4 de Recolha',
    'Confirmação de Entrega no Pátio',
  ];

  let query = supabase
    .from('v_pipefy_cards_detalhada')
    .select(
      `
      card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
      phase_name, created_at, email_chofer, empresa_recolha,
      modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
      endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
      valor_recolha, custo_km_adicional, public_url
    `
    )
    .in('phase_name', validPhases);

    // Apply permission-based filtering
    if (permissionType === 'ativa' || permissionType === 'onsystem' || permissionType === 'rvs') {
        query = query.ilike('empresa_recolha', permissionType);
    } else if (permissionType === 'chofer') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            query = query.eq('email_chofer', user.email);
        }
    } else if (permissionType !== 'kovi' && permissionType !== 'admin') {
        // For other permission types, return no cards
        query = query.eq('card_id', 'impossivel');
    }

  const { data: cardsData, error } = await query;

  if (error) {
    logger.error('Error fetching cards:', error);
    throw new Error(error.message);
  }

  // Map data to Card type
  return (cardsData || []).map((card: any) => ({
    id: card.card_id,
    placa: card.placa_veiculo,
    nomeDriver: card.nome_driver,
    chofer: card.nome_chofer_recolha,
    faseAtual: card.phase_name,
    dataCriacao: card.created_at,
    emailChofer: card.email_chofer,
    empresaResponsavel: card.empresa_recolha,
    modeloVeiculo: card.modelo_veiculo,
    telefoneContato: card.telefone_contato,
    telefoneOpcional: card.telefone_opcional,
    emailCliente: card.email_cliente,
    enderecoCadastro: card.endereco_cadastro,
    enderecoRecolha: card.endereco_recolha,
    linkMapa: card.link_mapa,
    origemLocacao: card.origem_locacao,
    valorRecolha: card.valor_recolha,
    custoKmAdicional: card.custo_km_adicional,
    urlPublica: card.public_url,
  })).filter((card: Card) => card.id && card.placa);
};


export function useKanbanData(permissionType?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['cards', permissionType];

  const { data: cards, isLoading, isError } = useQuery<Card[]>({
    queryKey,
    queryFn: () => fetchCards(permissionType),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const handleRealtimeChange = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      logger.log('Realtime change received:', payload);

      const newRecord = payload.new as any;
      const oldRecord = payload.old as any;

      const mapToCard = (record: any): Card => ({
        id: record.card_id,
        placa: record.placa_veiculo,
        nomeDriver: record.nome_driver,
        chofer: record.nome_chofer_recolha,
        faseAtual: record.phase_name,
        dataCriacao: record.created_at,
        emailChofer: record.email_chofer,
        empresaResponsavel: record.empresa_recolha,
        modeloVeiculo: record.modelo_veiculo,
        telefoneContato: record.telefone_contato,
        telefoneOpcional: record.telefone_opcional,
        emailCliente: record.email_cliente,
        enderecoCadastro: record.endereco_cadastro,
        enderecoRecolha: record.endereco_recolha,
        linkMapa: record.link_mapa,
        origemLocacao: record.origem_locacao,
        valorRecolha: record.valor_recolha,
        custoKmAdicional: record.custo_km_adicional,
        urlPublica: record.public_url,
      });

      queryClient.setQueryData<Card[]>(queryKey, (currentData = []) => {
        if (payload.eventType === 'INSERT') {
          return [...currentData, mapToCard(newRecord)];
        }
        if (payload.eventType === 'UPDATE') {
          return currentData.map((card) =>
            card.id === newRecord.card_id ? mapToCard(newRecord) : card
          );
        }
        if (payload.eventType === 'DELETE') {
          return currentData.filter((card) => card.id !== oldRecord.card_id);
        }
        return currentData;
      });
    };

    const channel = supabase
      .channel('v_pipefy_cards_detalhada_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'v_pipefy_cards_detalhada',
        },
        handleRealtimeChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey]);

  return { cards: cards ?? [], isLoading, isError };
}
