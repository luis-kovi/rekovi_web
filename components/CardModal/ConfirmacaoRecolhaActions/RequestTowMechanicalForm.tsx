// components/CardModal/ConfirmacaoRecolhaActions/RequestTowMechanicalForm.tsx
'use client'

import { useState } from 'react'
import type { CardWithSLA } from '@/types'

interface RequestTowMechanicalFormProps {
  card: CardWithSLA;
  onRequestTowMechanical: (cardId: string, reason: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function RequestTowMechanicalForm({ card, onRequestTowMechanical, onClose, onBack }: RequestTowMechanicalFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [mechanicalTowReason, setMechanicalTowReason] = useState('');

  const handleRequestTowMechanical = async () => {
    if (!mechanicalTowReason.trim()) {
      setFeedback('Por favor, detalhe o motivo do guincho.');
      return;
    }

    if (!onRequestTowMechanical) {
      setFeedback('Funcionalidade de solicitação não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando solicitação de guincho...');

    try {
      await onRequestTowMechanical(card.id, mechanicalTowReason);

      setFeedback('Guincho solicitado com sucesso!');
      setTimeout(() => {
        setFeedback('');
        setMechanicalTowReason('');
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-red-200/50 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              onBack();
              setMechanicalTowReason('');
              setFeedback('');
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            Solicitar Guincho
          </h3>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Detalhe o motivo do guincho *
          </label>
          <textarea
            value={mechanicalTowReason}
            onChange={(e) => setMechanicalTowReason(e.target.value)}
            rows={6}
            placeholder="Descreva detalhadamente os problemas mecânicos identificados após o pedido de desbloqueio que justificam a necessidade do guincho..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white shadow-sm transition-all duration-200 resize-none text-black placeholder-gray-600"
          />
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
          onClick={handleRequestTowMechanical}
          disabled={isUpdating}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isUpdating ? 'Processando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
