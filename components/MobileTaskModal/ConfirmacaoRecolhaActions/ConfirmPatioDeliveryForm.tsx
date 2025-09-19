// components/MobileTaskModal/ConfirmacaoRecolhaActions/ConfirmPatioDeliveryForm.tsx
'use client'

import type { Card } from '@/types'
import { useConfirmPatioDeliveryForm } from '@/hooks/useConfirmPatioDeliveryForm'

interface ConfirmPatioDeliveryFormProps {
  card: Card;
  onConfirmPatioDelivery: (cardId: string, photos: Record<string, File>, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function ConfirmPatioDeliveryForm({ card, onConfirmPatioDelivery, onClose, onBack }: ConfirmPatioDeliveryFormProps) {
  const {
    feedback,
    isUpdating,
    patioVehiclePhotos,
    patioExtraExpenses,
    patioExpenseValues,
    patioExpenseReceipts,
    getImageUrl,
    handlePhotoUpload,
    handlePatioExpenseChange,
    handleCurrencyChange,
    resetPatioForm,
    handleConfirmPatioDelivery,
  } = useConfirmPatioDeliveryForm({ card, onConfirmPatioDelivery, onClose });

  const handleBack = () => {
    resetPatioForm();
    onBack();
  };

  return (
    <div className="space-y-4 bg-white rounded-xl p-4 border border-green-200 max-h-[60vh] overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleBack}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-800">Confirmar Entrega no Pátio</h3>
      </div>

      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Fotos do veículo no pátio *</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'frente', label: 'Foto da Frente', image: '/images/placeholders/vehicle-front.webp' },
            { key: 'traseira', label: 'Foto da Traseira', image: '/images/placeholders/vehicle-rear.webp' },
            { key: 'lateralDireita', label: 'Lateral Direita', image: '/images/placeholders/vehicle-right.jpg' },
            { key: 'lateralEsquerda', label: 'Lateral Esquerda', image: '/images/placeholders/vehicle-left.jpg' },
            { key: 'estepe', label: 'Foto do Estepe', image: '/images/placeholders/vehicle-spare.jpg' },
            { key: 'painel', label: 'Foto do Painel', image: '/images/placeholders/vehicle-dashboard.jpg' }
          ].map((photo) => (
            <div key={photo.key} className="space-y-2">
              <p className="text-xs font-bold text-gray-700">{photo.label}</p>
              <div className="w-full aspect-square">
                <img
                  src={getImageUrl(patioVehiclePhotos[photo.key as keyof typeof patioVehiclePhotos], photo.image)}
                  alt={photo.label}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePhotoUpload(photo.key, file, 'patio');
                  }
                }}
                className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
              />
              {patioVehiclePhotos[photo.key as keyof typeof patioVehiclePhotos] && (
                <p className="text-xs text-green-600">✓ Foto enviada</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Houveram despesas extras no processo de recolha? *</p>
        <div className="space-y-3">
          {[
            { key: 'naoHouve', label: 'Não houve' },
            { key: 'gasolina', label: 'Gasolina' },
            { key: 'pedagio', label: 'Pedágio' },
            { key: 'estacionamento', label: 'Estacionamento' },
            { key: 'motoboy', label: 'Motoboy (busca de chave)' }
          ].map((expense) => (
            <div key={expense.key} className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={patioExtraExpenses[expense.key as keyof typeof patioExtraExpenses]}
                  onChange={(e) => handlePatioExpenseChange(expense.key, e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{expense.label}</span>
              </label>

              {expense.key !== 'naoHouve' && patioExtraExpenses[expense.key as keyof typeof patioExtraExpenses] && (
                <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Valor do {expense.label.toLowerCase()}
                    </label>
                    <input
                      type="text"
                      value={patioExpenseValues[expense.key as keyof typeof patioExpenseValues]}
                      onChange={(e) => handleCurrencyChange(expense.key, e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 placeholder-gray-600 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Comprovante de pagamento do {expense.label.toLowerCase()}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(`${expense.key}-patio`, file, 'expense');
                      }}
                      className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
                    />
                    {patioExpenseReceipts[expense.key as keyof typeof patioExpenseReceipts] && (
                      <p className="text-xs text-green-600 mt-1">✓ Comprovante enviado</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`text-sm text-center p-3 rounded-lg font-medium ${
          feedback.includes('Erro') || feedback.includes('Por favor')
            ? 'text-red-700 bg-red-100 border border-red-200'
            : 'text-green-700 bg-green-100 border border-green-200'
        }`}>
          {feedback}
        </div>
      )}

      <button
        onClick={handleConfirmPatioDelivery}
        disabled={isUpdating}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Processando...' : 'Confirmar'}
      </button>
    </div>
  );
}
