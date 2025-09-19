// hooks/useConfirmPatioDeliveryForm.ts
'use client'

import { useState } from 'react'
import type { CardWithSLA, Card } from '@/types'

interface UseConfirmPatioDeliveryFormProps {
  card: CardWithSLA | Card;
  onConfirmPatioDelivery: (cardId: string, photos: Record<string, File>, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onClose: () => void;
}

export function useConfirmPatioDeliveryForm({ card, onConfirmPatioDelivery, onClose }: UseConfirmPatioDeliveryFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [patioVehiclePhotos, setPatioVehiclePhotos] = useState({
    frente: null as File | null,
    traseira: null as File | null,
    lateralDireita: null as File | null,
    lateralEsquerda: null as File | null,
    estepe: null as File | null,
    painel: null as File | null
  });
  const [patioExtraExpenses, setPatioExtraExpenses] = useState({
    naoHouve: true,
    gasolina: false,
    pedagio: false,
    estacionamento: false,
    motoboy: false
  });
  const [patioExpenseValues, setPatioExpenseValues] = useState({
    gasolina: '',
    pedagio: '',
    estacionamento: '',
    motoboy: ''
  });
  const [rawPatioExpenseValues, setRawPatioExpenseValues] = useState({
    gasolina: '',
    pedagio: '',
    estacionamento: '',
    motoboy: ''
  });
  const [patioExpenseReceipts, setPatioExpenseReceipts] = useState({
    gasolina: null as File | null,
    pedagio: null as File | null,
    estacionamento: null as File | null,
    motoboy: null as File | null
  });

  const getImageUrl = (file: File | null, defaultImageUrl: string): string => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return defaultImageUrl;
  };

  const handlePhotoUpload = (photoType: string, file: File, formType: 'patio' | 'expense') => {
    if (formType === 'patio') {
      setPatioVehiclePhotos(prev => ({ ...prev, [photoType]: file }));
    } else if (formType === 'expense') {
      const expenseType = photoType.split('-')[0];
      setPatioExpenseReceipts(prev => ({ ...prev, [expenseType]: file }));
    }
  };

  const handlePatioExpenseChange = (expenseType: string, checked: boolean) => {
    if (expenseType === 'naoHouve') {
      setPatioExtraExpenses({
        naoHouve: checked,
        gasolina: false,
        pedagio: false,
        estacionamento: false,
        motoboy: false
      });
      if (checked) {
        setPatioExpenseValues({ gasolina: '', pedagio: '', estacionamento: '', motoboy: '' });
        setRawPatioExpenseValues({ gasolina: '', pedagio: '', estacionamento: '', motoboy: '' });
        setPatioExpenseReceipts({ gasolina: null, pedagio: null, estacionamento: null, motoboy: null });
      }
    } else {
      setPatioExtraExpenses(prev => ({ ...prev, naoHouve: false, [expenseType]: checked }));
      if (!checked) {
        setPatioExpenseValues(prev => ({ ...prev, [expenseType]: '' }));
        setRawPatioExpenseValues(prev => ({ ...prev, [expenseType]: '' }));
        setPatioExpenseReceipts(prev => ({ ...prev, [expenseType]: null }));
      }
    }
  };

  const handleCurrencyChange = (expenseKey: string, value: string) => {
    const rawValue = value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;
    const formatted = numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setPatioExpenseValues(prev => ({ ...prev, [expenseKey]: formatted }));
    setRawPatioExpenseValues(prev => ({ ...prev, [expenseKey]: numericValue.toFixed(2) }));
  };

  const resetPatioForm = () => {
    setPatioVehiclePhotos({ frente: null, traseira: null, lateralDireita: null, lateralEsquerda: null, estepe: null, painel: null });
    setPatioExtraExpenses({ naoHouve: true, gasolina: false, pedagio: false, estacionamento: false, motoboy: false });
    setPatioExpenseValues({ gasolina: '', pedagio: '', estacionamento: '', motoboy: '' });
    setRawPatioExpenseValues({ gasolina: '', pedagio: '', estacionamento: '', motoboy: '' });
    setPatioExpenseReceipts({ gasolina: null, pedagio: null, estacionamento: null, motoboy: null });
  };

  const handleConfirmPatioDelivery = async () => {
    const hasAnyPhoto = Object.values(patioVehiclePhotos).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto do veículo no pátio.');
      return;
    }

    const selectedExpenses = Object.entries(patioExtraExpenses).filter(([key, value]) => key !== 'naoHouve' && value);
    for (const [expenseType] of selectedExpenses) {
      if (!rawPatioExpenseValues[expenseType as keyof typeof rawPatioExpenseValues]) {
        setFeedback(`Por favor, informe o valor da despesa: ${expenseType}.`);
        return;
      }
      if (!patioExpenseReceipts[expenseType as keyof typeof patioExpenseReceipts]) {
        setFeedback(`Por favor, anexe o comprovante da despesa: ${expenseType}.`);
        return;
      }
    }

    if (!onConfirmPatioDelivery) {
      setFeedback('Funcionalidade de confirmação não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando confirmação de entrega no pátio...');

    try {
      const photosToUpload = Object.fromEntries(Object.entries(patioVehiclePhotos).filter(([, file]) => file !== null)) as Record<string, File>;
      const expensesList = Object.entries(patioExtraExpenses).filter(([, value]) => value).map(([key]) => ({
        naoHouve: 'Não houve',
        gasolina: 'Gasolina',
        pedagio: 'Pedágio',
        estacionamento: 'Estacionamento',
        motoboy: 'Motoboy (busca de chave)'
      }[key] || key));
      const receiptsToUpload = Object.fromEntries(Object.entries(patioExpenseReceipts).filter(([, file]) => file !== null)) as Record<string, File>;

      await onConfirmPatioDelivery(card.id, photosToUpload, expensesList, rawPatioExpenseValues, receiptsToUpload);

      setFeedback('Entrega no pátio confirmada com sucesso!');
      setTimeout(() => {
        setFeedback('');
        resetPatioForm();
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return {
    feedback,
    isUpdating,
    patioVehiclePhotos,
    patioExtraExpenses,
    patioExpenseValues,
    patioExpenseReceipts,
    getImageUrl,
    handlePhotoUpload,
    handlePatioExpenseChange,
    handleCurrencyChange,
    resetPatioForm,
    handleConfirmPatioDelivery,
  };
}
