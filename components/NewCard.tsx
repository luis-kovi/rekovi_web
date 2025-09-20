// components/NewCard.tsx
'use client'

import type { CardWithSLA } from '@/types'
import { formatPersonName, keepOriginalFormat } from '@/utils/helpers'

interface NewCardProps {
  card: CardWithSLA
}

export default function NewCard({ card }: NewCardProps) {
  const slaColor =
    card.slaText === 'Atrasado'
      ? 'bg-red-500'
      : card.slaText === 'Em Alerta'
      ? 'bg-yellow-500'
      : 'bg-green-500'

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out cursor-pointer p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{card.placa}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${slaColor}`}>
          {card.slaText}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <p className="font-semibold text-gray-700">Modelo</p>
          <p>{formatPersonName(card.modeloVeiculo)}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Driver</p>
          <p>{formatPersonName(card.nomeDriver)}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Chofer</p>
          <p>{card.faseAtual !== 'Fila de Recolha' ? formatPersonName(card.chofer) : '-'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Origem</p>
          <p>{keepOriginalFormat(card.origemLocacao)}</p>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>SLA: {card.sla}d</span>
        <span>{new Date(card.dataCriacao).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
