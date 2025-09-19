// hooks/useCarTowedForm.ts
'use client'

import { useState } from 'react'
import type { CardWithSLA, Card } from '@/types'

interface useCarTowedFormProps {
  card: CardWithSLA | Card;
  onConfirmCarTowed: (cardId: string, photo: File, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onClose: () => void;
}

export function useCarTowedForm({ card, onConfirmCarTowed, onClose }: useCarTowedFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [towedCarPhoto, setTowedCarPhoto] = useState<File | null>(null);
  const [towedCarExtraExpenses, setTowedCarExtraExpenses] = useState({ naoHouve: true, pedagio: false });
  const [towedCarExpenseValues, setTowedCarExpenseValues] = useState({ pedagio: '' });
  const [rawTowedCarExpenseValues, setRawTowedCarExpenseValues] = useState({ pedagio: '' });
  const [towedCarExpenseReceipts, setTowedCarExpenseReceipts] = useState({ pedagio: null as File | null });

  const handlePhotoUpload = (file: File) => setTowedCarPhoto(file);
  const handleReceiptUpload = (file: File) => setTowedCarExpenseReceipts({ pedagio: file });

  const handleExpenseChange = (checked: boolean) => {
    setTowedCarExtraExpenses({ naoHouve: !checked, pedagio: checked });
    if (!checked) {
      setTowedCarExpenseValues({ pedagio: '' });
      setRawTowedCarExpenseValues({ pedagio: '' });
      setTowedCarExpenseReceipts({ pedagio: null });
    }
  };

  const handleCurrencyChange = (value: string) => {
    const rawValue = value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;
    const formatted = numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setTowedCarExpenseValues({ pedagio: formatted });
    setRawTowedCarExpenseValues({ pedagio: numericValue.toFixed(2) });
  };

  const handleConfirmCarTowed = async () => {
    if (!towedCarPhoto) {
      setFeedback('Por favor, envie a foto do carro guinchado.');
      return;
    }
    if (towedCarExtraExpenses.pedagio) {
      if (!towedCarExpenseValues.pedagio) {
        setFeedback('Por favor, informe o valor do pedágio.');
        return;
      }
      if (!towedCarExpenseReceipts.pedagio) {
        setFeedback('Por favor, anexe o comprovante do pedágio.');
        return;
      }
    }
    setIsUpdating(true);
    setFeedback('Processando confirmação...');
    try {
      const expensesList = towedCarExtraExpenses.pedagio ? ['Pedágio'] : ['Não houve'];
      const receiptsToUpload: Record<string, File> = {};
      if (towedCarExtraExpenses.pedagio && towedCarExpenseReceipts.pedagio) {
        receiptsToUpload.pedagio = towedCarExpenseReceipts.pedagio;
      }
      await onConfirmCarTowed(card.id, towedCarPhoto, expensesList, rawTowedCarExpenseValues, receiptsToUpload);
      setFeedback('Confirmação de carro guinchado enviada com sucesso!');
      setTimeout(onClose, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return {
    feedback,
    isUpdating,
    towedCarPhoto,
    towedCarExtraExpenses,
    towedCarExpenseValues,
    towedCarExpenseReceipts,
    handlePhotoUpload,
    handleReceiptUpload,
    handleExpenseChange,
    handleCurrencyChange,
    handleConfirmCarTowed
  };
}
