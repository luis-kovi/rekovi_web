// components/CardModal/FilaRecolhaActions/AllocateDriverForm.tsx
'use client'

import type { CardWithSLA } from '@/types'
import { useAllocateDriverForm } from '@/hooks/useAllocateDriverForm'

interface AllocateDriverFormProps {
  card: CardWithSLA;
  onAllocateDriver: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string, billingType: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function AllocateDriverForm({ card, onAllocateDriver, onClose, onBack }: AllocateDriverFormProps) {
  const {
    feedback,
    isUpdating,
    availableChofers,
    loadingChofers,
    selectedChofer,
    setSelectedChofer,
    setChoferEmail,
    collectionDateTime,
    setCollectionDateTime,
    collectionValue,
    setCollectionValue,
    additionalKm,
    setAdditionalKm,
    billingType,
    setBillingType,
    handleCurrencyChange,
    handleAllocateDriver
  } = useAllocateDriverForm({ card, onAllocateDriver, onClose });

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-200/50 relative overflow-hidden group max-h-[70vh] overflow-y-auto">
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-bold text-gray-800">Alocar Chofer</h3>
        </div>

        {loadingChofers ? (
          <p>Carregando chofers...</p>
        ) : (
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Chofer *</label>
            <select
              value={selectedChofer}
              onChange={(e) => {
                const driverName = e.target.value;
                const driver = availableChofers.find(d => d.name === driverName);
                setSelectedChofer(driverName);
                setChoferEmail(driver?.email || '');
              }}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione um chofer</option>
              {availableChofers.map(chofer => (
                <option key={chofer.email} value={chofer.name}>{chofer.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Data e Hora da Recolha *</label>
          <input
            type="datetime-local"
            value={collectionDateTime}
            onChange={(e) => setCollectionDateTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Tipo de Faturamento</label>
            <select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="fixo">Fixo</option>
              <option value="avulso">Avulso</option>
            </select>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Valor da Recolha</label>
          <input
            type="text"
            value={collectionValue}
            onChange={(e) => handleCurrencyChange(setCollectionValue, (val) => {}, e.target.value)} // raw value handled in hook
            placeholder="R$ 0,00"
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Custo Km Adicional</label>
          <input
            type="text"
            value={additionalKm}
            onChange={(e) => handleCurrencyChange(setAdditionalKm, (val) => {}, e.target.value)} // raw value handled in hook
            placeholder="R$ 0,00"
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        {feedback && <p className="text-sm text-center p-3 rounded-lg bg-gray-100">{feedback}</p>}

        <button onClick={handleAllocateDriver} disabled={isUpdating} className="w-full bg-green-500 text-white px-4 py-3 rounded-lg">
          {isUpdating ? 'Alocando...' : 'Alocar Chofer'}
        </button>
      </div>
    </div>
  )
}
