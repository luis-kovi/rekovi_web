// components/CardModal/TentativaRecolhaActions/UnlockVehicleForm.tsx
'use client'

import { useState } from 'react'
import type { CardWithSLA } from '@/types'
import { logger } from '@/utils/logger'

interface UnlockVehicleFormProps {
  card: CardWithSLA;
  onUnlockVehicle: (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function UnlockVehicleForm({ card, onUnlockVehicle, onClose, onBack }: UnlockVehicleFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [vehiclePhotos, setVehiclePhotos] = useState({
    frente: null as File | null,
    traseira: null as File | null,
    lateralDireita: null as File | null,
    lateralEsquerda: null as File | null,
    estepe: null as File | null,
    painel: null as File | null
  });
  const [unlockObservations, setUnlockObservations] = useState('');

  const getImageUrl = (file: File | null, defaultImageUrl: string): string => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return defaultImageUrl;
  };

  const handlePhotoUpload = (photoType: string, file: File) => {
    setVehiclePhotos(prev => ({ ...prev, [photoType]: file }));
  };

  const resetUnlockForm = () => {
    setVehiclePhotos({
      frente: null,
      traseira: null,
      lateralDireita: null,
      lateralEsquerda: null,
      estepe: null,
      painel: null
    });
    setUnlockObservations('');
  };

  const handleUnlockVehicle = async () => {
    const hasAnyPhoto = Object.values(vehiclePhotos).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto do veículo.');
      return;
    }

    if (!onUnlockVehicle) {
      setFeedback('Funcionalidade de desbloqueio não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando desbloqueio do veículo...');

    try {
      const photosToUpload = Object.fromEntries(
        Object.entries(vehiclePhotos).filter(([key, file]) => file !== null)
      ) as Record<string, File>;

      await onUnlockVehicle(card.id, card.faseAtual, photosToUpload, unlockObservations);

      setFeedback('Veículo desbloqueado com sucesso! Os dados serão atualizados em até 3 minutos.');
      setTimeout(() => {
        setFeedback('');
        resetUnlockForm();
        setIsUpdating(false);
        onClose();
      }, 3000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-200/50 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              onBack();
              resetUnlockForm();
              setFeedback('');
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            Desbloquear Veículo
          </h3>
        </div>

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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-blue-400 transition-colors">
                <div className="w-full aspect-square mb-2">
                  <img
                    src={getImageUrl(vehiclePhotos[photo.key as keyof typeof vehiclePhotos], photo.image)}
                    alt={photo.label}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(photo.key, file);
                  }}
                  className="hidden"
                  id={`upload-${photo.key}`}
                />
                <label
                  htmlFor={`upload-${photo.key}`}
                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer block"
                >
                  {vehiclePhotos[photo.key as keyof typeof vehiclePhotos] ? 'Trocar' : 'Upload'}
                </label>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Observações
          </label>
          <textarea
            value={unlockObservations}
            onChange={(e) => setUnlockObservations(e.target.value)}
            rows={3}
            placeholder="Observações adicionais sobre o desbloqueio..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 resize-none text-black placeholder-gray-600"
          />
        </div>

        {feedback && (
          <div className={`text-sm text-center p-3 rounded-lg font-medium ${
            feedback.includes('Erro') || feedback.includes('pelo menos')
              ? 'text-red-700 bg-red-100/50 border border-red-200/50'
              : 'text-green-700 bg-green-100/50 border border-green-200/50'
          }`}>
            {feedback}
          </div>
        )}

        <button
          onClick={handleUnlockVehicle}
          disabled={isUpdating}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isUpdating ? 'Processando...' : 'Confirmar Desbloqueio'}
        </button>
      </div>
    </div>
  );
}
