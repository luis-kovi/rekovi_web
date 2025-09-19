// components/CardModal/TentativaRecolhaActions/RequestTowingForm.tsx
'use client'

import type { CardWithSLA } from '@/types'
import { useRequestTowingForm } from '@/hooks/useRequestTowingForm'

interface RequestTowingFormProps {
  card: CardWithSLA;
  onRequestTowing: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function RequestTowingForm({ card, onRequestTowing, onClose, onBack }: RequestTowingFormProps) {
  const {
    reason,
    setReason,
    feedback,
    isUpdating,
    handleFileChange,
    handleRequestTowing
  } = useRequestTowingForm({ card, onRequestTowing, onClose });

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200/50">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-gray-500"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
          <h3 className="text-lg font-bold text-gray-800">Solicitar Guincho</h3>
        </div>
        <div>
          <label>Motivo *</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded"/>
        </div>
        <div>
          <label>Fotos *</label>
          <input type="file" multiple onChange={handleFileChange} className="w-full p-2 border rounded"/>
        </div>
        {feedback && <p>{feedback}</p>}
        <button onClick={handleRequestTowing} disabled={isUpdating} className="w-full bg-orange-500 text-white p-3 rounded">
          {isUpdating ? 'Solicitando...' : 'Solicitar Guincho'}
        </button>
      </div>
    </div>
  )
}
