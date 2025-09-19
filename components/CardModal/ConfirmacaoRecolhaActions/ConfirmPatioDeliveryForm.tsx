// components/CardModal/ConfirmacaoRecolhaActions/ConfirmPatioDeliveryForm.tsx
'use client'

import type { CardWithSLA } from '@/types'
import { useConfirmPatioDeliveryForm } from '@/hooks/useConfirmPatioDeliveryForm'

interface ConfirmPatioDeliveryFormProps {
  card: CardWithSLA;
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
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-200/50 relative overflow-hidden group max-h-[70vh] overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            Confirmar Entrega no Pátio
          </h3>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-3 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Fotos do veículo no pátio *
          </label>
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
                <label className="text-xs font-bold text-gray-700 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {photo.label}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-green-400 transition-colors">
                  <div className="w-full aspect-square mb-2">
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
                      if (file) handlePhotoUpload(photo.key, file, 'patio');
                    }}
                    className="hidden"
                    id={`patio-upload-${photo.key}`}
                  />
                  <label
                    htmlFor={`patio-upload-${photo.key}`}
                    className="text-xs text-green-600 hover:text-green-800 cursor-pointer block"
                  >
                    {patioVehiclePhotos[photo.key as keyof typeof patioVehiclePhotos] ? 'Trocar' : 'Upload'}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-3 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Houveram despesas extras no processo de recolha? *
          </label>
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
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-black placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Comprovante de pagamento do {expense.label.toLowerCase()}
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-green-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(`${expense.key}-patio`, file, 'expense');
                          }}
                          className="hidden"
                          id={`patio-expense-${expense.key}`}
                        />
                        <label
                          htmlFor={`patio-expense-${expense.key}`}
                          className="text-xs text-green-600 hover:text-green-800 cursor-pointer block py-2"
                        >
                          {patioExpenseReceipts[expense.key as keyof typeof patioExpenseReceipts] ? 'Comprovante enviado' : 'Anexar comprovante'}
                        </label>
                      </div>
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
              ? 'text-red-700 bg-red-100/50 border border-red-200/50'
              : 'text-green-700 bg-green-100/50 border border-green-200/50'
          }`}>
            {feedback}
          </div>
        )}

        <button
          onClick={handleConfirmPatioDelivery}
          disabled={isUpdating}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isUpdating ? 'Processando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
