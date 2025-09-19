// components/MobileTaskModal/FilaRecolhaActions/RejectCollectionForm.tsx
'use client'

import type { Card } from '@/types'
import { useRejectCollectionForm } from '@/hooks/useRejectCollectionForm'

interface RejectCollectionFormProps {
  card: Card;
  onRejectCollection: (cardId: string, reason: string, observations:string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function RejectCollectionForm({ card, onRejectCollection, onClose, onBack }: RejectCollectionFormProps) {
  const {
    reason,
    setReason,
    observations,
    setObservations,
    feedback,
    isUpdating,
    handleRejectCollection
  } = useRejectCollectionForm({ card, onRejectCollection, onClose });

  return (
    <div className="space-y-4 bg-white rounded-xl p-4 border border-red-200">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-500"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
        <h3 className="text-lg font-bold text-gray-800">Rejeitar Recolha</h3>
      </div>

      <div>
        <label>Motivo *</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Selecione...</option>
          <option value="Endereço incorreto">Endereço incorreto</option>
          <option value="Veículo não localizado">Veículo não localizado</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <label>Observações</label>
        <textarea value={observations} onChange={(e) => setObservations(e.target.value)} className="w-full p-2 border rounded"/>
      </div>

      {feedback && <p>{feedback}</p>}
      <button onClick={handleRejectCollection} disabled={isUpdating} className="w-full bg-red-500 text-white p-3 rounded">
        {isUpdating ? 'Rejeitando...' : 'Confirmar Rejeição'}
      </button>
    </div>
  )
}
