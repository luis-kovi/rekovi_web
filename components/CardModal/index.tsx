// components/CardModal/index.tsx
'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import type { CardWithSLA } from '@/types'
import { formatPersonName, keepOriginalFormat, formatDate, phaseDisplayNames } from '@/utils/helpers'
import { createClient } from '@/utils/supabase/client'
import { extractCityFromOrigin } from '@/utils/auth-validation'
import { logger } from '@/utils/logger'

// Lazy load dos componentes para melhor performance
const DriverAllocationForm = lazy(() => import('./DriverAllocationForm'))
const CollectionRejectionForm = lazy(() => import('./CollectionRejectionForm'))
const VehicleUnlockForm = lazy(() => import('./VehicleUnlockForm'))
const TowingRequestForm = lazy(() => import('./TowingRequestForm'))
const ProblemReportForm = lazy(() => import('./ProblemReportForm'))

interface PreApprovedUser {
  nome: string
  email: string
  empresa: string
  permission_type: string
  status: string
  area_atuacao: string[]
}

interface CardModalProps {
  card: CardWithSLA | null;
  onClose: () => void;
  onUpdateChofer?: (cardId: string, newName: string, newEmail: string) => Promise<void>;
  onAllocateDriver?: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string) => Promise<void>;
  onRejectCollection?: (cardId: string, reason: string, observations: string) => Promise<void>;
  onUnlockVehicle?: (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => Promise<void>;
  onRequestTowing?: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>;
  onReportProblem?: (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => Promise<void>;
  onConfirmPatioDelivery?: (cardId: string, photos: Record<string, File>, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onConfirmCarTowed?: (cardId: string, photo: File, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onRequestTowMechanical?: (cardId: string, reason: string) => Promise<void>;
}

// Componente de loading para o Suspense
const FormLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
)

export default function CardModal({ 
  card, 
  onClose, 
  onUpdateChofer, 
  onAllocateDriver, 
  onRejectCollection, 
  onUnlockVehicle, 
  onRequestTowing, 
  onReportProblem, 
  onConfirmPatioDelivery, 
  onConfirmCarTowed, 
  onRequestTowMechanical 
}: CardModalProps) {
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
  
  // Estados para tentativas de recolha
  const [showUnlockVehicle, setShowUnlockVehicle] = useState(false);
  const [showRequestTowing, setShowRequestTowing] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  
  // Estados para Confirmação de Recolha
  const [showConfirmPatioDelivery, setShowConfirmPatioDelivery] = useState(false);
  const [showCarTowed, setShowCarTowed] = useState(false);
  const [showRequestTowMechanical, setShowRequestTowMechanical] = useState(false);

  const isFila = card?.faseAtual === 'Fila de Recolha';
  const isTentativas = card?.faseAtual === 'Tentativas de Recolha';
  const isConfirmacaoRecolha = card?.faseAtual === 'Confirmação de Recolha';
  const allowChoferChange = !isFila && !isTentativas && !isConfirmacaoRecolha;

  // Função para buscar chofers disponíveis baseados na cidade de origem
  useEffect(() => {
    const fetchAvailableChofers = async () => {
      if (!card) return;
      
      setLoadingChofers(true);
      
      try {
        const supabase = createClient();
        const cidade = extractCityFromOrigin(card.origemLocacao || '');
        
        if (!cidade) {
          logger.warn('Não foi possível extrair a cidade da origem:', card.origemLocacao);
          setAvailableChofers([]);
          return;
        }
        
        const { data, error } = await supabase
          .from('PreApprovedUsers')
          .select('nome, email')
          .eq('permission_type', 'Chofer')
          .eq('status', 'ativo')
          .contains('area_atuacao', [cidade]);
        
        if (error) {
          logger.error('Erro ao buscar chofers:', error);
          setAvailableChofers([]);
          return;
        }
        
        // Filtrar o chofer atual se existir
        const filteredChofers = (data || []).filter((chofer: PreApprovedUser) => 
          chofer.nome.toLowerCase() !== card.chofer?.toLowerCase()
        );
        
        setAvailableChofers(filteredChofers);
      } catch (error) {
        logger.error('Erro ao buscar chofers disponíveis:', error);
        setAvailableChofers([]);
      } finally {
        setLoadingChofers(false);
      }
    };
    
    if (isFila || showChoferChange) {
      fetchAvailableChofers();
    }
  }, [card, isFila, showChoferChange]);

  const handleChoferChange = async () => {
    if (!card) return;
    if (!selectedChofer || !choferEmail) {
      setFeedback('Por favor, selecione um chofer.');
      return;
    }
    
    if (!onUpdateChofer) {
      setFeedback('Funcionalidade de troca de chofer não disponível.');
      return;
    }
    
    setIsUpdating(true);
    setFeedback('Atualizando chofer...');
    
    try {
      await onUpdateChofer(card.id, selectedChofer, choferEmail);
      
      setFeedback('Chofer atualizado com sucesso! Os dados serão atualizados em até 3 minutos.');
      setTimeout(() => {
        setShowChoferChange(false);
        setSelectedChofer('');
        setChoferEmail('');
        setFeedback('');
        setIsUpdating(false);
        onClose();
      }, 3000);
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsUpdating(false);
    }
  };

  const handleCopyPlate = () => {
    if (card?.placa) {
      navigator.clipboard.writeText(card.placa);
      setCopiedPlate(true);
      setTimeout(() => setCopiedPlate(false), 2000);
    }
  };

  // Handlers para os componentes extraídos
  const handleAllocateDriver = async (
    driverName: string,
    driverEmail: string,
    dateTime: string,
    collectionValue: string,
    additionalKm: string
  ) => {
    if (!card || !onAllocateDriver) throw new Error('Função de alocação não disponível')
    await onAllocateDriver(card.id, driverName, driverEmail, dateTime, collectionValue, additionalKm)
  }

  const handleRejectCollection = async (reason: string, observations: string) => {
    if (!card || !onRejectCollection) throw new Error('Função de rejeição não disponível')
    await onRejectCollection(card.id, reason, observations)
  }

  const handleUnlockVehicle = async (photos: Record<string, File>, observations?: string) => {
    if (!card || !onUnlockVehicle) throw new Error('Função de desbloqueio não disponível')
    await onUnlockVehicle(card.id, card.faseAtual, photos, observations)
  }

  const handleRequestTowing = async (reason: string, photos: Record<string, File>, observations?: string) => {
    if (!card || !onRequestTowing) throw new Error('Função de guincho não disponível')
    await onRequestTowing(card.id, card.faseAtual, reason, photos)
  }

  const handleReportProblem = async (difficulty: string, evidences: Record<string, File>) => {
    if (!card || !onReportProblem) throw new Error('Função de reporte não disponível')
    await onReportProblem(card.id, card.faseAtual, difficulty, evidences)
  }
  
  // Retorna null se não houver card
  if (!card) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] relative overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-[#FF355A] to-[#E02E4D] p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-white">Detalhes do Card #{card.id}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-all duration-200 ${
                card.faseAtual === 'Fila de Recolha' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                card.faseAtual === 'Tentativas de Recolha' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                card.faseAtual === 'Confirmação de Recolha' ? 'bg-green-100 text-green-800 border border-green-300' :
                'bg-gray-100 text-gray-800 border border-gray-300'
              }`}>
                {phaseDisplayNames[card.faseAtual] || card.faseAtual}
              </span>
              <button
                onClick={handleCopyPlate}
                className="group relative bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {card.placa}
                {copiedPlate && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    Copiado!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-4rem)]">
          {/* Lado esquerdo - Informações do Card */}
          <div className="w-1/2 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-4">
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
            </div>
          </div>
          
          {/* Lado direito - Ações para Fila de Recolha e Tentativas */}
          <div className="w-1/2 p-6 overflow-y-auto border-l border-red-200/50 relative">
            {isFila ? (
              /* Interface para ações da Fila de Recolha */
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Gerenciar Recolha
                  </h2>
                  <p className="text-sm text-gray-600">
                    Escolha uma das opções abaixo para prosseguir
                  </p>
                </div>

                {/* Botões principais */}
                {!showAllocateDriver && !showRejectCollection && (
                  <div className="space-y-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-200/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                      <div className="relative z-10">
                        <button
                          onClick={() => setShowAllocateDriver(true)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Alocar Chofer
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-red-200/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                      <div className="relative z-10">
                        <button
                          onClick={() => setShowRejectCollection(true)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rejeitar Recolha
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulários com lazy loading */}
                <Suspense fallback={<FormLoader />}>
                  {showAllocateDriver && (
                    <DriverAllocationForm
                      availableChofers={availableChofers}
                      loadingChofers={loadingChofers}
                      onAllocate={handleAllocateDriver}
                      onClose={() => setShowAllocateDriver(false)}
                    />
                  )}

                  {showRejectCollection && (
                    <CollectionRejectionForm
                      onReject={handleRejectCollection}
                      onClose={() => setShowRejectCollection(false)}
                    />
                  )}
                </Suspense>
              </div>
            ) : isTentativas ? (
              /* Interface para ações de Tentativas de Recolha */
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Tentativas de Recolha
                  </h2>
                  <p className="text-sm text-gray-600">
                    Escolha a ação apropriada para a situação encontrada
                  </p>
                </div>

                {/* Botões principais para tentativas */}
                {!showUnlockVehicle && !showRequestTowing && !showReportProblem && (
                  <div className="space-y-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-200/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                      <div className="relative z-10">
                        <button
                          onClick={() => setShowUnlockVehicle(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Desbloquear Veículo
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                      <div className="relative z-10">
                        <button
                          onClick={() => setShowRequestTowing(true)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-4 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                          Solicitar Guincho
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                      <div className="relative z-10">
                        <button
                          onClick={() => setShowReportProblem(true)}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Reportar Problema
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulários com lazy loading */}
                <Suspense fallback={<FormLoader />}>
                  {showUnlockVehicle && (
                    <VehicleUnlockForm
                      onUnlock={handleUnlockVehicle}
                      onClose={() => setShowUnlockVehicle(false)}
                    />
                  )}

                  {showRequestTowing && (
                    <TowingRequestForm
                      onRequestTowing={handleRequestTowing}
                      onClose={() => setShowRequestTowing(false)}
                    />
                  )}

                  {showReportProblem && (
                    <ProblemReportForm
                      onReportProblem={handleReportProblem}
                      onClose={() => setShowReportProblem(false)}
                    />
                  )}
                </Suspense>
              </div>
            ) : (
              /* Interface original com iframe para outras fases */
              <div className="h-full flex items-center justify-center">
                <iframe 
                  id="modalFormIframe" 
                  src={card.urlPublica && card.urlPublica !== 'null' ? card.urlPublica : "about:blank"} 
                  className="w-full h-full rounded-lg relative z-10"
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}