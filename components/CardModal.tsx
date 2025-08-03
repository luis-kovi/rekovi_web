// components/CardModal.tsx
'use client'

import type { CardWithSLA } from '@/types'; // Corrigido para importar de types.ts

interface CardModalProps {
  card: CardWithSLA | null;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: CardModalProps) {
  if (!card) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold">{card.placa}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <p><span className="font-semibold">Driver:</span> {card.nomeDriver}</p>
          <p><span className="font-semibold">Chofer:</span> {card.chofer}</p>
          <p><span className="font-semibold">Fase Atual:</span> {card.faseAtual}</p>
          <p><span className="font-semibold">SLA:</span> {card.sla} dias ({card.slaText})</p>
        </div>
      </div>
    </div>
  )
}