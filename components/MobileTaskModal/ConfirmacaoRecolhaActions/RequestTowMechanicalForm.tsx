// components/MobileTaskModal/ConfirmacaoRecolhaActions/RequestTowMechanicalForm.tsx
'use client'

import type { Card } from '@/types'
import { useRequestTowMechanicalForm } from '@/hooks/useRequestTowMechanicalForm'

interface RequestTowMechanicalFormProps {
  card: Card;
  onRequestTowMechanical: (cardId: string, reason: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function RequestTowMechanicalForm({ card, onRequestTowMechanical, onClose, onBack }: RequestTowMechanicalFormProps) {
  const { reason, setReason, feedback, isUpdating, handleRequest } = useRequestTowMechanicalForm({ card, onRequestTowMechanical, onClose });

  return (
    <div className="space-y-4 bg-white rounded-xl p-4 border border-red-200">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-500"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
        <h3 className="text-lg font-bold text-gray-800">Solicitar Guincho (Mecânico)</h3>
      </div>
      <div>
        <label>Motivo *</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded"/>
      </div>
      {feedback && <p>{feedback}</p>}
      <button onClick={handleRequest} disabled={isUpdating} className="w-full bg-red-500 text-white p-3 rounded">
        {isUpdating ? 'Solicitando...' : 'Confirmar Solicitação'}
      </button>
    </div>
  )
}
