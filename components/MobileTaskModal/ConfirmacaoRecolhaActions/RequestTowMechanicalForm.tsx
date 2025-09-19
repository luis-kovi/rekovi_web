// components/MobileTaskModal/ConfirmacaoRecolhaActions/RequestTowMechanicalForm.tsx
'use client'

import { useState } from 'react'
import type { Card } from '@/types'

interface RequestTowMechanicalFormProps {
  card: Card;
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
    <div className="space-y-4 bg-white rounded-xl p-4 border border-red-200">
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
        <h3 className="text-lg font-bold text-gray-800">Solicitar Guincho</h3>
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Detalhe o motivo do guincho *</label>
        <textarea
          value={mechanicalTowReason}
          onChange={(e) => setMechanicalTowReason(e.target.value)}
          rows={6}
          placeholder="Descreva detalhadamente os problemas mecânicos identificados..."
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white resize-none placeholder-gray-600 text-black"
        />
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
        onClick={handleRequestTowMechanical}
        disabled={isUpdating}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Processando...' : 'Confirmar'}
      </button>
    </div>
  );
}
