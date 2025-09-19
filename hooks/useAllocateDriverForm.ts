// hooks/useAllocateDriverForm.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { CardWithSLA, Card } from '@/types'
import { logger } from '@/utils/logger'

interface PreApprovedUser {
  nome: string
  email: string
}

interface useAllocateDriverFormProps {
  card: CardWithSLA | Card;
  onAllocateDriver: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string, billingType: string) => Promise<void>;
  onClose: () => void;
}

export function useAllocateDriverForm({ card, onAllocateDriver, onClose }: useAllocateDriverFormProps) {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableChofers, setAvailableChofers] = useState<{name: string, email: string}[]>([]);
  const [loadingChofers, setLoadingChofers] = useState(false);
  const [selectedChofer, setSelectedChofer] = useState('');
  const [choferEmail, setChoferEmail] = useState('');
  const [collectionDateTime, setCollectionDateTime] = useState('');
  const [collectionValue, setCollectionValue] = useState('');
  const [additionalKm, setAdditionalKm] = useState('');
  const [billingType, setBillingType] = useState('fixo');
  const [rawCollectionValue, setRawCollectionValue] = useState('');
  const [rawAdditionalKm, setRawAdditionalKm] = useState('');

  const loadAvailableChofers = async () => {
    if (!card || !card.empresaResponsavel || !card.origemLocacao) {
      setAvailableChofers([]);
      return;
    }
    setLoadingChofers(true);
    try {
      const response = await fetch(`/api/chofers?empresaResponsavel=${encodeURIComponent(card.empresaResponsavel)}&origemLocacao=${encodeURIComponent(card.origemLocacao)}`);
      if (!response.ok) throw new Error('Falha ao buscar chofers');
      const users: PreApprovedUser[] = await response.json();
      const choferOptions = users.map(user => ({ name: user.nome, email: user.email }));
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
  }, []);

  const handleCurrencyChange = (setter: (value: string) => void, rawSetter: (value: string) => void, value: string) => {
    const rawValue = value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;
    const formatted = numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setter(formatted);
    rawSetter(numericValue.toFixed(2));
  };

  const handleAllocateDriver = async () => {
    if (!selectedChofer || !collectionDateTime) {
      setFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setIsUpdating(true);
    setFeedback('Alocando chofer...');
    try {
      await onAllocateDriver(card.id, selectedChofer, choferEmail, collectionDateTime, rawCollectionValue, rawAdditionalKm, billingType);
      setFeedback('Chofer alocado com sucesso!');
      setTimeout(() => {
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
    availableChofers,
    loadingChofers,
    selectedChofer,
    setSelectedChofer,
    choferEmail,
    setChoferEmail,
    collectionDateTime,
    setCollectionDateTime,
    collectionValue,
    setCollectionValue,
    additionalKm,
    setAdditionalKm,
    billingType,
    setBillingType,
    handleCurrencyChange,
    handleAllocateDriver
  };
}
