// components/MobileTaskModal.tsx
'use client'

import { useState, useEffect } from 'react'
import type { Card } from '@/types'

interface MobileTaskModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  permissionType: string
  initialTab?: 'details' | 'actions' | 'history'
}

export default function MobileTaskModal({ card, isOpen, onClose, permissionType, initialTab = 'details' }: MobileTaskModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'history'>(initialTab)





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
          <div className="min-h-[400px]"> {/* Altura otimizada */}
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

                  {/* Informações Financeiras (se disponível) */}
                  {(card.valorRecolha || card.custoKmAdicional) && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Valores</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {card.valorRecolha && (
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-green-600 mb-1">Valor Recolha</p>
                            <p className="font-bold text-lg text-gray-900">{card.valorRecolha}</p>
                          </div>
                        )}
                        {card.custoKmAdicional && (
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-green-600 mb-1">Custo KM</p>
                            <p className="font-bold text-lg text-gray-900">{card.custoKmAdicional}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="h-full min-h-[500px]">
                {card.urlPublica ? (
                  <div className="h-full min-h-[500px]">
                    <iframe
                      src={card.urlPublica}
                      className="w-full h-full min-h-[500px] border-0"
                      title="Pipefy Card"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      style={{ height: '500px' }}
                    />
                  </div>
                ) : (
                  <div className="p-6 space-y-3 h-full flex items-center justify-center min-h-[500px]">
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