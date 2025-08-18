// components/CardModal/CardModalActions.tsx
import React from 'react'
import type { CardWithSLA } from '@/types'

interface CardModalActionsProps {
  card: CardWithSLA
  onShowChoferChange: () => void
  onShowAllocateDriver: () => void
  onShowRejectCollection: () => void
  onShowUnlockVehicle: () => void
  onShowRequestTowing: () => void
  onShowReportProblem: () => void
  onShowConfirmPatioDelivery: () => void
  onShowCarTowed: () => void
  onShowRequestTowMechanical: () => void
}

export default function CardModalActions({
  card,
  onShowChoferChange,
  onShowAllocateDriver,
  onShowRejectCollection,
  onShowUnlockVehicle,
  onShowRequestTowing,
  onShowReportProblem,
  onShowConfirmPatioDelivery,
  onShowCarTowed,
  onShowRequestTowMechanical
}: CardModalActionsProps) {
  // Função auxiliar para renderizar botões de ação
  const renderActionButton = (
    label: string,
    onClick: () => void,
    variant: 'primary' | 'secondary' | 'danger' = 'primary',
    disabled: boolean = false
  ) => {
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600",
      secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:hover:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600"
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Ações para a fase de criado */}
      {card.phase === 'criado' && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Ações Disponíveis</h3>
          {renderActionButton('Trocar Chofer', onShowChoferChange)}
        </div>
      )}

      {/* Ações para a fila de recolha */}
      {card.phase === 'fila_recolha' && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Ações da Fila de Recolha</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderActionButton('Alocar Chofer', onShowAllocateDriver)}
            {renderActionButton('Rejeitar Recolha', onShowRejectCollection, 'danger')}
          </div>
        </div>
      )}

      {/* Ações para tentativas de recolha */}
      {card.phase === 'tentativas_recolha' && !card.tentativa_recolha && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Registrar Tentativa de Recolha</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderActionButton('Veículo Desbloqueado', onShowUnlockVehicle)}
            {renderActionButton('Solicitar Guincho', onShowRequestTowing, 'secondary')}
            {renderActionButton('Reportar Problema', onShowReportProblem, 'danger')}
          </div>
        </div>
      )}

      {/* Ações para confirmação de recolha */}
      {card.phase === 'confirmacao_recolha' && !card.guincho_confirmado && !card.recusa_recolha && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Confirmar Status da Recolha</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderActionButton('Entregue no Pátio', onShowConfirmPatioDelivery)}
            {renderActionButton('Veículo no Guincho', onShowCarTowed, 'secondary')}
            {renderActionButton('Solicitar Assistência', onShowRequestTowMechanical, 'danger')}
          </div>
        </div>
      )}

      {/* Status para cards já processados */}
      {(card.phase === 'confirmacao_recolha' && card.recusa_recolha) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">
            Este card teve a recolha recusada
          </p>
        </div>
      )}

      {(card.phase === 'confirmacao_recolha' && card.guincho_confirmado) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            Veículo já foi recolhido e confirmado
          </p>
        </div>
      )}

      {card.phase === 'finalizacao_recolha' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">
            Este card está na fase de finalização
          </p>
        </div>
      )}
    </div>
  )
}