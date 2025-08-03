'use client'

import { useState, useEffect } from 'react'
import type { Card } from '@/types'

interface MobileFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onFilterChange: (phase: string | null) => void
  selectedPhase: string | null
  cards: Card[]
}

export default function MobileFilterPanel({
  isOpen,
  onClose,
  onFilterChange,
  selectedPhase,
  cards
}: MobileFilterPanelProps) {
  const [phases, setPhases] = useState<string[]>([])

  useEffect(() => {
    // Extrair fases únicas dos cards
    if (cards && Array.isArray(cards)) {
      const uniquePhases = [...new Set(cards.map(card => card.faseAtual))].sort()
      setPhases(uniquePhases)
    } else {
      setPhases([])
    }
  }, [cards])

  const handlePhaseSelect = (phase: string | null) => {
    onFilterChange(phase)
    onClose()
  }

  const handleClearFilters = () => {
    onFilterChange(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm mobile-modal-backdrop"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 mobile-modal-content mobile-shadow-lg ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Filtrar por Fase</h3>
          <p className="text-sm text-gray-500 mt-1">Selecione uma fase para filtrar as tarefas</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          <div className="p-6 space-y-3">
            
            {/* Todas as fases */}
            <button
              onClick={() => handlePhaseSelect(null)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedPhase === null
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Todas as Fases</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {cards?.length || 0} tarefa{(cards?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                {selectedPhase === null && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Fases individuais */}
            {phases.map((phase) => {
              const phaseCount = cards?.filter(card => card.faseAtual === phase).length || 0
              return (
                <button
                  key={phase}
                  onClick={() => handlePhaseSelect(phase)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedPhase === phase
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{phase}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {phaseCount} tarefa{phaseCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {selectedPhase === phase && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleClearFilters}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 active:scale-95"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>
  )
} 