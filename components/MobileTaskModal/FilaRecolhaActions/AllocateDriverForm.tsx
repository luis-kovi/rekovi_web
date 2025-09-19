// components/MobileTaskModal/FilaRecolhaActions/AllocateDriverForm.tsx
'use client'

import { useState, useEffect } from 'react'
import type { Card } from '@/types'
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
  card: Card;
  onAllocateDriver: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function AllocateDriverForm({ card, onAllocateDriver, onClose, onBack }: AllocateDriverFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableChofers, setAvailableChofers] = useState<{name: string, email: string}[]>([]);
  const [loadingChofers, setLoadingChofers] = useState(false);

  const [selectedChofer, setSelectedChofer] = useState('');
  const [choferEmail, setChoferEmail] = useState('');
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
    setSelectedChofer('');
    setChoferEmail('');
    setCollectionDate('');
    setCollectionTime('');
    setBillingType('');
    setCollectionValue('');
    setAdditionalKm('');
  };

  const handleAllocateDriver = async () => {
    if (!selectedChofer || !choferEmail || !collectionDate || !collectionTime || !billingType) {
      setFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (billingType === 'avulso' && !collectionValue) {
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
      const finalCollectionValue = billingType === 'avulso' ? collectionValue : '';

      await onAllocateDriver(card.id, selectedChofer, choferEmail, dateTimeString, finalCollectionValue, additionalKm);

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
    <div className="space-y-4 bg-white rounded-xl p-4 border border-green-200">
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
        <h3 className="text-lg font-bold text-gray-800">Alocar Chofer</h3>
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
      ) : availableChofers.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">
            Não há outros chofers cadastrados para a região.
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Chofer *</label>
            <select
              value={selectedChofer}
              onChange={(e) => {
                setSelectedChofer(e.target.value);
                const option = availableChofers.find(opt => opt.name === e.target.value);
                setChoferEmail(option?.email || '');
              }}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-black"
            >
              <option value="" className="text-gray-500">Selecione um chofer...</option>
              {availableChofers.map(option => (
                <option key={option.email} value={option.name}>{option.name}</option>
              ))}
            </select>
          </div>

          {selectedChofer && (
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">E-mail do Chofer</label>
              <input
                type="email"
                value={choferEmail}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-gray-50 cursor-not-allowed text-gray-900"
                placeholder="E-mail será preenchido automaticamente"
              />
            </div>
          )}
        </>
      )}

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Data prevista de recolha *</label>
        <input
          type="date"
          value={collectionDate}
          onChange={(e) => setCollectionDate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-black"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Hora prevista de recolha *</label>
        <input
          type="time"
          value={collectionTime}
          onChange={(e) => setCollectionTime(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-black"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Tipo de Faturamento *</label>
        <select
          value={billingType}
          onChange={(e) => setBillingType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-black"
        >
          <option value="" style={{ color: '#6B7280' }}>Selecione o tipo...</option>
          <option value="avulso">Avulso</option>
          <option value="franquia">Franquia</option>
        </select>
      </div>

      {billingType === 'avulso' && (
        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block">Valor da Recolha *</label>
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
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white placeholder-gray-600 text-black"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-bold text-gray-700 mb-2 block">Km Adicional *</label>
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
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white placeholder-gray-600 text-black"
        />
      </div>

      {feedback && (
        <div className={`text-sm text-center p-3 rounded-lg font-medium ${
          feedback.includes('Erro') || feedback.includes('preencha')
            ? 'text-red-700 bg-red-100 border border-red-200'
            : 'text-green-700 bg-green-100 border border-green-200'
        }`}>
          {feedback}
        </div>
      )}

      <button
        onClick={handleAllocateDriver}
        disabled={isUpdating}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? 'Processando...' : 'Confirmar'}
      </button>
    </div>
  );
}
