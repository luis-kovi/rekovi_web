// components/CardModal/FilaRecolhaActions/AllocateDriverForm.tsx
'use client'

import { useState, useEffect } from 'react'
import type { CardWithSLA } from '@/types'
import { logger } from '@/utils/logger'
import { createClient } from '@/utils/supabase/client'

interface PreApprovedUser {
  nome: string
  email: string
  empresa: string
  permission_type: string
  status: string
  area_atuacao: string[]
}

interface AllocateDriverFormProps {
  card: CardWithSLA;
  onAllocateDriver: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string, billingType: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function AllocateDriverForm({ card, onAllocateDriver, onClose, onBack }: AllocateDriverFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableChofers, setAvailableChofers] = useState<{name: string, email: string}[]>([]);
  const [loadingChofers, setLoadingChofers] = useState(false);

  const [allocateDriverName, setAllocateDriverName] = useState('');
  const [allocateDriverEmail, setAllocateDriverEmail] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [billingType, setBillingType] = useState('');
  const [collectionValue, setCollectionValue] = useState('');
  const [additionalKm, setAdditionalKm] = useState('');

  const loadAvailableChofers = async () => {
    if (!card || !card.empresaResponsavel || !card.origemLocacao) {
      setAvailableChofers([]);
      return;
    }

    setLoadingChofers(true);
    try {
      const response = await fetch(`/api/chofers?empresaResponsavel=${encodeURIComponent(card.empresaResponsavel)}&origemLocacao=${encodeURIComponent(card.origemLocacao)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar chofers');
      }

      const users: PreApprovedUser[] = await response.json();

      if (!users || users.length === 0) {
        setAvailableChofers([]);
        return;
      }

      const filteredChofers = users.filter((user: PreApprovedUser) => {
        return user.email !== card.emailChofer &&
               (!user.nome || !card.chofer || user.nome.toLowerCase() !== card.chofer.toLowerCase());
      });

      const choferOptions = filteredChofers.map((user: PreApprovedUser) => ({
        name: user.nome || user.email.split('@')[0],
        email: user.email
      }));

      setAvailableChofers(choferOptions);
    } catch (error) {
      logger.error('Erro ao carregar chofers:', error);
      setAvailableChofers([]);
    } finally {
      setLoadingChofers(false);
    }
  };

  useEffect(() => {
    loadAvailableChofers();
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const formattedTime = today.toTimeString().slice(0, 5);
    setCollectionDate(formattedDate);
    setCollectionTime(formattedTime);
  }, [card]);

  const resetAllocateForm = () => {
    setAllocateDriverName('');
    setAllocateDriverEmail('');
    setCollectionDate('');
    setCollectionTime('');
    setBillingType('');
    setCollectionValue('');
    setAdditionalKm('');
  };

  const handleAllocateDriver = async () => {
    if (!allocateDriverName || !allocateDriverEmail || !collectionDate || !collectionTime || !billingType) {
      setFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (billingType === 'Avulso' && !collectionValue) {
      setFeedback('Para faturamento avulso, o valor da recolha é obrigatório.');
      return;
    }

    if (!onAllocateDriver) {
      setFeedback('Funcionalidade de alocação não disponível.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando alocação de chofer...');

    try {
      const dateTimeString = `${collectionDate} ${collectionTime}`;
      const finalCollectionValue = billingType === 'Avulso' ? collectionValue : '';

      await onAllocateDriver(card.id, allocateDriverName, allocateDriverEmail, dateTimeString, finalCollectionValue, additionalKm, billingType);

      setFeedback('Chofer alocado com sucesso! Os dados serão atualizados em até 3 minutos.');
      setTimeout(() => {
        setFeedback('');
        resetAllocateForm();
        setIsUpdating(false);
        onClose();
      }, 3000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-200/50 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              onBack();
              resetAllocateForm();
              setFeedback('');
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            Alocar Chofer
          </h3>
        </div>

        {loadingChofers ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Carregando chofers...</span>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                Chofer *
              </label>
              <select
                value={allocateDriverName}
                onChange={(e) => {
                  setAllocateDriverName(e.target.value);
                  const option = availableChofers.find(opt => opt.name === e.target.value);
                  setAllocateDriverEmail(option?.email || '');
                }}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200 text-black"
              >
                <option value="">Selecione um chofer...</option>
                {availableChofers.map(option => (
                  <option key={option.email} value={option.name}>{option.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Data *
                </label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200 text-black"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Hora *
                </label>
                <input
                  type="time"
                  value={collectionTime}
                  onChange={(e) => setCollectionTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200 text-black"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                Tipo de Faturamento *
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200 text-black"
              >
                <option value="">Selecione o tipo...</option>
                <option value="Avulso">Avulso</option>
                <option value="Franquia">Franquia</option>
              </select>
            </div>

            {billingType === 'Avulso' && (
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Valor da Recolha *
                </label>
                <input
                  type="text"
                  value={collectionValue}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = (Number(value) / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    });
                    setCollectionValue(formatted);
                  }}
                  placeholder="R$ 0,00"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200 text-black placeholder-gray-600"
                />
              </div>
            )}

            {billingType === 'Avulso' && (
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                Km Adicional *
              </label>
              <input
                type="text"
                value={additionalKm}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = (Number(value) / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  });
                  setAdditionalKm(formatted);
                }}
                placeholder="R$ 0,00"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200 text-black placeholder-gray-600"
              />
            </div>
            )}

            {feedback && (
              <div className={`text-sm text-center p-3 rounded-lg font-medium ${
                feedback.includes('Erro') || feedback.includes('preencha')
                  ? 'text-red-700 bg-red-100/50 border border-red-200/50'
                  : 'text-green-700 bg-green-100/50 border border-green-200/50'
              }`}>
                {feedback}
              </div>
            )}

            <button
              onClick={handleAllocateDriver}
              disabled={isUpdating}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isUpdating ? 'Processando...' : 'Confirmar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
