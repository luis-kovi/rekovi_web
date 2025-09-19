// components/MobileTaskModal/TentativaRecolhaActions/RequestTowingForm.tsx
'use client'

import { useState } from 'react'
import type { Card } from '@/types'
import { logger } from '@/utils/logger'

interface RequestTowingFormProps {
  card: Card;
  onRequestTowing: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function RequestTowingForm({ card, onRequestTowing, onClose, onBack }: RequestTowingFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [towingReason, setTowingReason] = useState('');
  const [towingPhotos, setTowingPhotos] = useState({
    frente: null as File | null,
    traseira: null as File | null,
    lateralDireita: null as File | null,
    lateralEsquerda: null as File | null,
    estepe: null as File | null,
    painel: null as File | null
  });
  const [towingObservations, setTowingObservations] = useState('');

  const getImageUrl = (file: File | null, defaultImageUrl: string): string => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return defaultImageUrl;
  };

  const handlePhotoUpload = (photoType: string, file: File) => {
    setTowingPhotos(prev => ({ ...prev, [photoType]: file }));
  };

  const resetTowingForm = () => {
    setTowingReason('');
    setTowingPhotos({
      frente: null,
      traseira: null,
      lateralDireita: null,
      lateralEsquerda: null,
      estepe: null,
      painel: null
    });
    setTowingObservations('');
  };

  const handleRequestTowing = async () => {
    if (!towingReason) {
      setFeedback('Por favor, selecione o motivo do guincho.');
      return;
    }

    const hasAnyPhoto = Object.values(towingPhotos).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto do veículo.');
      return;
    }

    if (!onRequestTowing) {
      setFeedback('Funcionalidade de guincho não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando solicitação de guincho...');

    try {
      const photosToUpload = Object.fromEntries(
        Object.entries(towingPhotos).filter(([key, file]) => file !== null)
      ) as Record<string, File>;

      await onRequestTowing(card.id, card.faseAtual, towingReason, photosToUpload);

      setFeedback('Guincho solicitado com sucesso! Os dados serão atualizados em até 3 minutos.');
      setTimeout(() => {
        setFeedback('');
        resetTowingForm();
        setIsUpdating(false);
        onClose();
      }, 3000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 bg-white rounded-xl p-4 border border-orange-200">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            onBack();
            resetTowingForm();
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
        <label className="text-sm font-bold text-gray-700 mb-2 block">Motivo do guincho *</label>
        <select
          value={towingReason}
          onChange={(e) => setTowingReason(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white text-black"
        >
          <option value="" style={{ color: '#6B7280' }}>Selecione o motivo...</option>
          <option value="Veículo com avarias / problemas mecânicos">Veículo com avarias / problemas mecânicos</option>
          <option value="Veículo na rua sem recuperação da chave">Veículo na rua sem recuperação da chave</option>
          <option value="Chave danificada / perdida">Chave danificada / perdida</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'frente', label: 'Foto da Frente', image: '/images/placeholders/vehicle-front.webp' },
          { key: 'traseira', label: 'Foto da Traseira', image: '/images/placeholders/vehicle-rear.webp' },
          { key: 'lateralDireita', label: 'Lateral Direita', image: '/images/placeholders/vehicle-right.jpg' },
          { key: 'lateralEsquerda', label: 'Lateral Esquerda', image: '/images/placeholders/vehicle-left.jpg' },
          ...(towingReason !== 'Veículo na rua sem recuperação da chave' ? [
            { key: 'estepe', label: 'Foto do Estepe', image: '/images/placeholders/vehicle-spare.jpg' },
            { key: 'painel', label: 'Foto do Painel', image: '/images/placeholders/vehicle-dashboard.jpg' },
          ] : [])
        ].map((photo) => (
          <div key={photo.key} className="space-y-2">
            <p className="text-xs font-bold text-gray-700">{photo.label}</p>
            <div className="w-full aspect-square">
              <img
                src={getImageUrl(towingPhotos[photo.key as keyof typeof towingPhotos], photo.image)}
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
                  handlePhotoUpload(photo.key, file);
                }
              }}
              className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
            />
            {towingPhotos[photo.key as keyof typeof towingPhotos] && (
              <p className="text-xs text-green-600">✓ Foto enviada</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Observações</label>
        <textarea
          value={towingObservations}
          onChange={(e) => setTowingObservations(e.target.value)}
          rows={3}
          placeholder="Observações adicionais (opcional)..."
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white resize-none placeholder-gray-600 text-black"
        />
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
        onClick={handleRequestTowing}
        disabled={isUpdating}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Processando...' : 'Confirmar'}
      </button>
    </div>
  );
}
