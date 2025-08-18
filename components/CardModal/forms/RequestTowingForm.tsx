// components/CardModal/forms/RequestTowingForm.tsx
import React from 'react'
import type { CardWithSLA } from '@/types'

interface RequestTowingFormProps {
  card: CardWithSLA
  onClose: () => void
  onSubmit: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>
}

export default function RequestTowingForm({ card, onClose, onSubmit }: RequestTowingFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Solicitar Guincho</h3>
      <p className="text-sm text-gray-600">Formulário em desenvolvimento</p>
      <button
        onClick={onClose}
        className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
      >
        Fechar
      </button>
    </div>
  )
}