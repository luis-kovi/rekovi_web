// components/MobileTaskCard.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { Card } from '@/types'

interface MobileTaskCardProps {
  card: Card
  phaseColor: string
  adaptedPhaseName: string
  onCardPress: () => void
  onSwipe: (cardId: string, direction: 'left' | 'right') => void
}

export default function MobileTaskCard({ card, phaseColor, adaptedPhaseName, onCardPress, onSwipe }: MobileTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [translateX, setTranslateX] = useState(0)
  const [startX, setStartX] = useState(0)
  const [startTime, setStartTime] = useState(0)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hoje'
    if (diffDays === 2) return 'Ontem'
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Função para obter ícone da fase
  const getPhaseIcon = (phase: string) => {
    const icons: { [key: string]: string } = {
      'Fila de Recolha': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'Aprovar Custo de Recolha': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'Tentativa 1 de Recolha': 'M13 10V3L4 14h7v7l9-11h-7z',
      'Tentativa 2 de Recolha': 'M13 10V3L4 14h7v7l9-11h-7z',
      'Tentativa 3 de Recolha': 'M13 10V3L4 14h7v7l9-11h-7z',
      'Desbloquear Veículo': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      'Solicitar Guincho': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',

      'Nova tentativa de recolha': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      'Confirmação de Entrega no Pátio': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    }
    return icons[phase] || 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  }

  // Gestos de touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setStartX(e.touches[0].clientX)
    setStartTime(Date.now())
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentX = e.touches[0].clientX
    const deltaX = currentX - startX
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)
    
    // Só permite swipe horizontal se o movimento vertical for pequeno
    if (deltaY < 50) {
      e.preventDefault()
      setTranslateX(deltaX)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const deltaX = translateX
    const deltaTime = Date.now() - startTime
    const velocity = Math.abs(deltaX) / deltaTime
    
    // Determinar se é um swipe válido
    if (Math.abs(deltaX) > 100 || velocity > 0.5) {
      if (deltaX > 0) {
        onSwipe(card.id, 'right')
      } else {
        onSwipe(card.id, 'left')
      }
    }
    
    // Reset
    setIsDragging(false)
    setTranslateX(0)
  }

  // Efeitos visuais de swipe
  const getSwipeBackground = () => {
    if (translateX > 0) {
      return 'bg-green-500' // Swipe direito - verde
    } else if (translateX < 0) {
      return 'bg-blue-500' // Swipe esquerdo - azul
    }
    return ''
  }

  const getSwipeIcon = () => {
    if (translateX > 0) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    } else if (translateX < 0) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    }
    return null
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background de swipe */}
      <div className={`absolute inset-0 flex items-center justify-center ${getSwipeBackground()} transition-all duration-200`}>
        {getSwipeIcon()}
      </div>
      
      {/* Card principal */}
      <div
        ref={cardRef}
        className={`relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mobile-card ${
          isDragging ? 'shadow-lg scale-[1.02] swiping' : ''
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onCardPress}
      >
        {/* Header do card */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
                         <div className="flex-1">
               <h3 className="font-semibold text-gray-900 text-base">{card.placa}</h3>
               {card.modeloVeiculo && (
                 <p className="text-xs text-gray-500">{card.modeloVeiculo}</p>
               )}
             </div>
            <div className="flex flex-col items-end">
              <div className={`h-8 px-3 rounded-full text-xs font-medium ${phaseColor} flex items-center justify-center whitespace-nowrap`}>
                {adaptedPhaseName}
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {formatDate(card.dataCriacao)}
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo do card */}
        <div className="px-4 py-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Cliente:</span>
              <span className="text-sm font-medium text-gray-900">{card.nomeDriver}</span>
            </div>
            
            {card.empresaResponsavel && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Empresa:</span>
                <span className="text-sm text-gray-900">{card.empresaResponsavel}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Chofer:</span>
              <span className="text-sm font-medium text-gray-900">
                {card.chofer ? card.chofer : <em>Pendente de alocação</em>}
              </span>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>ID: {card.id}</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Toque para detalhes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 