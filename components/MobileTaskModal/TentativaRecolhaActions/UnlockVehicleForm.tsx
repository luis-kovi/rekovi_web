// components/MobileTaskModal/TentativaRecolhaActions/UnlockVehicleForm.tsx
'use client'

import type { Card } from '@/types'
import { useUnlockVehicleForm } from '@/hooks/useUnlockVehicleForm'

interface UnlockVehicleFormProps {
  card: Card;
  onUnlockVehicle: (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function UnlockVehicleForm({ card, onUnlockVehicle, onClose, onBack }: UnlockVehicleFormProps) {
  const {
    observations,
    setObservations,
    feedback,
    isUpdating,
    handleFileChange,
    handleUnlockVehicle
  } = useUnlockVehicleForm({ card, onUnlockVehicle, onClose });

  return (
    <div className="space-y-4 bg-white rounded-xl p-4 border border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-500"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
        <h3 className="text-lg font-bold text-gray-800">Desbloquear Veículo</h3>
      </div>
      <div>
        <label>Fotos *</label>
        <input type="file" multiple onChange={handleFileChange} className="w-full text-xs p-1 border rounded"/>
      </div>
      <div>
        <label>Observações</label>
        <textarea value={observations} onChange={(e) => setObservations(e.target.value)} className="w-full p-2 border rounded"/>
      </div>
      {feedback && <p>{feedback}</p>}
      <button onClick={handleUnlockVehicle} disabled={isUpdating} className="w-full bg-blue-500 text-white p-3 rounded">
        {isUpdating ? 'Desbloqueando...' : 'Desbloquear Veículo'}
      </button>
    </div>
  )
}
