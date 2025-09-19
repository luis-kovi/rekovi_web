// src/hooks/useCards.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardWithSLA, CardFilters, SLAStatus } from '@/types/card.types';
import { PermissionType } from '@/types/user.types';
import { calcularSLA } from '@/utils/helpers';
import { logger } from '@/utils/logger';

export interface UseCardsOptions {
  permissionType?: PermissionType;
  onUpdateStatus?: (isUpdating: boolean) => void;
  realTimeEnabled?: boolean;
  refreshInterval?: number;
}

export interface UseCardsReturn {
  cards: Card[];
  filteredCards: CardWithSLA[];
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;
  filters: CardFilters;
  setFilters: (filters: Partial<CardFilters>) => void;
  refreshCards: () => Promise<void>;
  totalCount: number;
  statusCounts: {
    nosPrazo: number;
    emAlerta: number;
    atrasados: number;
  };
}

export function useCards(
  initialCards: Card[] = [],
  options: UseCardsOptions = {}
): UseCardsReturn {
  const {
    permissionType,
    onUpdateStatus,
    realTimeEnabled = true,
    refreshInterval = 10000
  } = options;

  const [cards, setCards] = useState<Card[]>(initialCards);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFiltersState] = useState<CardFilters>({
    searchTerm: '',
    slaFilter: 'all',
    phaseFilter: 'all',
    hideEmptyPhases: false
  });

  const setFilters = useCallback((newFilters: Partial<CardFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const fetchCards = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;

    try {
      setIsUpdating(true);
      onUpdateStatus?.(true);

      let query = supabase.from('v_pipefy_cards_detalhada').select(`
        card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
        phase_name, created_at, email_chofer, empresa_recolha,
        modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
        endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
        valor_recolha, custo_km_adicional, public_url
      `).limit(100000);

      // Filtrar apenas cards com fases válidas
      const validPhases = [
        'Fila de Recolha',
        'Aprovar Custo de Recolha', 
        'Tentativa 1 de Recolha',
        'Tentativa 2 de Recolha',
        'Tentativa 3 de Recolha',
        'Desbloquear Veículo',
        'Solicitar Guincho',
        'Tentativa 4 de Recolha',
        'Confirmação de Entrega no Pátio'
      ];
      
      query = query.in('phase_name', validPhases);
      
      // Aplicar filtros de permissão
      if (permissionType === 'ativa' || permissionType === 'onsystem' || permissionType === 'rvs') {
        query = query.ilike('empresa_recolha', permissionType);
      } else if (permissionType === 'chofer') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          query = query.eq('email_chofer', user.email);
        }
      } else if (permissionType !== 'kovi' && permissionType !== 'admin') {
        query = query.eq('card_id', 'impossivel');
      }

      const { data: cardsData, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }

      if (cardsData) {
        const updatedCards: Card[] = cardsData.map((card: any) => ({
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

        setCards(updatedCards);
        setError(null);
        logger.log('Cards atualizados:', updatedCards.length);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      logger.error('Erro ao buscar cards:', error);
    } finally {
      setIsUpdating(false);
      onUpdateStatus?.(false);
    }
  }, [permissionType, onUpdateStatus]);

  const refreshCards = useCallback(async () => {
    setIsLoading(true);
    await fetchCards();
    setIsLoading(false);
  }, [fetchCards]);

  // Filtrar e processar cards com SLA
  const filteredCards = useMemo((): CardWithSLA[] => {
    let filtered = cards;

    // Filtrar por permissão específica
    if (permissionType === 'chofer') {
      const hiddenPhasesForChofer = ['Fila de Recolha', 'Aprovar Custo de Recolha'];
      filtered = filtered.filter(card => !hiddenPhasesForChofer.includes(card.faseAtual));
    }

    // Aplicar SLA
    const cardsWithSLA = filtered.map(card => {
      const sla = calcularSLA(card.dataCriacao);
      let slaText: SLAStatus = 'No Prazo';
      if (sla >= 3) slaText = 'Atrasado'; 
      else if (sla === 2) slaText = 'Em Alerta';
      return { ...card, sla, slaText };
    });

    // Aplicar filtros
    let result = cardsWithSLA;

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      result = result.filter(card => 
        card.placa.toLowerCase().includes(search) ||
        card.nomeDriver.toLowerCase().includes(search) ||
        card.chofer.toLowerCase().includes(search)
      );
    }

    if (filters.slaFilter && filters.slaFilter !== 'all') {
      result = result.filter(card => card.slaText === filters.slaFilter);
    }

    if (filters.phaseFilter && filters.phaseFilter !== 'all') {
      result = result.filter(card => card.faseAtual === filters.phaseFilter);
    }

    return result;
  }, [cards, filters, permissionType]);

  // Estatísticas
  const statusCounts = useMemo(() => {
    const counts = { nosPrazo: 0, emAlerta: 0, atrasados: 0 };
    filteredCards.forEach(card => {
      switch (card.slaText) {
        case 'No Prazo':
          counts.nosPrazo++;
          break;
        case 'Em Alerta':
          counts.emAlerta++;
          break;
        case 'Atrasado':
          counts.atrasados++;
          break;
      }
    });
    return counts;
  }, [filteredCards]);

  // Setup real-time e interval
  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !realTimeEnabled) return;

    // Configurar real-time subscription
    const channel = supabase
      .channel('cards-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'v_pipefy_cards_detalhada'
        },
        () => {
          logger.log('Mudança detectada - atualizando cards');
          fetchCards();
        }
      )
      .subscribe();

    // Interval de fallback
    const intervalId = setInterval(fetchCards, refreshInterval);

    return () => {
      channel.unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchCards, realTimeEnabled, refreshInterval]);

  // Atualizar quando initialCards mudar
  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  return {
    cards,
    filteredCards,
    isLoading,
    isUpdating,
    error,
    filters,
    setFilters,
    refreshCards,
    totalCount: filteredCards.length,
    statusCounts
  };
}
