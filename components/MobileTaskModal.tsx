// components/MobileTaskModal.tsx
'use client'

import { useState, useEffect } from 'react'
import type { Card } from '@/types'
import { createClient } from '@/utils/supabase/client'
import { extractCityFromOrigin } from '@/utils/auth-validation'

interface MobileTaskModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  permissionType: string
  initialTab?: 'details' | 'actions' | 'history'
}

export default function MobileTaskModal({ card, isOpen, onClose, permissionType, initialTab = 'details' }: MobileTaskModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'history'>(initialTab)

  // Estados para os formulários
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estados para fila de recolha
  const [showAllocateDriver, setShowAllocateDriver] = useState(false);
  const [showRejectCollection, setShowRejectCollection] = useState(false);
  const [selectedChofer, setSelectedChofer] = useState('');
  const [choferEmail, setChoferEmail] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [billingType, setBillingType] = useState('');
  const [collectionValue, setCollectionValue] = useState('');
  const [additionalKm, setAdditionalKm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionObservations, setRejectionObservations] = useState('');
  
  // Estados para tentativas de recolha
  const [showUnlockVehicle, setShowUnlockVehicle] = useState(false);
  const [showRequestTowing, setShowRequestTowing] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  
  // Estados para desbloquear veículo
  const [vehiclePhotos, setVehiclePhotos] = useState({
    frente: null as File | null,
    traseira: null as File | null,
    lateralDireita: null as File | null,
    lateralEsquerda: null as File | null,
    estepe: null as File | null,
    painel: null as File | null
  });
  const [unlockObservations, setUnlockObservations] = useState('');
  
  // Estados para solicitar guincho
  const [towingReason, setTowingReason] = useState('');
  const [towingPhotos, setTowingPhotos] = useState({
    frente: null as File | null,
    traseira: null as File | null,
    lateralDireita: null as File | null,
    lateralEsquerda: null as File | null,
    estepe: null as File | null,
    painel: null as File | null
  });
  const [towingObservations, setTowingObservations] = useState('');
  
  // Estados para reportar problema
  const [problemType, setProblemType] = useState('');
  const [problemEvidence, setProblemEvidence] = useState({
    photo1: null as File | null,
    photo2: null as File | null,
    photo3: null as File | null
  });

  // Estados para Confirmação de Entrega no Pátio
  const [showConfirmPatioDelivery, setShowConfirmPatioDelivery] = useState(false);
  const [showCarTowed, setShowCarTowed] = useState(false);
  const [showRequestTowMechanical, setShowRequestTowMechanical] = useState(false);
  
  // Estados para confirmar entrega no pátio
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
  const [patioExpenseReceipts, setPatioExpenseReceipts] = useState({
    gasolina: null as File | null,
    pedagio: null as File | null,
    estacionamento: null as File | null,
    motoboy: null as File | null
  });
  
  // Estados para carro guinchado
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
  
  // Estados para solicitar guincho (problemas mecânicos)
  const [mechanicalTowReason, setMechanicalTowReason] = useState('');

  // Estados para buscar chofers disponíveis
  const [availableChofers, setAvailableChofers] = useState<{name: string, email: string}[]>([]);
  const [loadingChofers, setLoadingChofers] = useState(false);

  // Identificar fases
  const isFila = card.faseAtual === 'Fila de Recolha';
  const isTentativaRecolha = [
    'Tentativa 1 de Recolha', 
    'Tentativa 2 de Recolha', 
    'Tentativa 3 de Recolha', 
    'Nova tentativa de recolha'
  ].includes(card.faseAtual);
  const isConfirmacaoRecolha = card.faseAtual === 'Confirmação de Entrega no Pátio';

  // Função para buscar chofers disponíveis da base de dados
  const loadAvailableChofers = async () => {
    if (!card || !card.empresaResponsavel || !card.origemLocacao) {
      setAvailableChofers([]);
      return;
    }

    setLoadingChofers(true);
    try {
      const supabase = createClient();
      
      // Extrair cidade de origem do card
      const cardCity = extractCityFromOrigin(card.origemLocacao).toLowerCase();
      
      // Buscar usuários com as condições especificadas
      const { data: users, error } = await supabase
        .from('pre_approved_users')
        .select('nome, email, empresa, permission_type, status, area_atuacao')
        .eq('empresa', card.empresaResponsavel)
        .eq('permission_type', 'chofer')
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao buscar chofers:', error);
        setAvailableChofers([]);
        return;
      }

      if (!users || users.length === 0) {
        setAvailableChofers([]);
        return;
      }

      // Filtrar por área de atuação e excluir o chofer atual
      const filteredChofers = users.filter(user => {
        // Excluir chofer atual (comparar por email se disponível, senão por nome)
        const isCurrentChofer = user.email === card.emailChofer || 
                               user.nome?.toLowerCase() === card.chofer?.toLowerCase();
        if (isCurrentChofer) return false;

        // Verificar se atua na região
        if (!user.area_atuacao || !Array.isArray(user.area_atuacao)) return false;
        
        return user.area_atuacao.some((area: string) => {
          const areaCity = area.toLowerCase();
          return cardCity.includes(areaCity) || 
                 areaCity.includes(cardCity) ||
                 cardCity === areaCity;
        });
      });

      // Mapear para o formato esperado
      const choferOptions = filteredChofers.map(user => ({
        name: user.nome || user.email.split('@')[0],
        email: user.email
      }));

      setAvailableChofers(choferOptions);
    } catch (error) {
      console.error('Erro ao carregar chofers:', error);
      setAvailableChofers([]);
    } finally {
      setLoadingChofers(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Funções para fila de recolha
  const handleAllocateDriver = async () => {
    if (!selectedChofer || !choferEmail || !collectionDate || !collectionTime || !billingType || !additionalKm) {
      setFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (billingType === 'avulso' && !collectionValue) {
      setFeedback('Para faturamento avulso, o valor da recolha é obrigatório.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando alocação de chofer...');
    
    try {
      console.log('Dados da alocação (mobile):', {
        cardId: card.id,
        driver: selectedChofer,
        email: choferEmail,
        date: collectionDate,
        time: collectionTime,
        billing: billingType,
        value: collectionValue,
        additionalKm
      });

      setFeedback('Chofer alocado com sucesso!');
      setTimeout(() => {
        setShowAllocateDriver(false);
        setFeedback('');
        resetAllocateForm();
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  const handleRejectCollection = async () => {
    if (!rejectionReason || !rejectionObservations) {
      setFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando rejeição de recolha...');
    
    try {
      console.log('Dados da rejeição (mobile):', {
        cardId: card.id,
        reason: rejectionReason,
        observations: rejectionObservations
      });

      setFeedback('Recolha rejeitada com sucesso!');
      setTimeout(() => {
        setShowRejectCollection(false);
        setFeedback('');
        resetRejectForm();
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  // Funções para tentativas de recolha
  const handleUnlockVehicle = async () => {
    const hasAnyPhoto = Object.values(vehiclePhotos).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto do veículo.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando desbloqueio do veículo...');
    
    try {
      console.log('Dados do desbloqueio (mobile):', {
        cardId: card.id,
        photos: vehiclePhotos,
        observations: unlockObservations
      });

      setFeedback('Veículo desbloqueado com sucesso!');
      setTimeout(() => {
        setShowUnlockVehicle(false);
        setFeedback('');
        resetUnlockForm();
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  const handleRequestTowing = async () => {
    if (!towingReason) {
      setFeedback('Por favor, selecione o motivo do guincho.');
      return;
    }

    const hasAnyPhoto = Object.values(towingPhotos).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto do veículo.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando solicitação de guincho...');
    
    try {
      console.log('Dados do guincho (mobile):', {
        cardId: card.id,
        reason: towingReason,
        photos: towingPhotos,
        observations: towingObservations
      });

      setFeedback('Guincho solicitado com sucesso!');
      setTimeout(() => {
        setShowRequestTowing(false);
        setFeedback('');
        resetTowingForm();
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  const handleReportProblem = async () => {
    if (!problemType) {
      setFeedback('Por favor, selecione a dificuldade encontrada.');
      return;
    }

    const hasAnyPhoto = Object.values(problemEvidence).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto como evidência.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando relato do problema...');
    
    try {
      console.log('Dados do problema (mobile):', {
        cardId: card.id,
        type: problemType,
        evidence: problemEvidence
      });

      setFeedback('Problema reportado com sucesso!');
      setTimeout(() => {
        setShowReportProblem(false);
        setFeedback('');
        resetProblemForm();
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  // Funções para resetar formulários
  const resetAllocateForm = () => {
    setSelectedChofer('');
    setChoferEmail('');
    setCollectionDate('');
    setCollectionTime('');
    setBillingType('');
    setCollectionValue('');
    setAdditionalKm('');
  };

  const resetRejectForm = () => {
    setRejectionReason('');
    setRejectionObservations('');
  };

  const resetUnlockForm = () => {
    setVehiclePhotos({
      frente: null,
      traseira: null,
      lateralDireita: null,
      lateralEsquerda: null,
      estepe: null,
      painel: null
    });
    setUnlockObservations('');
  };

  const resetTowingForm = () => {
    setTowingReason('');
    setTowingPhotos({
      frente: null,
      traseira: null,
      lateralDireita: null,
      lateralEsquerda: null,
      estepe: null,
      painel: null
    });
    setTowingObservations('');
  };

  const resetProblemForm = () => {
    setProblemType('');
    setProblemEvidence({
      photo1: null,
      photo2: null,
      photo3: null
    });
  };

  // Função para obter URL da imagem (foto anexada ou ilustrativa)
  const getImageUrl = (file: File | null, defaultImageUrl: string): string => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return defaultImageUrl;
  };

  // Função para lidar com upload de fotos
  const handlePhotoUpload = (photoType: string, file: File, formType: 'vehicle' | 'towing' | 'problem' | 'patio' | 'towed' | 'expense') => {
    if (formType === 'vehicle') {
      setVehiclePhotos(prev => ({ ...prev, [photoType]: file }));
    } else if (formType === 'towing') {
      setTowingPhotos(prev => ({ ...prev, [photoType]: file }));
    } else if (formType === 'problem') {
      setProblemEvidence(prev => ({ ...prev, [photoType]: file }));
    } else if (formType === 'patio') {
      setPatioVehiclePhotos(prev => ({ ...prev, [photoType]: file }));
    } else if (formType === 'towed') {
      setTowedCarPhoto(file);
    } else if (formType === 'expense') {
      const [expenseType, receiptType] = photoType.split('-');
      if (receiptType === 'patio') {
        setPatioExpenseReceipts(prev => ({ ...prev, [expenseType]: file }));
      } else if (receiptType === 'towed') {
        setTowedExpenseReceipts(prev => ({ ...prev, [expenseType]: file }));
      }
    }
  };

  // Funções para manipular despesas extras
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
        setPatioExpenseValues({
          gasolina: '',
          pedagio: '',
          estacionamento: '',
          motoboy: ''
        });
        setPatioExpenseReceipts({
          gasolina: null,
          pedagio: null,
          estacionamento: null,
          motoboy: null
        });
      }
    } else {
      setPatioExtraExpenses(prev => ({
        ...prev,
        naoHouve: false,
        [expenseType]: checked
      }));
      if (!checked) {
        setPatioExpenseValues(prev => ({ ...prev, [expenseType]: '' }));
        setPatioExpenseReceipts(prev => ({ ...prev, [expenseType]: null }));
      }
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

  // Funções para as ações de Confirmação de Recolha
  const handleConfirmPatioDelivery = async () => {
    const hasAnyPhoto = Object.values(patioVehiclePhotos).some(photo => photo !== null);
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto do veículo no pátio.');
      return;
    }

    const selectedExpenses = Object.entries(patioExtraExpenses).filter(([key, value]) => key !== 'naoHouve' && value);
    for (const [expenseType] of selectedExpenses) {
      if (!patioExpenseValues[expenseType as keyof typeof patioExpenseValues]) {
        setFeedback(`Por favor, informe o valor da despesa: ${expenseType}.`);
        return;
      }
      if (!patioExpenseReceipts[expenseType as keyof typeof patioExpenseReceipts]) {
        setFeedback(`Por favor, anexe o comprovante da despesa: ${expenseType}.`);
        return;
      }
    }

    setIsUpdating(true);
    setFeedback('Processando confirmação de entrega no pátio...');
    
    try {
      console.log('Dados da entrega no pátio (mobile):', {
        cardId: card.id,
        photos: patioVehiclePhotos,
        expenses: patioExtraExpenses,
        expenseValues: patioExpenseValues,
        expenseReceipts: patioExpenseReceipts
      });

      setFeedback('Entrega no pátio confirmada com sucesso!');
      setTimeout(() => {
        setShowConfirmPatioDelivery(false);
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

    setIsUpdating(true);
    setFeedback('Processando confirmação de carro guinchado...');
    
    try {
      console.log('Dados do carro guinchado (mobile):', {
        cardId: card.id,
        towPhoto: towedCarPhoto,
        expenses: towedExtraExpenses,
        expenseValues: towedExpenseValues,
        expenseReceipts: towedExpenseReceipts
      });

      setFeedback('Carro guinchado confirmado com sucesso!');
      setTimeout(() => {
        setShowCarTowed(false);
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

  const handleRequestTowMechanical = async () => {
    if (!mechanicalTowReason.trim()) {
      setFeedback('Por favor, detalhe o motivo do guincho.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando solicitação de guincho...');
    
    try {
      console.log('Dados da solicitação de guincho mecânico (mobile):', {
        cardId: card.id,
        reason: mechanicalTowReason
      });

      setFeedback('Guincho solicitado com sucesso!');
      setTimeout(() => {
        setShowRequestTowMechanical(false);
        setFeedback('');
        setMechanicalTowReason('');
        setIsUpdating(false);
        onClose();
      }, 2000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  // Funções para resetar os formulários de confirmação
  const resetPatioForm = () => {
    setPatioVehiclePhotos({
      frente: null,
      traseira: null,
      lateralDireita: null,
      lateralEsquerda: null,
      estepe: null,
      painel: null
    });
    setPatioExtraExpenses({
      naoHouve: true,
      gasolina: false,
      pedagio: false,
      estacionamento: false,
      motoboy: false
    });
    setPatioExpenseValues({
      gasolina: '',
      pedagio: '',
      estacionamento: '',
      motoboy: ''
    });
    setPatioExpenseReceipts({
      gasolina: null,
      pedagio: null,
      estacionamento: null,
      motoboy: null
    });
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

  // Configurar data atual ao abrir formulários
  useEffect(() => {
    if (showAllocateDriver) {
      loadAvailableChofers();
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      const formattedTime = today.toTimeString().slice(0, 5);
      setCollectionDate(formattedDate);
      setCollectionTime(formattedTime);
    }
  }, [showAllocateDriver]);

  // Função para adaptar nomes das fases para melhor legibilidade
  const adaptPhaseName = (phase: string) => {
    const adaptations: { [key: string]: string } = {
      'Tentativa 1 de Recolha': 'Tentativa 1',
      'Tentativa 2 de Recolha': 'Tentativa 2',
      'Tentativa 3 de Recolha': 'Tentativa 3',
      'Nova tentativa de recolha': 'Nova Tentativa',
      'Confirmação de Entrega no Pátio': 'Confirmação de Entrega'
    }
    return adaptations[phase] || phase
  }

  // Função para obter cor da fase
  const getPhaseColor = (phase: string) => {
    const colors: { [key: string]: string } = {
      'Fila de Recolha': 'bg-blue-100 text-blue-800',
      'Aprovar Custo de Recolha': 'bg-yellow-100 text-yellow-800',
      'Tentativa 1 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 2 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 3 de Recolha': 'bg-red-100 text-red-800',
      'Desbloquear Veículo': 'bg-purple-100 text-purple-800',
      'Solicitar Guincho': 'bg-indigo-100 text-indigo-800',
      'Nova tentativa de recolha': 'bg-green-100 text-green-800',
      'Confirmação de Entrega no Pátio': 'bg-green-100 text-green-800'
    }
    return colors[phase] || 'bg-gray-100 text-gray-800'
  }

  // Função para copiar para clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Aqui você poderia adicionar um toast de confirmação
  }

  // Função para abrir mapa
  const openMap = (link: string) => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  // Função para fazer ligação
  const makeCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone.replace(/\D/g, '')}`
    }
  }

  // Função para enviar email
  const sendEmail = (email: string) => {
    if (email) {
      window.location.href = `mailto:${email}`
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm mobile-modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 mobile-modal-content mobile-shadow-lg z-[10000] ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{card.placa}</h2>
                <p className="text-sm text-gray-500">{card.nomeDriver}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'details', label: 'Detalhes', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'actions', label: 'Ações', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
            { id: 'history', label: 'Histórico', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'details' | 'actions' | 'history')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-[#FF355A] border-b-2 border-[#FF355A]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[75vh] overflow-y-auto">
          <div className="min-h-[400px]">
            {activeTab === 'details' && (
              <div className="p-4 space-y-4">
                {/* Status e Fase Atual */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      Status Atual
                    </h3>
                    <span className="text-xs text-gray-500">{formatDate(card.dataCriacao)}</span>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getPhaseColor(card.faseAtual)}`}>
                    {adaptPhaseName(card.faseAtual)}
                  </div>
                </div>

                {/* Grid Layout Compacto */}
                <div className="grid grid-cols-1 gap-4">
                  
                  {/* Veículo - Layout Horizontal Compacto */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Informações do Veículo</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Placa</p>
                        <p className="font-bold text-lg text-gray-900">{card.placa}</p>
                      </div>
                      {card.modeloVeiculo && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Modelo</p>
                          <p className="font-medium text-sm text-gray-900">{card.modeloVeiculo}</p>
                        </div>
                      )}
                    </div>

                    {/* Localização com destaque */}
                    {card.enderecoRecolha && (
                      <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-orange-700">📍 Localização</p>
                          {card.linkMapa && (
                            <button
                              onClick={() => openMap(card.linkMapa!)}
                              className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-md text-xs text-orange-700 hover:bg-orange-200 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              Maps
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed">{card.enderecoRecolha}</p>
                      </div>
                    )}

                    {card.origemLocacao && (
                      <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-100">
                        <p className="text-xs font-medium text-green-700 mb-1">🎯 Local para Entrega</p>
                        <p className="text-xs text-gray-800">{card.origemLocacao}</p>
                      </div>
                    )}
                  </div>

                  {/* Cliente - Layout Compacto com Ações */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Cliente</h4>
                    </div>

                    {card.nomeDriver && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-600 mb-1">Nome</p>
                        <p className="font-semibold text-gray-900">{card.nomeDriver}</p>
                      </div>
                    )}

                    {/* Telefones em Grid */}
                    <div className="grid grid-cols-1 gap-2">
                      {card.telefoneContato && (
                        <button
                          onClick={() => makeCall(card.telefoneContato!)}
                          className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div className="text-left">
                              <p className="text-xs text-green-600">Telefone Principal</p>
                              <p className="font-medium text-sm text-gray-900">{card.telefoneContato}</p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}

                      {card.telefoneOpcional && (
                        <button
                          onClick={() => makeCall(card.telefoneOpcional!)}
                          className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div className="text-left">
                              <p className="text-xs text-yellow-600">Telefone Opcional</p>
                              <p className="font-medium text-sm text-gray-900">{card.telefoneOpcional}</p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Endereço de Cadastro */}
                    {card.enderecoCadastro && (
                      <div className="mt-3 bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-purple-700">🏠 Endereço de Cadastro</p>
                          <button
                            onClick={() => copyToClipboard(card.enderecoCadastro!)}
                            className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-md text-xs text-purple-700 hover:bg-purple-200 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar
                          </button>
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed">{card.enderecoCadastro}</p>
                      </div>
                    )}
                  </div>

                  {/* Prestador - Layout Compacto */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Prestador</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {card.empresaResponsavel && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Empresa</p>
                          <p className="font-medium text-sm text-gray-900">{card.empresaResponsavel}</p>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Chofer</p>
                        <p className="font-medium text-sm text-gray-900">
                          {card.chofer ? card.chofer : <span className="italic text-gray-400">Não há chofer alocado</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="h-full min-h-[500px] p-4">
                {isFila ? (
                  /* Interface para Fila de Recolha */
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Gerenciar Recolha</h3>
                      <p className="text-sm text-gray-500">Escolha uma das opções abaixo</p>
                    </div>

                    {!showAllocateDriver && !showRejectCollection && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowAllocateDriver(true)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Alocar Chofer
                        </button>
                        
                        <button
                          onClick={() => setShowRejectCollection(true)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rejeitar Recolha
                        </button>
                      </div>
                    )}

                    {/* Formulário Alocar Chofer */}
                    {showAllocateDriver && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowAllocateDriver(false);
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
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-gray-900"
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
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Hora prevista de recolha *</label>
                          <input 
                            type="time" 
                            value={collectionTime}
                            onChange={(e) => setCollectionTime(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Tipo de Faturamento *</label>
                          <select 
                            value={billingType}
                            onChange={(e) => setBillingType(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white text-gray-900"
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
                              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white placeholder-gray-500 text-gray-900"
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
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white placeholder-gray-500 text-gray-900"
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
                    )}

                    {/* Formulário Rejeitar Recolha */}
                    {showRejectCollection && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-red-200">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowRejectCollection(false);
                              resetRejectForm();
                              setFeedback('');
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">Rejeitar Recolha</h3>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Motivo da não recolha *</label>
                          <select 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white"
                          >
                            <option value="" style={{ color: '#6B7280' }}>Selecione um motivo...</option>
                            <option value="cliente_pagamento">Cliente realizou pagamento</option>
                            <option value="cliente_devolveu">Cliente já devolveu o veículo</option>
                            <option value="veiculo_recolhido">Veículo já recolhido</option>
                            <option value="fora_area">Fora da área de atuação</option>
                            <option value="duplicada">Solicitação duplicada</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Observações *</label>
                          <textarea 
                            value={rejectionObservations}
                            onChange={(e) => setRejectionObservations(e.target.value)}
                            rows={4}
                            placeholder="Descreva detalhes adicionais sobre a rejeição..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white resize-none placeholder-gray-500"
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
                          onClick={handleRejectCollection}
                          disabled={isUpdating}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Processando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : isTentativaRecolha ? (
                  /* Interface para Tentativas de Recolha */
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Ações de Recolha</h3>
                      <p className="text-sm text-gray-500">Selecione uma ação para prosseguir</p>
                    </div>

                    {!showUnlockVehicle && !showRequestTowing && !showReportProblem && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowUnlockVehicle(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Desbloquear Veículo
                        </button>
                        
                        <button
                          onClick={() => setShowRequestTowing(true)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                          Solicitar Guincho
                        </button>

                        <button
                          onClick={() => setShowReportProblem(true)}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Reportar Problema
                        </button>
                      </div>
                    )}

                    {/* Formulário Desbloquear Veículo */}
                    {showUnlockVehicle && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowUnlockVehicle(false);
                              resetUnlockForm();
                              setFeedback('');
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">Desbloquear Veículo</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'frente', label: 'Foto da Frente', image: 'https://i.ibb.co/tMqXPvs9/frente.png' },
                            { key: 'traseira', label: 'Foto da Traseira', image: 'https://i.ibb.co/YTWw79s1/traseira.jpg' },
                            { key: 'lateralDireita', label: 'Lateral Direita', image: 'https://i.ibb.co/mrDwHRn6/lateral-d.jpg' },
                            { key: 'lateralEsquerda', label: 'Lateral Esquerda', image: 'https://i.ibb.co/jZPXMq92/lateral-e.jpg' },
                            { key: 'estepe', label: 'Foto do Estepe', image: 'https://i.ibb.co/Y4jmyW7v/estepe.jpg' },
                            { key: 'painel', label: 'Foto do Painel', image: 'https://i.ibb.co/PGX4bNd8/painel.jpg' },
                          ].map((photo) => (
                            <div key={photo.key} className="space-y-2">
                              <p className="text-xs font-bold text-gray-700">{photo.label}</p>
                              <div className="w-full aspect-square">
                                <img
                                  src={getImageUrl(vehiclePhotos[photo.key as keyof typeof vehiclePhotos], photo.image)}
                                  alt={photo.label}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handlePhotoUpload(photo.key, file, 'vehicle');
                                  }
                                }}
                                className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
                              />
                              {vehiclePhotos[photo.key as keyof typeof vehiclePhotos] && (
                                <p className="text-xs text-green-600">✓ Foto enviada</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Observações</label>
                          <textarea 
                            value={unlockObservations}
                            onChange={(e) => setUnlockObservations(e.target.value)}
                            rows={3}
                            placeholder="Observações adicionais (opcional)..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white resize-none placeholder-gray-500"
                          />
                        </div>

                        {feedback && (
                          <div className={`text-sm text-center p-3 rounded-lg font-medium ${
                            feedback.includes('Erro') || feedback.includes('pelo menos') 
                              ? 'text-red-700 bg-red-100 border border-red-200' 
                              : 'text-green-700 bg-green-100 border border-green-200'
                          }`}>
                            {feedback}
                          </div>
                        )}

                        <button 
                          onClick={handleUnlockVehicle}
                          disabled={isUpdating}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Processando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}

                    {/* Formulário Solicitar Guincho */}
                    {showRequestTowing && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowRequestTowing(false);
                              resetTowingForm();
                              setFeedback('');
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">Solicitar Guincho</h3>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Motivo do guincho *</label>
                          <select 
                            value={towingReason}
                            onChange={(e) => setTowingReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white"
                          >
                            <option value="" style={{ color: '#6B7280' }}>Selecione o motivo...</option>
                            <option value="carro_abandonado">Carro abandonado na rua (sem chave)</option>
                            <option value="problemas_mecanicos">Problemas mecânicos / elétricos</option>
                            <option value="colisao">Colisão (não está rodando)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'frente', label: 'Foto da Frente', image: 'https://i.ibb.co/tMqXPvs9/frente.png' },
                            { key: 'traseira', label: 'Foto da Traseira', image: 'https://i.ibb.co/YTWw79s1/traseira.jpg' },
                            { key: 'lateralDireita', label: 'Lateral Direita', image: 'https://i.ibb.co/mrDwHRn6/lateral-d.jpg' },
                            { key: 'lateralEsquerda', label: 'Lateral Esquerda', image: 'https://i.ibb.co/jZPXMq92/lateral-e.jpg' },
                            ...(towingReason !== 'carro_abandonado' ? [
                              { key: 'estepe', label: 'Foto do Estepe', image: 'https://i.ibb.co/Y4jmyW7v/estepe.jpg' },
                              { key: 'painel', label: 'Foto do Painel', image: 'https://i.ibb.co/PGX4bNd8/painel.jpg' },
                            ] : [])
                          ].map((photo) => (
                            <div key={photo.key} className="space-y-2">
                              <p className="text-xs font-bold text-gray-700">{photo.label}</p>
                              <div className="w-full aspect-square">
                                <img
                                  src={getImageUrl(towingPhotos[photo.key as keyof typeof towingPhotos], photo.image)}
                                  alt={photo.label}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handlePhotoUpload(photo.key, file, 'towing');
                                  }
                                }}
                                className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
                              />
                              {towingPhotos[photo.key as keyof typeof towingPhotos] && (
                                <p className="text-xs text-green-600">✓ Foto enviada</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Observações</label>
                          <textarea 
                            value={towingObservations}
                            onChange={(e) => setTowingObservations(e.target.value)}
                            rows={3}
                            placeholder="Observações adicionais (opcional)..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white resize-none placeholder-gray-500"
                          />
                        </div>

                        {feedback && (
                          <div className={`text-sm text-center p-3 rounded-lg font-medium ${
                            feedback.includes('Erro') || feedback.includes('selecione') || feedback.includes('pelo menos') 
                              ? 'text-red-700 bg-red-100 border border-red-200' 
                              : 'text-green-700 bg-green-100 border border-green-200'
                          }`}>
                            {feedback}
                          </div>
                        )}

                        <button 
                          onClick={handleRequestTowing}
                          disabled={isUpdating}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Processando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}

                    {/* Formulário Reportar Problema */}
                    {showReportProblem && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowReportProblem(false);
                              resetProblemForm();
                              setFeedback('');
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">Reportar Problema</h3>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Qual a dificuldade encontrada na recolha? *</label>
                          <select 
                            value={problemType}
                            onChange={(e) => setProblemType(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white"
                          >
                            <option value="" style={{ color: '#6B7280' }}>Selecione a dificuldade...</option>
                            <option value="cliente_regularizou">Cliente regularizou o pagamento</option>
                            <option value="cliente_recusa_pagamento">Cliente recusa a entrega e informa que vai fazer o pagamento</option>
                            <option value="cliente_recusa_problemas">Cliente recusa a entrega devido a problemas com a Kovi</option>
                            <option value="carro_localizado_cliente_nao">Carro localizado, mas cliente não encontrado</option>
                            <option value="carro_nao_localizado">Carro não localizado e sem contato com o cliente</option>
                          </select>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-2">Evidências da dificuldade</p>
                          <p className="text-xs text-gray-500 mb-3">Envie fotos da rua, da garagem que evidencie a dificuldade na recolha</p>
                          
                          <div className="grid grid-cols-3 gap-3">
                            {['photo1', 'photo2', 'photo3'].map((photoKey, index) => (
                              <div key={photoKey} className="space-y-2">
                                <p className="text-xs font-bold text-gray-700">Foto {index + 1}</p>
                                <div className="w-full aspect-square bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handlePhotoUpload(photoKey, file, 'problem');
                                    }
                                  }}
                                  className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
                                />
                                {problemEvidence[photoKey as keyof typeof problemEvidence] && (
                                  <p className="text-xs text-green-600">✓ Foto enviada</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {feedback && (
                          <div className={`text-sm text-center p-3 rounded-lg font-medium ${
                            feedback.includes('Erro') || feedback.includes('selecione') || feedback.includes('pelo menos') 
                              ? 'text-red-700 bg-red-100 border border-red-200' 
                              : 'text-green-700 bg-green-100 border border-green-200'
                          }`}>
                            {feedback}
                          </div>
                        )}

                        <button 
                          onClick={handleReportProblem}
                          disabled={isUpdating}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Processando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : isConfirmacaoRecolha ? (
                  /* Interface para Confirmação de Entrega no Pátio */
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmação de Recolha</h3>
                      <p className="text-sm text-gray-500">Selecione uma das opções para finalizar</p>
                    </div>

                    {!showConfirmPatioDelivery && !showCarTowed && !showRequestTowMechanical && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowConfirmPatioDelivery(true)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Confirmar entrega no pátio
                        </button>
                        
                        <button
                          onClick={() => setShowCarTowed(true)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                          Carro guinchado
                        </button>

                        <button
                          onClick={() => setShowRequestTowMechanical(true)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="text-center">
                            <div>Solicitar guincho</div>
                            <div className="text-xs opacity-90">(problemas mecânicos)</div>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Formulário Confirmar Entrega no Pátio */}
                    {showConfirmPatioDelivery && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-green-200 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowConfirmPatioDelivery(false);
                              resetPatioForm();
                              setFeedback('');
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">Confirmar Entrega no Pátio</h3>
                        </div>

                        {/* Fotos do Veículo no Pátio */}
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-3">Fotos do veículo no pátio *</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { key: 'frente', label: 'Foto da Frente', image: 'https://i.ibb.co/tMqXPvs9/frente.png' },
                              { key: 'traseira', label: 'Foto da Traseira', image: 'https://i.ibb.co/YTWw79s1/traseira.jpg' },
                              { key: 'lateralDireita', label: 'Lateral Direita', image: 'https://i.ibb.co/mrDwHRn6/lateral-d.jpg' },
                              { key: 'lateralEsquerda', label: 'Lateral Esquerda', image: 'https://i.ibb.co/jZPXMq92/lateral-e.jpg' },
                              { key: 'estepe', label: 'Foto do Estepe', image: 'https://i.ibb.co/Y4jmyW7v/estepe.jpg' },
                              { key: 'painel', label: 'Foto do Painel', image: 'https://i.ibb.co/PGX4bNd8/painel.jpg' }
                            ].map((photo) => (
                              <div key={photo.key} className="space-y-2">
                                <p className="text-xs font-bold text-gray-700">{photo.label}</p>
                                <div className="w-full aspect-square">
                                  <img
                                    src={getImageUrl(patioVehiclePhotos[photo.key as keyof typeof patioVehiclePhotos], photo.image)}
                                    alt={photo.label}
                                    className="w-full h-full object-cover rounded"
                                  />
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handlePhotoUpload(photo.key, file, 'patio');
                                    }
                                  }}
                                  className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
                                />
                                {patioVehiclePhotos[photo.key as keyof typeof patioVehiclePhotos] && (
                                  <p className="text-xs text-green-600">✓ Foto enviada</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Despesas Extras */}
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-3">Houveram despesas extras no processo de recolha? *</p>
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
                                    checked={patioExtraExpenses[expense.key as keyof typeof patioExtraExpenses]}
                                    onChange={(e) => handlePatioExpenseChange(expense.key, e.target.checked)}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-sm text-gray-700">{expense.label}</span>
                                </label>
                                
                                {expense.key !== 'naoHouve' && patioExtraExpenses[expense.key as keyof typeof patioExtraExpenses] && (
                                  <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Valor do {expense.label.toLowerCase()}
                                      </label>
                                      <input
                                        type="text"
                                        value={patioExpenseValues[expense.key as keyof typeof patioExpenseValues]}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/\D/g, '');
                                          const formatted = (Number(value) / 100).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                          });
                                          setPatioExpenseValues(prev => ({ ...prev, [expense.key]: formatted }));
                                        }}
                                        placeholder="R$ 0,00"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 placeholder-gray-500"
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
                                          if (file) handlePhotoUpload(`${expense.key}-patio`, file, 'expense');
                                        }}
                                        className="w-full text-xs p-1 border border-gray-300 rounded bg-white"
                                      />
                                      {patioExpenseReceipts[expense.key as keyof typeof patioExpenseReceipts] && (
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
                          onClick={handleConfirmPatioDelivery}
                          disabled={isUpdating}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Processando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}

                    {/* Formulário Carro Guinchado */}
                    {showCarTowed && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-orange-200 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowCarTowed(false);
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

                        {/* Foto do Veículo no Guincho */}
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-3">Foto do veículo no guincho *</p>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                            <div className="mb-3">
                              <img 
                                src={getImageUrl(towedCarPhoto, "https://i.ibb.co/KxBvwbyz/Gemini-Generated-Image-8d4po88d4po88d4p.jpg")} 
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

                        {/* Despesas Extras */}
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-3">Houveram despesas extras no processo de recolha? *</p>
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
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 placeholder-gray-500"
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
                    )}

                    {/* Formulário Solicitar Guincho (Problemas Mecânicos) */}
                    {showRequestTowMechanical && (
                      <div className="space-y-4 bg-white rounded-xl p-4 border border-red-200">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => {
                              setShowRequestTowMechanical(false);
                              setMechanicalTowReason('');
                              setFeedback('');
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-bold text-gray-800">Solicitar Guincho</h3>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Detalhe o motivo do guincho *</label>
                          <textarea
                            value={mechanicalTowReason}
                            onChange={(e) => setMechanicalTowReason(e.target.value)}
                            rows={6}
                            placeholder="Descreva detalhadamente os problemas mecânicos identificados após o pedido de desbloqueio que justificam a necessidade do guincho..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white resize-none placeholder-gray-500"
                          />
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
                          onClick={handleRequestTowMechanical}
                          disabled={isUpdating}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Processando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Interface original com iframe */
                  <div className="h-full min-h-[400px]">
                    {card.urlPublica ? (
                      <iframe
                        src={card.urlPublica}
                        className="w-full h-full min-h-[400px] border-0 rounded-xl"
                        title="Pipefy Card"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="bg-yellow-50 rounded-xl p-4 text-center">
                          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-sm text-yellow-700">URL pública não disponível</p>
                          <p className="text-xs text-yellow-600 mt-1">Este card não possui uma URL pública configurada</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-6 space-y-4 h-full min-h-[500px] flex flex-col justify-start">
                <h3 className="font-semibold text-gray-900">Histórico de Atividades</h3>
                
                <div className="space-y-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#FF355A] rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Tarefa criada</p>
                      <p className="text-xs text-gray-500">{formatDate(card.dataCriacao)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Aguardando processamento...</p>
                      <p className="text-xs text-gray-400">Histórico em desenvolvimento</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <span className="text-xs text-gray-500">ID: {card.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
