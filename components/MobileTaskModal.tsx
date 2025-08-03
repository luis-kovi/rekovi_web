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
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'history'>(initialTab)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

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

  if (!isVisible || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm mobile-modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 mobile-modal-content mobile-shadow-lg ${
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
              onClick={() => setActiveTab(tab.id as any)}
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
        <div className="max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              {/* Informações do veículo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Informações do veículo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Placa</span>
                    <span className="text-sm font-medium text-gray-900">{card.placa}</span>
                  </div>
                  {card.modeloVeiculo && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Modelo</span>
                      <span className="text-sm font-medium text-gray-900">{card.modeloVeiculo}</span>
                    </div>
                  )}
                  {card.enderecoRecolha && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">Localização</span>
                        {card.linkMapa && (
                          <button
                            onClick={() => openMap(card.linkMapa!)}
                            className="text-xs text-[#FF355A] hover:underline flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Google Maps
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">{card.enderecoRecolha}</p>
                    </div>
                  )}
                  {card.origemLocacao && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Local para entrega</span>
                      <span className="text-sm font-medium text-gray-900">{card.origemLocacao}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do cliente */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Informações do cliente</h3>
                <div className="space-y-3">
                  {card.nomeDriver && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Nome</span>
                      <span className="text-sm font-medium text-gray-900">{card.nomeDriver}</span>
                    </div>
                  )}
                  {card.telefoneContato && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Telefone</span>
                      <button
                        onClick={() => makeCall(card.telefoneContato!)}
                        className="text-sm font-medium text-[#FF355A] hover:underline"
                      >
                        {card.telefoneContato}
                      </button>
                    </div>
                  )}
                  {card.telefoneOpcional && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Telefone opcional</span>
                      <button
                        onClick={() => makeCall(card.telefoneOpcional!)}
                        className="text-sm font-medium text-[#FF355A] hover:underline"
                      >
                        {card.telefoneOpcional}
                      </button>
                    </div>
                  )}
                  {card.enderecoCadastro && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">Endereço de cadastro</span>
                        <button
                          onClick={() => copyToClipboard(card.enderecoCadastro!)}
                          className="text-xs text-[#FF355A] hover:underline"
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="text-sm text-gray-900">{card.enderecoCadastro}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prestador */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Prestador</h3>
                <div className="space-y-3">
                  {card.empresaResponsavel && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Empresa</span>
                      <span className="text-sm font-medium text-gray-900">{card.empresaResponsavel}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Chofer</span>
                    <span className="text-sm font-medium text-gray-900">
                      {card.chofer ? card.chofer : <em>Não há chofer alocado</em>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="h-full">
              {card.urlPublica ? (
                <iframe
                  src={card.urlPublica}
                  className="w-full h-full border-0"
                  title="Pipefy Card"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              ) : (
                <div className="p-6 space-y-3">
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
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Histórico de Atividades</h3>
              
              <div className="space-y-4">
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">ID: {card.id}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 