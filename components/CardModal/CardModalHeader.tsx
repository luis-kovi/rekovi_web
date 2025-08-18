// components/CardModal/CardModalHeader.tsx
import React from 'react'
import type { CardWithSLA } from '@/types'
import { phaseDisplayNames } from '@/utils/helpers'

interface CardModalHeaderProps {
  card: CardWithSLA
  onClose: () => void
  copiedPlate: boolean
  onCopyPlate: () => void
}

export default function CardModalHeader({ card, onClose, copiedPlate, onCopyPlate }: CardModalHeaderProps) {
  const getSLAStatus = () => {
    const slaStatus = card.sla_status;
    const slaTime = card.sla_end_time;
    
    if (!slaTime) {
      return { message: 'SLA não definido', className: 'text-gray-500' };
    }

    if (slaStatus === 'critical' || slaStatus === 'missed') {
      return { message: 'SLA VENCIDO', className: 'text-red-600 font-bold animate-pulse' };
    } else if (slaStatus === 'warning') {
      return { message: 'SLA em alerta', className: 'text-orange-500 font-semibold' };
    }
    
    return { message: `SLA: ${slaTime}`, className: 'text-green-600' };
  };

  const slaInfo = getSLAStatus();

  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Detalhes do Card
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">
            Fase: {card.phase ? phaseDisplayNames[card.phase] : 'Não definida'}
          </span>
          <span className={`text-sm ${slaInfo.className}`}>
            {slaInfo.message}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCopyPlate}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Copiar placa"
        >
          {copiedPlate ? (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}