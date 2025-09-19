// hooks/useUnlockVehicleForm.ts
'use client'
import { useState } from 'react'
import type { Card } from '@/types'

interface useUnlockVehicleFormProps {
  card: Card;
  onUnlockVehicle: (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => Promise<void>;
  onClose: () => void;
}

export function useUnlockVehicleForm({ card, onUnlockVehicle, onClose }: useUnlockVehicleFormProps) {
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [observations, setObservations] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: Record<string, File> = {};
      Array.from(e.target.files).forEach(file => { newFiles[file.name] = file; });
      setPhotos(prev => ({ ...prev, ...newFiles }));
    }
  };

  const handleUnlockVehicle = async () => {
    if (Object.keys(photos).length === 0) {
      setFeedback('Por favor, anexe as fotos do veículo.');
      return;
    }
    setIsUpdating(true);
    setFeedback('Desbloqueando veículo...');
    try {
      await onUnlockVehicle(card.id, card.faseAtual, photos, observations);
      setFeedback('Veículo desbloqueado com sucesso!');
      setTimeout(onClose, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return {
    photos,
    observations,
    setObservations,
    feedback,
    isUpdating,
    handleFileChange,
    handleUnlockVehicle
  };
}
