// hooks/useRejectCollectionForm.ts
'use client'

import { useState } from 'react'
import type { CardWithSLA, Card } from '@/types'

interface useRejectCollectionFormProps {
  card: CardWithSLA | Card;
  onRejectCollection: (cardId: string, reason: string, observations: string) => Promise<void>;
  onClose: () => void;
}

export function useRejectCollectionForm({ card, onRejectCollection, onClose }: useRejectCollectionFormProps) {
  const [reason, setReason] = useState('');
  const [observations, setObservations] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRejectCollection = async () => {
    if (!reason) {
      setFeedback('Por favor, selecione um motivo.');
      return;
    }
    setIsUpdating(true);
    setFeedback('Rejeitando recolha...');
    try {
      await onRejectCollection(card.id, reason, observations);
      setFeedback('Recolha rejeitada com sucesso!');
      setTimeout(onClose, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return {
    reason,
    setReason,
    observations,
    setObservations,
    feedback,
    isUpdating,
    handleRejectCollection
  };
}
