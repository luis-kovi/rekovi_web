// components/MobileTaskModal/FilaRecolhaActions/RejectCollectionForm.tsx
'use client'

import { useState } from 'react'
import type { Card } from '@/types'

interface RejectCollectionFormProps {
  card: Card;
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
    <div className="space-y-4 bg-white rounded-xl p-4 border border-red-200">
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
        <h3 className="text-lg font-bold text-gray-800">Rejeitar Recolha</h3>
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Motivo da não recolha *</label>
        <select
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white text-black"
        >
          <option value="" style={{ color: '#6B7280' }}>Selecione um motivo...</option>
          <option value="cliente_pagamento">Cliente realizou pagamento</option>
          <option value="cliente_devolveu">Cliente já devolveu o veículo</option>
          <option value="veiculo_recolhido">Veículo já recolhido</option>
          <option value="fora_area">Fora da área de atuação</option>
          <option value="duplicada">Solicitação duplicada</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Observações *</label>
        <textarea
          value={rejectionObservations}
          onChange={(e) => setRejectionObservations(e.target.value)}
          rows={4}
          placeholder="Descreva detalhes adicionais sobre a rejeição..."
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white resize-none placeholder-gray-600 text-black"
        />
      </div>

      {feedback && (
        <div className={`text-sm text-center p-3 rounded-lg font-medium ${
          feedback.includes('Erro') || feedback.includes('preencha')
            ? 'text-red-700 bg-red-100 border border-red-200'
            : 'text-green-700 bg-green-100 border border-green-200'
        }`}>
          {feedback}
        </div>
      )}

      <button
        onClick={handleRejectCollection}
        disabled={isUpdating}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Processando...' : 'Confirmar'}
      </button>
    </div>
  );
}
