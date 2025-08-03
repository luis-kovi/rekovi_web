// components/MobileTaskManager.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import type { Card } from '@/types'
import MobileTaskCard from './MobileTaskCard'
import MobileTaskModal from './MobileTaskModal'
import MobileFilterPanel from './MobileFilterPanel'

interface MobileTaskManagerProps {
  initialCards: Card[]
  permissionType: string
}

export default function MobileTaskManager({ initialCards, permissionType }: MobileTaskManagerProps) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [filteredCards, setFilteredCards] = useState<Card[]>(initialCards)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'phase'>('date')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullToRefreshY, setPullToRefreshY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  // Fases disponíveis para filtro
  const phases = [
    'Fila de Recolha',
    'Aprovar Custo de Recolha', 
    'Tentativa 1 de Recolha',
    'Tentativa 2 de Recolha',
    'Tentativa 3 de Recolha',
    'Desbloquear Veículo',
    'Solicitar Guincho',
    'Nova tentativa de recolha',
    'Confirmação de Entrega no Pátio'
  ]

  // Função para obter cor da fase
  const getPhaseColor = (phase: string) => {
    const colors: { [key: string]: string } = {
      'Fila de Recolha': 'bg-blue-100 text-blue-800',
      'Aprovar Custo de Recolha': 'bg-yellow-100 text-yellow-800',
      'Tentativa 1 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 2 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 3 de Recolha': 'bg-red-100 text-red-800',
      'Desbloquear Veículo': 'bg-purple-100 text-purple-800',
      'Solicitar Guincho': 'bg-indigo-100 text-indigo-800',
  
      'Nova tentativa de recolha': 'bg-green-100 text-green-800',
      'Confirmação de Entrega no Pátio': 'bg-green-100 text-green-800'
    }
    return colors[phase] || 'bg-gray-100 text-gray-800'
  }

  // Função para obter prioridade baseada na fase
  const getPriority = (phase: string) => {
    const priorities: { [key: string]: number } = {
      'Fila de Recolha': 1,
      'Aprovar Custo de Recolha': 2,
      'Tentativa 1 de Recolha': 3,
      'Tentativa 2 de Recolha': 4,
      'Tentativa 3 de Recolha': 5,
      'Desbloquear Veículo': 6,
      'Solicitar Guincho': 7,
  
      'Nova tentativa de recolha': 9,
      'Confirmação de Entrega no Pátio': 10
    }
    return priorities[phase] || 0
  }

  // Filtrar e ordenar cards
  useEffect(() => {
    let filtered = cards

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.nomeDriver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.faseAtual.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por fase
    if (selectedPhase !== 'all') {
      filtered = filtered.filter(card => card.faseAtual === selectedPhase)
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
        case 'priority':
          return getPriority(a.faseAtual) - getPriority(b.faseAtual)
        case 'phase':
          return a.faseAtual.localeCompare(b.faseAtual)
        default:
          return 0
      }
    })

    setFilteredCards(filtered)
  }, [cards, searchTerm, selectedPhase, sortBy])

  // Pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    
    const touchY = e.touches[0].clientY
    const deltaY = touchY - touchStartY.current
    
    if (deltaY > 0 && containerRef.current.scrollTop === 0) {
      e.preventDefault()
      setIsPulling(true)
      setPullToRefreshY(Math.min(deltaY * 0.5, 80))
    }
  }

  const handleTouchEnd = () => {
    if (isPulling && pullToRefreshY > 50) {
      // Trigger refresh
      setIsRefreshing(true)
      setTimeout(() => {
        setIsRefreshing(false)
        setCards([...initialCards]) // Simular refresh
      }, 1000)
    }
    
    setIsPulling(false)
    setPullToRefreshY(0)
  }

  // Função para adaptar nomes das fases para melhor legibilidade
  const adaptPhaseName = (phase: string) => {
    const adaptations: { [key: string]: string } = {
      'Tentativa 1 de Recolha': 'Tentativa 1',
      'Tentativa 2 de Recolha': 'Tentativa 2',
      'Tentativa 3 de Recolha': 'Tentativa 3',
      'Nova tentativa de recolha': 'Nova Tentativa',
      'Confirmação de Entrega no Pátio': 'Confirmação de Entrega'
    }
    return adaptations[phase] || phase
  }

  const [initialModalTab, setInitialModalTab] = useState<'details' | 'actions' | 'history'>('details')

  // Gestos de swipe
  const handleCardSwipe = (cardId: string, direction: 'left' | 'right') => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    setSelectedCard(card)
    
    // Definir a aba ativa baseada na direção do swipe
    if (direction === 'right') {
      // Swipe direito - abrir aba de detalhes
      setInitialModalTab('details')
    } else {
      // Swipe esquerdo - abrir aba de ações
      setInitialModalTab('actions')
    }
    
    setIsModalOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barra de Pesquisa */}
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

      {/* Controles de Filtro */}
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
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority' | 'phase')}
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
          >
            <option value="date">Mais Recentes</option>
            <option value="priority">Prioridade</option>
            <option value="phase">Fase</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{filteredCards.length}</span>
            <span>tarefas</span>
          </div>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
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

      {/* Lista de Tarefas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto mobile-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 py-2 space-y-3">
          {filteredCards.length === 0 ? (
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

      {/* Modal de Detalhes */}
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
        />
      )}

      {/* Painel de Filtros */}
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