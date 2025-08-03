// components/CardModal.tsx
'use client'

import { useState } from 'react'
import type { CardWithSLA } from '@/types'
import { formatPersonName, keepOriginalFormat, formatDate, phaseDisplayNames, choferNames } from '@/utils/helpers'

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

  if (!card) return null;

  const isFila = card.faseAtual === 'Fila de Recolha';
  const displayPhase = phaseDisplayNames[card.faseAtual] || card.faseAtual;
  const editablePhases = ['Tentativa 1 de Recolha', 'Tentativa 2 de Recolha', 'Tentativa 3 de Recolha', 'Nova tentativa de recolha', 'Confirmação de Entrega no Pátio'];
  const allowChoferChange = editablePhases.includes(card.faseAtual);

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

  const populateChoferOptions = (empresa: string) => {
    const names = empresa === 'ativa' ? choferNames.ativa : choferNames.onsystem;
    const domain = empresa === 'ativa' ? 'ativa.com.br' : 'onsystem.com.br';
    
    return names.map(name => {
      const email = name.toLowerCase().replace(/ /g, '-') + '@' + domain;
      return { name, email };
    });
  };

  const choferOptions = card.empresaResponsavel ? populateChoferOptions(card.empresaResponsavel.toLowerCase()) : [];

  return (
    <div id="cardModal" className="modal-overlay fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="modal-panel bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                 <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl border-b border-gray-200">
           <div className="flex items-center gap-3">
             <h3 className="text-xl font-bold text-gray-800" id="modalPlaca" style={{ fontFamily: 'Poppins, sans-serif' }}>{card.placa}</h3>
             <button 
               onClick={handleCopyPlate}
               className={`relative text-gray-600 hover:text-gray-800 transition-all duration-200 p-2 rounded-lg hover:bg-gray-200 ${
                 copiedPlate ? 'bg-gray-500' : ''
               }`}
               title="Copiar placa"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
               </svg>
               {copiedPlate && (
                 <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                   Copiado!
                 </span>
               )}
             </button>
           </div>
           <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Data de Criação</p>
               <p className="text-sm text-gray-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                 {formatDate(card.dataCriacao)}
               </p>
             </div>
             <button id="closeCardModal" onClick={onClose} className="text-gray-600 hover:text-gray-800 text-2xl transition-colors p-1 rounded-lg hover:bg-gray-200">&times;</button>
           </div>
         </div>
        <div className="split-modal">
          <div className="split-modal-left scroll-container">
            <div id="modal-content" className="space-y-2 p-4">
              {/* SLA e Fase - Estilo similar ao card do Kanban */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-red-600 mr-1 text-xs">⏰</span>
                      <p className="text-xs font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>SLA</p>
                    </div>
                    <p className="text-sm font-bold text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{card.sla} dias</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-primary mr-1 text-xs">📋</span>
                      <p className="text-xs font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Fase Atual</p>
                    </div>
                    <p className="text-sm font-bold text-primary" style={{ fontFamily: 'Poppins, sans-serif' }}>{displayPhase}</p>
                  </div>
                </div>
              </div>

              {/* Valores - Movidos para cima quando não nulos e não 0,00 */}
              {(!isFila && (card.valorRecolha || card.custoKmAdicional)) && (
                <div className="grid grid-cols-2 gap-3">
                  {card.valorRecolha && card.valorRecolha !== 'N/A' && card.valorRecolha !== 'null' && card.valorRecolha !== '0,00' && card.valorRecolha !== '0.00' && (
                    <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                      <div className="flex items-center mb-1">
                        <span className="text-green-600 mr-2">💰</span>
                        <p className="text-xs font-semibold text-green-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Valor da Recolha</p>
                      </div>
                      <p className="text-lg font-bold text-green-900">R$ {card.valorRecolha}</p>
                    </div>
                  )}
                  {card.custoKmAdicional && card.custoKmAdicional !== 'N/A' && card.custoKmAdicional !== 'null' && card.custoKmAdicional !== '0,00' && card.custoKmAdicional !== '0.00' && (
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-600 mr-2">🛣️</span>
                        <p className="text-xs font-semibold text-blue-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Custo KM Adicional</p>
                      </div>
                      <p className="text-lg font-bold text-blue-900">R$ {card.custoKmAdicional}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Cliente e Carro - Estilo similar ao card do Kanban */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span className="mr-2">👤</span>Cliente
                  </h3>
                  <div className="space-y-2">
                    <div className="text-gray-600">
                      <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>👤 NOME</div>
                      <div className="truncate text-gray-800 font-medium">{formatPersonName(card.nomeDriver)}</div>
                    </div>
                    <div className="text-gray-600">
                      <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>📱 TELEFONE</div>
                      <div className="truncate text-gray-800 font-medium">{card.telefoneContato || 'N/A'}</div>
                    </div>
                    <div className="text-gray-600">
                      <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>📞 TELEFONE OPCIONAL</div>
                      <div className="truncate text-gray-800 font-medium">{card.telefoneOpcional || 'N/A'}</div>
                    </div>
                                         <div className="text-gray-600">
                       <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>🏠 ENDEREÇO</div>
                       <div className="text-gray-800 font-medium break-words">{card.enderecoCadastro || 'N/A'}</div>
                     </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span className="mr-2">🚗</span>Carro
                  </h3>
                  <div className="space-y-2">
                    <div className="text-gray-600">
                      <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>🏷️ MODELO</div>
                      <div className="truncate text-gray-800 font-medium">{formatPersonName(card.modeloVeiculo)}</div>
                    </div>
                    <div className="text-gray-600">
                      <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>🏢 ORIGEM</div>
                      <div className="truncate text-gray-800 font-medium">{keepOriginalFormat(card.origemLocacao)}</div>
                    </div>
                                         <div className="text-gray-600">
                       <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>📍 LOCALIZAÇÃO</div>
                       <div className="text-gray-800 font-medium mb-1 break-words">{card.enderecoRecolha || 'N/A'}</div>
                      {card.linkMapa && card.linkMapa !== 'null' && (
                        <a 
                          href={card.linkMapa} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chofer - Estilo similar ao card do Kanban */}
              {!isFila && (
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <span className="mr-2">🚛</span>Chofer
                    </h3>
                    {allowChoferChange && (
                      <button 
                        onClick={() => setShowChoferChange(!showChoferChange)}
                        className="relative p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-100 group"
                        title="Trocar chofer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Trocar chofer
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="text-gray-600">
                    <div className="font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>🚛 CHOFER</div>
                    <div className="truncate text-gray-800 font-medium">{formatPersonName(card.chofer)}</div>
                  </div>
                  
                  {/* Trocar Chofer - Expandido */}
                  {showChoferChange && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-300">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Novo Chofer</label>
                          <select 
                            value={selectedChofer}
                            onChange={(e) => {
                              setSelectedChofer(e.target.value);
                              const option = choferOptions.find(opt => opt.name === e.target.value);
                              setChoferEmail(option?.email || '');
                            }}
                            className="mt-1 block w-full p-2 border border-gray-400 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                          >
                            <option value="">Selecione um nome...</option>
                            {choferOptions.map(option => (
                              <option key={option.name} value={option.name}>{option.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>E-mail do Novo Chofer</label>
                          <input 
                            type="email" 
                            value={choferEmail}
                            onChange={(e) => setChoferEmail(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-400 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                          />
                        </div>
                        {feedback && (
                          <div className={`text-sm text-center ${feedback.includes('Erro') ? 'text-red-600' : 'text-green-600'} font-semibold`}>
                            {feedback}
                          </div>
                        )}
                        <button 
                          onClick={handleChoferChange}
                          disabled={isUpdating || !selectedChofer || !choferEmail}
                          className="w-full btn-primary px-3 py-2 text-sm font-medium rounded-md mt-2 disabled:opacity-50"
                        >
                          Confirmar Alteração
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="split-modal-right scroll-container">
            <iframe 
              id="modalFormIframe" 
              src={card.urlPublica && card.urlPublica !== 'null' ? card.urlPublica : "about:blank"} 
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}