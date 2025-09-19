// hooks/useReportProblemForm.ts
'use client'
import { useState } from 'react'
import type { Card } from '@/types'

interface useReportProblemFormProps {
  card: Card;
  onReportProblem: (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => Promise<void>;
  onClose: () => void;
}

export function useReportProblemForm({ card, onReportProblem, onClose }: useReportProblemFormProps) {
  const [difficulty, setDifficulty] = useState('');
  const [evidences, setEvidences] = useState<Record<string, File>>({});
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: Record<string, File> = {};
      Array.from(e.target.files).forEach(file => {
        newFiles[file.name] = file;
      });
      setEvidences(prev => ({ ...prev, ...newFiles }));
    }
  };

  const handleReportProblem = async () => {
    if (!difficulty) {
      setFeedback('Por favor, selecione o nível de dificuldade.');
      return;
    }
    setIsUpdating(true);
    setFeedback('Reportando problema...');
    try {
      await onReportProblem(card.id, card.faseAtual, difficulty, evidences);
      setFeedback('Problema reportado com sucesso!');
      setTimeout(onClose, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return {
    difficulty,
    setDifficulty,
    evidences,
    feedback,
    isUpdating,
    handleFileChange,
    handleReportProblem
  };
}
