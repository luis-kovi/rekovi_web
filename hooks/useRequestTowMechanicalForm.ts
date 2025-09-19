// hooks/useRequestTowMechanicalForm.ts
'use client'
import { useState } from 'react'
import type { Card } from '@/types'

interface useRequestTowMechanicalFormProps {
  card: Card;
  onRequestTowMechanical: (cardId: string, reason: string) => Promise<void>;
  onClose: () => void;
}

export function useRequestTowMechanicalForm({ card, onRequestTowMechanical, onClose }: useRequestTowMechanicalFormProps) {
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRequest = async () => {
    if (!reason) {
      setFeedback('Por favor, informe o motivo.');
      return;
    }
    setIsUpdating(true);
    setFeedback('Solicitando guincho...');
    try {
      await onRequestTowMechanical(card.id, reason);
      setFeedback('Solicitação enviada com sucesso!');
      setTimeout(onClose, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return { reason, setReason, feedback, isUpdating, handleRequest };
}
