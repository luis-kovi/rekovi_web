// components/CardModal/forms/ConfirmCarTowedForm.tsx
import React from 'react'
import type { CardWithSLA } from '@/types'

interface ConfirmCarTowedFormProps {
  card: CardWithSLA
  onClose: () => void
  onSubmit: (cardId: string, photo: File, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>
}

export default function ConfirmCarTowedForm({ card, onClose, onSubmit }: ConfirmCarTowedFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Confirmar Veículo no Guincho</h3>
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