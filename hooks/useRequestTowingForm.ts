// hooks/useRequestTowingForm.ts
'use client'
import { useState } from 'react'
import type { Card } from '@/types'

interface useRequestTowingFormProps {
  card: Card;
  onRequestTowing: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>;
  onClose: () => void;
}

export function useRequestTowingForm({ card, onRequestTowing, onClose }: useRequestTowingFormProps) {
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: Record<string, File> = {};
      Array.from(e.target.files).forEach(file => { newFiles[file.name] = file; });
      setPhotos(prev => ({ ...prev, ...newFiles }));
    }
  };

  const handleRequestTowing = async () => {
    if (!reason || Object.keys(photos).length === 0) {
      setFeedback('Por favor, preencha o motivo e anexe as fotos.');
      return;
    }
    setIsUpdating(true);
    setFeedback('Solicitando guincho...');
    try {
      await onRequestTowing(card.id, card.faseAtual, reason, photos);
      setFeedback('Guincho solicitado com sucesso!');
      setTimeout(onClose, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return {
    reason,
    setReason,
    photos,
    feedback,
    isUpdating,
    handleFileChange,
    handleRequestTowing
  };
}
