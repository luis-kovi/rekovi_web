// components/MobileTaskManager.tsx
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Card } from '@/types'
import MobileTaskCard from './MobileTaskCard'
import MobileTaskModal from './MobileTaskModal'
import MobileFilterPanel from './MobileFilterPanel'
import { logger } from '@/utils/logger'
import { useCards } from '@/hooks/useCards'

interface MobileTaskManagerProps {
  initialCards: Card[]
  permissionType: string
  onUpdateStatus?: (isUpdating: boolean) => void
}

export default function MobileTaskManager({ initialCards, permissionType, onUpdateStatus }: MobileTaskManagerProps) {
  const { cards, setCards, isLoading, isUpdating, containerRef } = useCards(initialCards, permissionType, onUpdateStatus)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullToRefreshY, setPullToRefreshY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  const handleRefresh = () => {
    // This is a placeholder for the refresh logic.
    // The useCards hook already handles real-time updates.
    // We can add a manual refresh function to the hook if needed.
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const touchY = e.touches[0].clientY;
    const pullDistance = touchY - touchStartY.current;
    if (pullDistance > 0) {
      setPullToRefreshY(pullDistance);
    }
  };

  const handleTouchEnd = () => {
    if (pullToRefreshY > 100) {
      handleRefresh();
    }
    setIsPulling(false);
    setPullToRefreshY(0);
  };

  const getPhaseColor = (phase: string) => {
    const colors: { [key: string]: string } = {
      'Fila de Recolha': 'bg-blue-100 text-blue-800',
      'Aprovar Custo de Recolha': 'bg-yellow-100 text-yellow-800',
      'Tentativa 1 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 2 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 3 de Recolha': 'bg-red-100 text-red-800',
      'Desbloquear Veículo': 'bg-purple-100 text-purple-800',
      'Solicitar Guincho': 'bg-indigo-100 text-indigo-800',
      'Tentativa 4 de Recolha': 'bg-green-100 text-green-800',
      'Confirmação de Entrega no Pátio': 'bg-green-100 text-green-800'
    }
    return colors[phase] || 'bg-gray-100 text-gray-800'
  }

  const filteredCards = useMemo(() => {
    let filtered = cards

    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.nomeDriver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.faseAtual.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedPhase !== 'all') {
      filtered = filtered.filter(card => card.faseAtual === selectedPhase)
    }

    const sorted = [...filtered].sort((a, b) => {
      const idA = parseInt(a.id, 10)
      const idB = parseInt(b.id, 10)
      return idA - idB
    })

    return sorted
  }, [cards, searchTerm, selectedPhase])

  const adaptPhaseName = (phase: string) => {
    const adaptations: { [key: string]: string } = {
      'Tentativa 1 de Recolha': 'Tentativa 1',
      'Tentativa 2 de Recolha': 'Tentativa 2',
      'Tentativa 3 de Recolha': 'Tentativa 3',
      'Tentativa 4 de Recolha': 'Tentativa 4',
      'Confirmação de Entrega no Pátio': 'Confirmação de Entrega'
    }
    return adaptations[phase] || phase
  }

  const [initialModalTab, setInitialModalTab] = useState<'details' | 'actions' | 'history'>('details')

  const handleCardSwipe = (cardId: string, direction: 'left' | 'right') => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    setSelectedCard(card)
    
    if (direction === 'right') {
      setInitialModalTab('details')
    } else {
      setInitialModalTab('actions')
    }
    
    setIsModalOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por placa, motorista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:border-transparent"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{filteredCards.length}</span>
            <span>tarefas</span>
          </div>
        </div>
      </div>

      {isPulling && (
        <div 
          className="flex items-center justify-center py-4 bg-blue-50 text-blue-600 text-sm"
          style={{ transform: `translateY(${pullToRefreshY}px)` }}
        >
          <svg className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'A atualizar...' : 'Puxe para atualizar'}
        </div>
      )}

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto mobile-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 py-2 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">A carregar tarefas...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
              <p className="text-sm">Tente ajustar os filtros de pesquisa</p>
            </div>
          ) : (
            filteredCards.map((card) => (
              <MobileTaskCard
                key={card.id}
                card={card}
                phaseColor={getPhaseColor(card.faseAtual)}
                adaptedPhaseName={adaptPhaseName(card.faseAtual)}
                onCardPress={() => {
                  setSelectedCard(card)
                  setIsModalOpen(true)
                }}
                onSwipe={handleCardSwipe}
              />
            ))
          )}
        </div>
      </div>

      {selectedCard && isModalOpen && (
        <MobileTaskModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCard(null)
          }}
          permissionType={permissionType}
          initialTab={initialModalTab}
          onAllocateDriver={async () => {}}
          onRejectCollection={async () => {}}
          onUnlockVehicle={async () => {}}
          onRequestTowing={async () => {}}
          onReportProblem={async () => {}}
          onConfirmPatioDelivery={async () => {}}
          onConfirmCarTowed={async () => {}}
          onRequestTowMechanical={async () => {}}
        />
      )}

      {isFilterOpen && (
        <MobileFilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onFilterChange={(phase) => setSelectedPhase(phase || 'all')}
          selectedPhase={selectedPhase === 'all' ? null : selectedPhase}
          cards={cards}
        />
      )}
    </div>
  )
} 