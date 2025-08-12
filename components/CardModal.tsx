// components/CardModal.tsx
'use client'

import { useState, useEffect } from 'react'
import type { CardWithSLA } from '@/types'
import { formatPersonName, keepOriginalFormat, formatDate, phaseDisplayNames } from '@/utils/helpers'
import { createClient } from '@/utils/supabase/client'
import { extractCityFromOrigin } from '@/utils/auth-validation'

interface CardModalProps {
  card: CardWithSLA | null;
  onClose: () => void;
  onUpdateChofer?: (cardId: string, newName: string, newEmail: string) => Promise<void>;
}

export default function CardModal({ card, onClose, onUpdateChofer }: CardModalProps) {
  const [showChoferChange, setShowChoferChange] = useState(false);
  const [selectedChofer, setSelectedChofer] = useState('');
  const [choferEmail, setChoferEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedPlate, setCopiedPlate] = useState(false);
  const [availableChofers, setAvailableChofers] = useState<{name: string, email: string}[]>([]);
  const [loadingChofers, setLoadingChofers] = useState(false);
  
  // Estados para os novos formulários da fila de recolha
  const [showAllocateDriver, setShowAllocateDriver] = useState(false);
  const [showRejectCollection, setShowRejectCollection] = useState(false);
  
  // Estados para alocar chofer
  const [allocateDriverName, setAllocateDriverName] = useState('');
  const [allocateDriverEmail, setAllocateDriverEmail] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [billingType, setBillingType] = useState('');
  const [collectionValue, setCollectionValue] = useState('');
  const [additionalKm, setAdditionalKm] = useState('');
  
  // Estados para rejeitar recolha
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionObservations, setRejectionObservations] = useState('');

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

  // Carregar chofers quando abrir o modal de troca ou quando o card mudar
  useEffect(() => {
    if (showChoferChange && card) {
      loadAvailableChofers();
    }
  }, [showChoferChange, card]);

  // Carregar chofers para alocar e definir data atual
  useEffect(() => {
    if (showAllocateDriver && card) {
      loadAvailableChofers();
      // Definir data atual como padrão
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      const formattedTime = today.toTimeString().slice(0, 5);
      setCollectionDate(formattedDate);
      setCollectionTime(formattedTime);
    }
  }, [showAllocateDriver, card]);

  if (!card) return null;

  const isFila = card?.faseAtual === 'Fila de Recolha';
  const displayPhase = phaseDisplayNames[card?.faseAtual] || card?.faseAtual;
  const editablePhases = ['Tentativa 1 de Recolha', 'Tentativa 2 de Recolha', 'Tentativa 3 de Recolha', 'Nova tentativa de recolha', 'Confirmação de Entrega no Pátio'];
  const allowChoferChange = card?.faseAtual ? editablePhases.includes(card.faseAtual) : false;

  const handleChoferChange = async () => {
    if (!selectedChofer || !choferEmail || !onUpdateChofer) return;
    
    setIsUpdating(true);
    setFeedback('Processando alterações...');
    
    try {
      await onUpdateChofer(card.id, selectedChofer, choferEmail);
      setFeedback('Os dados no campo Chofer serão atualizados em até 3 minutos.');
      setTimeout(() => {
        setShowChoferChange(false);
        setFeedback('');
        setIsUpdating(false);
      }, 3000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  const handleCopyPlate = async () => {
    try {
      await navigator.clipboard.writeText(card.placa);
      setCopiedPlate(true);
      setTimeout(() => setCopiedPlate(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar placa:', error);
    }
  };

  // Função para lidar com a alocação de chofer
  const handleAllocateDriver = async () => {
    if (!allocateDriverName || !allocateDriverEmail || !collectionDate || !collectionTime || !billingType || !additionalKm) {
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
      // Aqui você implementaria a lógica para salvar os dados
      // Por enquanto, vamos apenas simular o sucesso
      console.log('Dados da alocação:', {
        cardId: card.id,
        driver: allocateDriverName,
        email: allocateDriverEmail,
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

  // Função para lidar com a rejeição de recolha
  const handleRejectCollection = async () => {
    if (!rejectionReason || !rejectionObservations) {
      setFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsUpdating(true);
    setFeedback('Processando rejeição de recolha...');
    
    try {
      // Aqui você implementaria a lógica para salvar os dados
      // Por enquanto, vamos apenas simular o sucesso
      console.log('Dados da rejeição:', {
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

  // Funções para resetar os formulários
  const resetAllocateForm = () => {
    setAllocateDriverName('');
    setAllocateDriverEmail('');
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

  // Calcular status do SLA
  const slaStatus = card.sla >= 3 ? 'atrasado' : card.sla === 2 ? 'alerta' : 'no-prazo';

  return (
    <div id="cardModal" className="modal-overlay fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="modal-panel bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-200/50 w-full max-w-7xl max-h-[95vh] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        {/* Background decorativo similar ao Kanban */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,53,90,0.02)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.02)_0%,transparent_50%)] pointer-events-none rounded-2xl"></div>
        
        {/* Header moderno */}
        <div className="relative z-10 bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846] text-white p-4 rounded-t-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          {/* Partículas decorativas */}
          <div className="absolute top-3 right-8 w-1 h-1 bg-white/30 rounded-full opacity-60"></div>
          <div className="absolute top-4 right-12 w-0.5 h-0.5 bg-white/20 rounded-full opacity-40"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
           <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold tracking-wide" id="modalPlaca" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>{card.placa}</h3>
             <button 
               onClick={handleCopyPlate}
                    className={`relative text-white/80 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/20 backdrop-blur-sm ${
                      copiedPlate ? 'bg-white/30' : ''
               }`}
               title="Copiar placa"
             >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
               </svg>
               {copiedPlate && (
                      <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                   Copiado!
                 </span>
               )}
             </button>
           </div>
                <p className="text-white/80 text-sm">{displayPhase}</p>
              </div>
            </div>
            
           <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-white/20 rounded-sm flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-white/80 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Data de Criação</p>
                </div>
                <p className="text-sm text-white font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                 {formatDate(card.dataCriacao)}
               </p>
             </div>
              
              <button 
                id="closeCardModal" 
                onClick={onClose} 
                className="text-white/80 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm group"
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
                  </div>
                </div>
         </div>
        {/* Layout principal sem scroll necessário */}
        <div className="flex h-[calc(95vh-120px)] relative z-10">
          <div className="w-full p-6 overflow-y-auto scroll-container">
            <div id="modal-content" className="space-y-4">
              {/* SLA, Valores e Fase - Tags compactas na mesma linha */}
              <div className="flex flex-wrap gap-2">
                {/* SLA Tag */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-50 to-red-100 px-3 py-2 rounded-lg border border-red-200/50">
                  <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-red-600">SLA:</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold text-white ${
                    slaStatus === 'atrasado' 
                      ? 'bg-red-500' 
                      : slaStatus === 'alerta' 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}>
                    {card.sla} dias
                  </span>
              </div>

                {/* Valor da Recolha Tag */}
                {(!isFila && card.valorRecolha && card.valorRecolha !== 'N/A' && card.valorRecolha !== 'null' && card.valorRecolha !== '0,00' && card.valorRecolha !== '0.00') && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 px-3 py-2 rounded-lg border border-green-200/50">
                    <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      </div>
                    <span className="text-xs font-medium text-green-600">Valor da Recolha:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                      R$ {card.valorRecolha}
                    </span>
                    </div>
                  )}

                {/* Custo KM Adicional Tag */}
                {(!isFila && card.custoKmAdicional && card.custoKmAdicional !== 'N/A' && card.custoKmAdicional !== 'null' && card.custoKmAdicional !== '0,00' && card.custoKmAdicional !== '0.00') && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-2 rounded-lg border border-amber-200/50">
                    <div className="w-4 h-4 bg-amber-500 rounded-sm flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      </div>
                    <span className="text-xs font-medium text-amber-600">Km Adicional:</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold">
                      R$ {card.custoKmAdicional}
                    </span>
                    </div>
                  )}
                </div>



              {/* Cliente e Carro - Cards modernos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Cliente</h3>
                    </div>
                    <div className="space-y-3">
                    <div className="text-gray-600">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <div className="w-3 h-3 flex items-center justify-center bg-green-100 rounded-sm">
                            <svg className="w-2 h-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span>NOME</span>
                        </div>
                        <div className="text-gray-800 font-medium text-sm">{formatPersonName(card.nomeDriver)}</div>
                    </div>
                    <div className="text-gray-600">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <div className="w-3 h-3 flex items-center justify-center bg-blue-100 rounded-sm">
                            <svg className="w-2 h-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <span>TELEFONE</span>
                        </div>
                        <div className="text-gray-800 font-medium text-sm">{card.telefoneContato || 'N/A'}</div>
                    </div>
                    <div className="text-gray-600">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <div className="w-3 h-3 flex items-center justify-center bg-indigo-100 rounded-sm">
                            <svg className="w-2 h-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <span>TEL. OPCIONAL</span>
                        </div>
                        <div className="text-gray-800 font-medium text-sm">{card.telefoneOpcional || 'N/A'}</div>
                    </div>
                                         <div className="text-gray-600">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <div className="w-3 h-3 flex items-center justify-center bg-orange-100 rounded-sm">
                            <svg className="w-2 h-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span>ENDEREÇO</span>
                        </div>
                        <div className="text-gray-800 font-medium text-sm break-words">{card.enderecoCadastro || 'N/A'}</div>
                      </div>
                     </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-cyan-200/50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Veículo</h3>
                    </div>
                    <div className="space-y-3">
                    <div className="text-gray-600">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <div className="w-3 h-3 flex items-center justify-center bg-blue-100 rounded-sm">
                            <svg className="w-2 h-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <span>MODELO</span>
                        </div>
                        <div className="text-gray-800 font-medium text-sm">{formatPersonName(card.modeloVeiculo)}</div>
                    </div>
                    <div className="text-gray-600">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <div className="w-3 h-3 flex items-center justify-center bg-emerald-100 rounded-sm">
                            <svg className="w-2 h-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span>ORIGEM</span>
                        </div>
                        <div className="text-gray-800 font-medium text-sm">{keepOriginalFormat(card.origemLocacao)}</div>
                    </div>
                                         <div className="text-gray-600">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                          <div className="w-3 h-3 flex items-center justify-center bg-red-100 rounded-sm">
                            <svg className="w-2 h-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span>LOCALIZAÇÃO</span>
                        </div>
                        <div className="text-gray-800 font-medium text-sm mb-2 break-words">{card.enderecoRecolha || 'N/A'}</div>
                      {card.linkMapa && card.linkMapa !== 'null' && (
                        <a 
                          href={card.linkMapa} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          <span>Maps</span>
                        </a>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chofer - Card moderno */}
              {!isFila && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-yellow-200/50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Chofer</h3>
                      </div>
                    {allowChoferChange && (
                      <button 
                        onClick={() => setShowChoferChange(!showChoferChange)}
                        className="relative p-2 text-gray-600 hover:text-[#FF355A] transition-all duration-200 rounded-lg hover:bg-red-50 group"
                      >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                          {/* Tooltip moderno - posicionado à esquerda */}
                          <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-1 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          Trocar chofer
                            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900/90"></div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="text-gray-600">
                      <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                        <div className="w-3 h-3 flex items-center justify-center bg-orange-100 rounded-sm">
                          <svg className="w-2 h-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>CHOFER RESPONSÁVEL</span>
                      </div>
                      <div className="text-gray-800 font-medium text-sm">{formatPersonName(card.chofer)}</div>
                  </div>
                  
                    {/* Trocar Chofer - Expandido com design moderno */}
                  {showChoferChange && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-red-50/50 to-red-100/30 backdrop-blur-sm rounded-xl border border-red-200/50">
                        <div className="space-y-4">
                        {loadingChofers ? (
                          <div className="text-center py-4">
                            <div className="inline-flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="text-sm">Carregando chofers disponíveis...</span>
                            </div>
                          </div>
                        ) : availableChofers.length === 0 ? (
                          <div className="text-center py-4">
                            <div className="text-gray-600 text-sm">
                              Não há outros chofers cadastrados para a região.
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>Novo Chofer</label>
                              <select 
                                value={selectedChofer}
                                onChange={(e) => {
                                  setSelectedChofer(e.target.value);
                                  const option = availableChofers.find(opt => opt.name === e.target.value);
                                  setChoferEmail(option?.email || '');
                                }}
                                className="w-full p-3 border border-red-300/50 rounded-lg text-sm focus:ring-2 focus:ring-[#FF355A]/50 focus:border-[#FF355A] bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                              >
                                <option value="">Selecione um nome...</option>
                                {availableChofers.map(option => (
                                  <option key={option.email} value={option.name}>{option.name}</option>
                                ))}
                              </select>
                            </div>
                            {selectedChofer && (
                              <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>E-mail do Novo Chofer</label>
                                <input 
                                  type="email" 
                                  value={choferEmail}
                                  readOnly
                                  className="w-full p-3 border border-red-300/50 rounded-lg text-sm bg-gray-50/80 backdrop-blur-sm shadow-sm cursor-not-allowed"
                                  placeholder="E-mail será preenchido automaticamente"
                                />
                              </div>
                            )}
                          </>
                        )}
                        {feedback && (
                            <div className={`text-sm text-center p-3 rounded-lg font-medium ${
                              feedback.includes('Erro') 
                                ? 'text-red-700 bg-red-100/50 border border-red-200/50' 
                                : 'text-green-700 bg-green-100/50 border border-green-200/50'
                            }`}>
                            {feedback}
                          </div>
                        )}
                        {!loadingChofers && availableChofers.length > 0 && (
                          <button 
                            onClick={handleChoferChange}
                            disabled={isUpdating || !selectedChofer || !choferEmail}
                              className="w-full bg-gradient-to-r from-[#FF355A] to-[#E02E4D] hover:from-[#E02E4D] hover:to-[#D12846] text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl backdrop-blur-sm"
                          >
                            Confirmar Alteração
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* Novos controles para Fila de Recolha */}
              {isFila && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200/50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Gerenciar Recolha</h3>
                    </div>

                    {/* Botões principais - menores e lado a lado */}
                    {!showAllocateDriver && !showRejectCollection && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setShowAllocateDriver(true)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Alocar Chofer
                        </button>
                        
                        <button
                          onClick={() => setShowRejectCollection(true)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rejeitar Recolha
                        </button>
                      </div>
                    )}

                    {/* Formulário Alocar Chofer */}
                    {showAllocateDriver && (
                      <div className="space-y-4">
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
                            {/* Nome do Chofer */}
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
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                              >
                                <option value="">Selecione um chofer...</option>
                                {availableChofers.map(option => (
                                  <option key={option.email} value={option.name}>{option.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Data e Hora */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Data *
                                </label>
                                <input 
                                  type="date" 
                                  value={collectionDate}
                                  onChange={(e) => setCollectionDate(e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
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
                                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                                />
                              </div>
                            </div>

                            {/* Tipo de Faturamento */}
                            <div>
                              <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Tipo de Faturamento *
                              </label>
                              <select 
                                value={billingType}
                                onChange={(e) => setBillingType(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                              >
                                <option value="">Selecione o tipo...</option>
                                <option value="avulso">Avulso</option>
                                <option value="franquia">Franquia</option>
                              </select>
                            </div>

                            {/* Valor da Recolha (apenas para Avulso) */}
                            {billingType === 'avulso' && (
                              <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Valor da Recolha *
                                </label>
                                <input 
                                  type="text" 
                                  value={collectionValue}
                                  onChange={(e) => {
                                    // Formatação de moeda brasileira
                                    const value = e.target.value.replace(/\D/g, '');
                                    const formatted = (Number(value) / 100).toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    });
                                    setCollectionValue(formatted);
                                  }}
                                  placeholder="R$ 0,00"
                                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                                />
                              </div>
                            )}

                            {/* Km Adicional */}
                            <div>
                              <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Km Adicional *
                              </label>
                              <input 
                                type="text" 
                                value={additionalKm}
                                onChange={(e) => {
                                  // Formatação de moeda brasileira
                                  const value = e.target.value.replace(/\D/g, '');
                                  const formatted = (Number(value) / 100).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  });
                                  setAdditionalKm(formatted);
                                }}
                                placeholder="R$ 0,00"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white shadow-sm transition-all duration-200"
                              />
                            </div>

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
                    )}

                    {/* Formulário Rejeitar Recolha */}
                    {showRejectCollection && (
                      <div className="space-y-4">
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
                          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Rejeitar Recolha
                          </h3>
                        </div>

                        {/* Motivo da não recolha */}
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Motivo da não recolha *
                          </label>
                          <select 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white shadow-sm transition-all duration-200"
                          >
                            <option value="">Selecione um motivo...</option>
                            <option value="cliente_pagamento">Cliente realizou pagamento</option>
                            <option value="cliente_devolveu">Cliente já devolveu o veículo</option>
                            <option value="veiculo_recolhido">Veículo já recolhido</option>
                            <option value="fora_area">Fora da área de atuação</option>
                            <option value="duplicada">Solicitação duplicada</option>
                          </select>
                        </div>

                        {/* Observações */}
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Observações *
                          </label>
                          <textarea 
                            value={rejectionObservations}
                            onChange={(e) => setRejectionObservations(e.target.value)}
                            rows={4}
                            placeholder="Descreva detalhes adicionais sobre a rejeição..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-white shadow-sm transition-all duration-200 resize-none"
                          />
                        </div>

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
                          onClick={handleRejectCollection}
                          disabled={isUpdating}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          {isUpdating ? 'Processando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}