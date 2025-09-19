// components/CardModal/FilaRecolhaActions/RejectCollectionForm.tsx
'use client'

import { useState } from 'react'
import type { CardWithSLA } from '@/types'

interface RejectCollectionFormProps {
  card: CardWithSLA;
  onRejectCollection: (cardId: string, reason: string, observations: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function RejectCollectionForm({ card, onRejectCollection, onClose, onBack }: RejectCollectionFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionObservations, setRejectionObservations] = useState('');

  const resetRejectForm = () => {
    setRejectionReason('');
    setRejectionObservations('');
  };

  const handleRejectCollection = async () => {
    if (!rejectionReason || !rejectionObservations) {
      setFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!onRejectCollection) {
      setFeedback('Funcionalidade de rejeição não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando rejeição de recolha...');

    try {
      await onRejectCollection(card.id, rejectionReason, rejectionObservations);

      setFeedback('Recolha rejeitada com sucesso! Os dados serão atualizados em até 3 minutos.');
      setTimeout(() => {
        setFeedback('');
        resetRejectForm();
        setIsUpdating(false);
        onClose();
      }, 3000);
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
              resetRejectForm();
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            Rejeitar Recolha
          </h3>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Motivo da não recolha *
          </label>
          <select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white shadow-sm transition-all duration-200 text-black"
          >
            <option value="">Selecione um motivo...</option>
            <option value="cliente_pagamento">Cliente realizou pagamento</option>
            <option value="cliente_devolveu">Cliente já devolveu o veículo</option>
            <option value="veiculo_recolhido">Veículo já recolhido</option>
            <option value="fora_area">Fora da área de atuação</option>
            <option value="duplicada">Solicitação duplicada</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Observações *
          </label>
          <textarea
            value={rejectionObservations}
            onChange={(e) => setRejectionObservations(e.target.value)}
            rows={4}
            placeholder="Descreva detalhes adicionais sobre a rejeição..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white shadow-sm transition-all duration-200 resize-none text-black placeholder-gray-600"
          />
        </div>

        {feedback && (
          <div className={`text-sm text-center p-3 rounded-lg font-medium ${
            feedback.includes('Erro') || feedback.includes('preencha')
              ? 'text-red-700 bg-red-100/50 border border-red-200/50'
              : 'text-green-700 bg-green-100/50 border border-green-200/50'
          }`}>
            {feedback}
          </div>
        )}

        <button
          onClick={handleRejectCollection}
          disabled={isUpdating}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isUpdating ? 'Processando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
