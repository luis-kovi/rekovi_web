// components/MobileTaskModal/ConfirmacaoRecolhaActions/CarTowedForm.tsx
'use client'

import { useState } from 'react'
import type { Card } from '@/types'
import { logger } from '@/utils/logger'

interface CarTowedFormProps {
  card: Card;
  onConfirmCarTowed: (cardId: string, photo: File, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function CarTowedForm({ card, onConfirmCarTowed, onClose, onBack }: CarTowedFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [towedCarPhoto, setTowedCarPhoto] = useState<File | null>(null);
  const [towedExtraExpenses, setTowedExtraExpenses] = useState({
    naoHouve: true,
    gasolina: false,
    pedagio: false,
    estacionamento: false,
    motoboy: false
  });
  const [towedExpenseValues, setTowedExpenseValues] = useState({
    gasolina: '',
    pedagio: '',
    estacionamento: '',
    motoboy: ''
  });
  const [towedExpenseReceipts, setTowedExpenseReceipts] = useState({
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

  const handlePhotoUpload = (photoType: string, file: File, formType: 'towed' | 'expense') => {
    if (formType === 'towed') {
      setTowedCarPhoto(file);
    } else if (formType === 'expense') {
      const expenseType = photoType.split('-')[0];
      setTowedExpenseReceipts(prev => ({ ...prev, [expenseType]: file }));
    }
  };

  const handleTowedExpenseChange = (expenseType: string, checked: boolean) => {
    if (expenseType === 'naoHouve') {
      setTowedExtraExpenses({
        naoHouve: checked,
        gasolina: false,
        pedagio: false,
        estacionamento: false,
        motoboy: false
      });
      if (checked) {
        setTowedExpenseValues({
          gasolina: '',
          pedagio: '',
          estacionamento: '',
          motoboy: ''
        });
        setTowedExpenseReceipts({
          gasolina: null,
          pedagio: null,
          estacionamento: null,
          motoboy: null
        });
      }
    } else {
      setTowedExtraExpenses(prev => ({
        ...prev,
        naoHouve: false,
        [expenseType]: checked
      }));
      if (!checked) {
        setTowedExpenseValues(prev => ({ ...prev, [expenseType]: '' }));
        setTowedExpenseReceipts(prev => ({ ...prev, [expenseType]: null }));
      }
    }
  };

  const resetTowedForm = () => {
    setTowedCarPhoto(null);
    setTowedExtraExpenses({
      naoHouve: true,
      gasolina: false,
      pedagio: false,
      estacionamento: false,
      motoboy: false
    });
    setTowedExpenseValues({
      gasolina: '',
      pedagio: '',
      estacionamento: '',
      motoboy: ''
    });
    setTowedExpenseReceipts({
      gasolina: null,
      pedagio: null,
      estacionamento: null,
      motoboy: null
    });
  };

  const handleCarTowed = async () => {
    if (!towedCarPhoto) {
      setFeedback('Por favor, envie a foto do veículo no guincho.');
      return;
    }

    const selectedExpenses = Object.entries(towedExtraExpenses).filter(([key, value]) => key !== 'naoHouve' && value);
    for (const [expenseType] of selectedExpenses) {
      if (!towedExpenseValues[expenseType as keyof typeof towedExpenseValues]) {
        setFeedback(`Por favor, informe o valor da despesa: ${expenseType}.`);
        return;
      }
      if (!towedExpenseReceipts[expenseType as keyof typeof towedExpenseReceipts]) {
        setFeedback(`Por favor, anexe o comprovante da despesa: ${expenseType}.`);
        return;
      }
    }

    if (!onConfirmCarTowed) {
      setFeedback('Funcionalidade de confirmação não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando confirmação de carro guinchado...');

    try {
      const expensesList = Object.entries(towedExtraExpenses)
        .filter(([key, value]) => value)
        .map(([key]) => {
          const expenseNames: Record<string, string> = {
            naoHouve: 'Não houve',
            gasolina: 'Gasolina',
            pedagio: 'Pedágio',
            estacionamento: 'Estacionamento',
            motoboy: 'Motoboy (busca de chave)'
          };
          return expenseNames[key] || key;
        });

      const receiptsToUpload = Object.fromEntries(
        Object.entries(towedExpenseReceipts).filter(([key, file]) => file !== null)
      ) as Record<string, File>;

      await onConfirmCarTowed(
        card.id,
        towedCarPhoto,
        expensesList,
        towedExpenseValues,
        receiptsToUpload
      );

      setFeedback('Carro guinchado confirmado com sucesso!');
      setTimeout(() => {
        setFeedback('');
        resetTowedForm();
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 bg-white rounded-xl p-4 border border-orange-200 max-h-[60vh] overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            onBack();
            resetTowedForm();
            setFeedback('');
          }}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-800">Carro Guinchado</h3>
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-3 block">Foto do veículo no guincho *</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
          <div className="mb-3">
            <img
              src={getImageUrl(towedCarPhoto, "/images/placeholders/vehicle-on-tow.jpg")}
              alt={towedCarPhoto ? "Foto do veículo no guincho" : "Formato esperado da imagem"}
              className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              {towedCarPhoto ? "Foto anexada" : "Formato esperado da imagem"}
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload('towed', file, 'towed');
            }}
            className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-3 block">Houveram despesas extras no processo de recolha? *</label>
        <div className="space-y-3">
          {[
            { key: 'naoHouve', label: 'Não houve' },
            { key: 'gasolina', label: 'Gasolina' },
            { key: 'pedagio', label: 'Pedágio' },
            { key: 'estacionamento', label: 'Estacionamento' },
            { key: 'motoboy', label: 'Motoboy (busca de chave)' }
          ].map((expense) => (
            <div key={expense.key} className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={towedExtraExpenses[expense.key as keyof typeof towedExtraExpenses]}
                  onChange={(e) => handleTowedExpenseChange(expense.key, e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{expense.label}</span>
              </label>

              {expense.key !== 'naoHouve' && towedExtraExpenses[expense.key as keyof typeof towedExtraExpenses] && (
                <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Valor do {expense.label.toLowerCase()}
                    </label>
                    <input
                      type="text"
                      value={towedExpenseValues[expense.key as keyof typeof towedExpenseValues]}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = (Number(value) / 100).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        });
                        setTowedExpenseValues(prev => ({ ...prev, [expense.key]: formatted }));
                      }}
                      placeholder="R$ 0,00"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-black placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Comprovante de pagamento do {expense.label.toLowerCase()}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(`${expense.key}-towed`, file, 'expense');
                      }}
                      className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
                    />
                    {towedExpenseReceipts[expense.key as keyof typeof towedExpenseReceipts] && (
                      <p className="text-xs text-green-600 mt-1">✓ Comprovante enviado</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`text-sm text-center p-3 rounded-lg font-medium ${
          feedback.includes('Erro') || feedback.includes('Por favor')
            ? 'text-red-700 bg-red-100 border border-red-200'
            : 'text-green-700 bg-green-100 border border-green-200'
        }`}>
          {feedback}
        </div>
      )}

      <button
        onClick={handleCarTowed}
        disabled={isUpdating}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Processando...' : 'Confirmar'}
      </button>
    </div>
  );
}
