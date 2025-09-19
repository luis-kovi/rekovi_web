// components/MobileTaskModal/TentativaRecolhaActions/ReportProblemForm.tsx
'use client'

import { useState } from 'react'
import type { Card } from '@/types'
import { logger } from '@/utils/logger'

interface ReportProblemFormProps {
  card: Card;
  onReportProblem: (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function ReportProblemForm({ card, onReportProblem, onClose, onBack }: ReportProblemFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [problemType, setProblemType] = useState('');
  const [problemEvidence, setProblemEvidence] = useState({
    photo1: null as File | null,
    photo2: null as File | null,
    photo3: null as File | null
  });

  const handlePhotoUpload = (photoType: string, file: File) => {
    setProblemEvidence(prev => ({ ...prev, [photoType]: file }));
  };

  const resetProblemForm = () => {
    setProblemType('');
    setProblemEvidence({
      photo1: null,
      photo2: null,
      photo3: null
    });
  };

  const handleReportProblem = async () => {
    if (!problemType) {
      setFeedback('Por favor, selecione a dificuldade encontrada.');
      return;
    }

    const hasAnyPhoto = Object.values(problemEvidence).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto como evidência.');
      return;
    }

    if (!onReportProblem) {
      setFeedback('Funcionalidade de reporte não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando relato do problema...');

    try {
      const evidencesToUpload = Object.fromEntries(
        Object.entries(problemEvidence).filter(([key, file]) => file !== null)
      ) as Record<string, File>;

      await onReportProblem(card.id, card.faseAtual, problemType, evidencesToUpload);

      setFeedback('Problema reportado com sucesso! Os dados serão atualizados em até 3 minutos.');
      setTimeout(() => {
        setFeedback('');
        resetProblemForm();
        setIsUpdating(false);
        onClose();
      }, 3000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 bg-white rounded-xl p-4 border border-purple-200">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            onBack();
            resetProblemForm();
            setFeedback('');
          }}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-800">Reportar Problema</h3>
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Qual a dificuldade encontrada na recolha? *</label>
        <select
          value={problemType}
          onChange={(e) => setProblemType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white text-black"
        >
          <option value="" style={{ color: '#6B7280' }}>Selecione a dificuldade...</option>
          <option value="cliente_regularizou">Cliente regularizou o pagamento</option>
          <option value="cliente_recusa_pagamento">Cliente recusa a entrega e informa que vai fazer o pagamento</option>
          <option value="cliente_recusa_problemas">Cliente recusa a entrega devido a problemas com a Kovi</option>
          <option value="carro_localizado_cliente_nao">Carro localizado, mas cliente não encontrado</option>
          <option value="carro_nao_localizado">Carro não localizado e sem contato com o cliente</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-bold text-gray-700 mb-2">Evidências da dificuldade</p>
        <p className="text-xs text-gray-500 mb-3">Envie fotos da rua, da garagem que evidencie a dificuldade na recolha</p>

        <div className="grid grid-cols-3 gap-3">
          {['photo1', 'photo2', 'photo3'].map((photoKey, index) => (
            <div key={photoKey} className="space-y-2">
              <p className="text-xs font-bold text-gray-700">Foto {index + 1}</p>
              <div className="w-full aspect-square bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePhotoUpload(photoKey, file);
                  }
                }}
                className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
              />
              {problemEvidence[photoKey as keyof typeof problemEvidence] && (
                <p className="text-xs text-green-600">✓ Foto enviada</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`text-sm text-center p-3 rounded-lg font-medium ${
          feedback.includes('Erro') || feedback.includes('selecione') || feedback.includes('pelo menos')
            ? 'text-red-700 bg-red-100 border border-red-200'
            : 'text-green-700 bg-green-100 border border-green-200'
        }`}>
          {feedback}
        </div>
      )}

      <button
        onClick={handleReportProblem}
        disabled={isUpdating}
        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Processando...' : 'Confirmar'}
      </button>
    </div>
  );
}
