// components/CardModal/ConfirmacaoRecolhaActions/CarTowedForm.tsx
'use client'

import type { CardWithSLA } from '@/types'
import { useCarTowedForm } from '@/hooks/useCarTowedForm'

interface CarTowedFormProps {
  card: CardWithSLA;
  onConfirmCarTowed: (cardId: string, photo: File, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function CarTowedForm({ card, onConfirmCarTowed, onClose, onBack }: CarTowedFormProps) {
  const {
    feedback,
    isUpdating,
    towedCarPhoto,
    towedCarExtraExpenses,
    towedCarExpenseValues,
    handlePhotoUpload,
    handleExpenseChange,
    handleCurrencyChange,
    handleReceiptUpload,
    handleConfirmCarTowed
  } = useCarTowedForm({ card, onConfirmCarTowed, onClose });

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200/50 max-h-[70vh] overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-gray-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
          <h3 className="text-lg font-bold text-gray-800">Carro Guincho</h3>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Foto do carro guinchado *</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files && handlePhotoUpload(e.target.files[0])} className="w-full p-2 border rounded"/>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Houve despesa com pedágio?</label>
          <input type="checkbox" checked={towedCarExtraExpenses.pedagio} onChange={(e) => handleExpenseChange(e.target.checked)} />
        </div>

        {towedCarExtraExpenses.pedagio && (
          <>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Valor do Pedágio</label>
              <input type="text" value={towedCarExpenseValues.pedagio} onChange={(e) => handleCurrencyChange(e.target.value)} placeholder="R$ 0,00" className="w-full p-2 border rounded"/>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Comprovante do Pedágio</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && handleReceiptUpload(e.target.files[0])} className="w-full p-2 border rounded"/>
            </div>
          </>
        )}

        {feedback && <p>{feedback}</p>}
        <button onClick={handleConfirmCarTowed} disabled={isUpdating} className="w-full bg-orange-500 text-white p-3 rounded">{isUpdating ? 'Processando...' : 'Confirmar'}</button>
      </div>
    </div>
  )
}
