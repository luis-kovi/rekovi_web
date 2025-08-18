// components/KanbanBoard/PhaseColumn.tsx
import React from 'react'
import type { CardWithSLA } from '@/types'
import CardComponent from '../Card'
import { phaseDisplayNames, disabledPhases, disabledPhaseMessages } from '@/utils/helpers'

interface PhaseColumnProps {
  phase: string
  cards: CardWithSLA[]
  permissionType?: string
  onCardClick: (card: CardWithSLA) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, phase: string) => void
  scrollPositionRef?: React.MutableRefObject<{ [key: string]: number }>
}

export default function PhaseColumn({
  phase,
  cards,
  permissionType,
  onCardClick,
  onDragOver,
  onDrop,
  scrollPositionRef
}: PhaseColumnProps) {
  const isDisabled = disabledPhases.includes(phase)
  const disabledMessage = disabledPhaseMessages[phase]

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollPositionRef) {
      scrollPositionRef.current[phase] = e.currentTarget.scrollTop
    }
  }

  const getPhaseColorClass = (phase: string) => {
    switch (phase) {
      case 'criado':
        return 'bg-blue-50 border-blue-200'
      case 'fila_recolha':
        return 'bg-yellow-50 border-yellow-200'
      case 'tentativas_recolha':
        return 'bg-orange-50 border-orange-200'
      case 'confirmacao_recolha':
        return 'bg-green-50 border-green-200'
      case 'finalizacao_recolha':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getPhaseHeaderColorClass = (phase: string) => {
    switch (phase) {
      case 'criado':
        return 'bg-blue-100 text-blue-800'
      case 'fila_recolha':
        return 'bg-yellow-100 text-yellow-800'
      case 'tentativas_recolha':
        return 'bg-orange-100 text-orange-800'
      case 'confirmacao_recolha':
        return 'bg-green-100 text-green-800'
      case 'finalizacao_recolha':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className={`flex flex-col h-full border rounded-lg ${getPhaseColorClass(phase)} ${
        isDisabled ? 'opacity-50' : ''
      }`}
      onDragOver={isDisabled ? undefined : onDragOver}
      onDrop={isDisabled ? undefined : (e) => onDrop?.(e, phase)}
    >
      <div className={`px-4 py-3 font-semibold text-sm ${getPhaseHeaderColorClass(phase)} rounded-t-lg`}>
        <div className="flex justify-between items-center">
          <span>{phaseDisplayNames[phase]}</span>
          <span className="text-xs bg-white px-2 py-1 rounded-full">
            {cards.length}
          </span>
        </div>
      </div>
      <div 
        className="flex-1 overflow-y-auto p-2 space-y-2"
        onScroll={handleScroll}
        style={{ 
          scrollTop: scrollPositionRef?.current[phase] || 0,
          minHeight: '200px'
        }}
      >
        {isDisabled && disabledMessage ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-500 italic">{disabledMessage}</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Nenhum card</p>
          </div>
        ) : (
          cards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              permissionType={permissionType}
              onClick={() => onCardClick(card)}
              draggable={!isDisabled}
            />
          ))
        )}
      </div>
    </div>
  )
}