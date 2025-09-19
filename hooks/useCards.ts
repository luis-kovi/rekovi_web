// hooks/useCards.ts
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Card } from '@/types'
import type { CardRealtimePayload as RealtimePayload } from '@/types/supabase'
import { logger } from '@/utils/logger'

export function useCards(initialCards: Card[], permissionType?: string, onUpdateStatus?: (isUpdating: boolean) => void) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const scrollPositionRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const fetchUpdatedData = async () => {
      if (!isUpdating) {
        setIsUpdating(true)
        onUpdateStatus?.(true)
      }

      try {
        let query = supabase.from('v_pipefy_cards_detalhada').select(`
          card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
          phase_name, created_at, email_chofer, empresa_recolha,
          modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
          endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
          valor_recolha, custo_km_adicional, public_url
        `).limit(100000)

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
        ]

        query = query.in('phase_name', validPhases)

        if (permissionType === 'ativa' || permissionType === 'onsystem' || permissionType === 'rvs') {
          query = query.ilike('empresa_recolha', permissionType)
        } else if (permissionType === 'chofer') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email) {
            query = query.eq('email_chofer', user.email)
          }
        } else if (permissionType !== 'kovi' && permissionType !== 'admin') {
          query = query.eq('card_id', 'impossivel')
        }

        const { data: cardsData, error } = await query

        if (error) {
          logger.error('Erro ao buscar dados atualizados:', error)
          return
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
          })).filter((card: Card) => card.id && card.placa)

          if (containerRef.current) {
            scrollPositionRef.current = containerRef.current.scrollTop
          }

          setCards(updatedCards)
          logger.log('Dados atualizados via real-time:', updatedCards.length, 'cards')

          setTimeout(() => {
            if (containerRef.current && scrollPositionRef.current !== undefined) {
              containerRef.current.scrollTop = scrollPositionRef.current
            }
          }, 0)
        }
      } catch (error) {
        logger.error('Erro ao buscar dados atualizados:', error)
      } finally {
        setIsUpdating(false)
        onUpdateStatus?.(false)
        setIsLoading(false)
      }
    }

    const channel = supabase
      .channel('cards-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'v_pipefy_cards_detalhada'
        },
        (payload: RealtimePayload) => {
          logger.log('Mudança detectada no Supabase:', payload)
          fetchUpdatedData()
        }
      )
      .subscribe()

    fetchUpdatedData()

    return () => {
      channel.unsubscribe()
    }
  }, [permissionType, onUpdateStatus])


  return { cards, isLoading, isUpdating, containerRef, setCards }
}
