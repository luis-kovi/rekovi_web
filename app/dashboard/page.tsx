'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { calcularSLA, formatPersonName, keepOriginalFormat } from '@/utils/helpers'
import type { Card, CardWithSLA } from '@/types'
import { logger } from '@/utils/logger'
import DashboardCharts from '@/components/DashboardCharts'

export default function DashboardPage() {
  const [cards, setCards] = useState<CardWithSLA[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('v_pipefy_cards_detalhada')
          .select('*')

        if (error) throw error

        const cardsWithSLA = (data || []).map((card: Card) => {
          const sla = calcularSLA(card.dataCriacao)
          let slaText: CardWithSLA['slaText'] = 'No Prazo'
          if (sla >= 3) slaText = 'Atrasado'
          else if (sla === 2) slaText = 'Em Alerta'
          return { ...card, sla, slaText }
        })

        setCards(cardsWithSLA)
        logger.log('Cards loaded:', cardsWithSLA.length)
        logger.log('Sample card:', cardsWithSLA[0])
      } catch (error) {
        logger.error('Erro ao carregar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCards()
    const interval = setInterval(fetchCards, 30000)
    return () => clearInterval(interval)
  }, [])

  const dashboardData = useMemo(() => {
    if (!cards || cards.length === 0) {
      return {
        slaByCity: {},
        slaByCompany: {},
        slaByChofer: {},
        cardsByPhase: {},
        cardsByDate: {},
        totalCards: 0,
        totalAtrasado: 0,
        totalAlerta: 0,
        totalPrazo: 0
      }
    }

    // SLA por Cidade (origemLocacao)
    const slaByCity = cards.reduce((acc, card) => {
      if (!card.origemLocacao) return acc
      const city = keepOriginalFormat(card.origemLocacao)
      if (!acc[city]) acc[city] = { atrasado: 0, alerta: 0, prazo: 0 }
      
      if (card.slaText === 'Atrasado') acc[city].atrasado++
      else if (card.slaText === 'Em Alerta') acc[city].alerta++
      else acc[city].prazo++
      
      return acc
    }, {} as Record<string, { atrasado: number; alerta: number; prazo: number }>)

    // SLA por Empresa
    const slaByCompany = cards.reduce((acc, card) => {
      if (!card.empresaResponsavel) return acc
      const company = card.empresaResponsavel
      if (!acc[company]) acc[company] = { atrasado: 0, alerta: 0, prazo: 0 }
      
      if (card.slaText === 'Atrasado') acc[company].atrasado++
      else if (card.slaText === 'Em Alerta') acc[company].alerta++
      else acc[company].prazo++
      
      return acc
    }, {} as Record<string, { atrasado: number; alerta: number; prazo: number }>)

    // SLA por Chofer
    const slaByChofer = cards.reduce((acc, card) => {
      if (!card.chofer || card.chofer === 'N/A') return acc
      const chofer = formatPersonName(card.chofer)
      if (!acc[chofer]) acc[chofer] = { atrasado: 0, alerta: 0, prazo: 0 }
      
      if (card.slaText === 'Atrasado') acc[chofer].atrasado++
      else if (card.slaText === 'Em Alerta') acc[chofer].alerta++
      else acc[chofer].prazo++
      
      return acc
    }, {} as Record<string, { atrasado: number; alerta: number; prazo: number }>)

    // Cards por Fase
    const cardsByPhase = cards.reduce((acc, card) => {
      if (!card.faseAtual) return acc
      const phase = card.faseAtual
      acc[phase] = (acc[phase] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Cards por Data (últimos 7 dias)
    const cardsByDate = cards.reduce((acc, card) => {
      if (!card.dataCriacao) return acc
      const date = new Date(card.dataCriacao).toLocaleDateString('pt-BR')
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    logger.log('Dashboard data processed:', {
      totalCards: cards.length,
      citiesCount: Object.keys(slaByCity).length,
      companiesCount: Object.keys(slaByCompany).length,
      chofersCount: Object.keys(slaByChofer).length,
      phasesCount: Object.keys(cardsByPhase).length,
      slaByCity,
      slaByCompany,
      cardsByPhase
    })

    return {
      slaByCity,
      slaByCompany,
      slaByChofer,
      cardsByPhase,
      cardsByDate,
      totalCards: cards.length,
      totalAtrasado: cards.filter(c => c.slaText === 'Atrasado').length,
      totalAlerta: cards.filter(c => c.slaText === 'Em Alerta').length,
      totalPrazo: cards.filter(c => c.slaText === 'No Prazo').length
    }
  }, [cards])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/20 to-blue-50/10 relative">
      {/* Background decorativo premium */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,53,90,0.02)_0%,transparent_60%),radial-gradient(circle_at_75%_75%,rgba(59,130,246,0.02)_0%,transparent_60%)] pointer-events-none"></div>
      
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846] text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 right-8 w-1 h-1 bg-white/30 rounded-full opacity-60"></div>
        <div className="absolute top-4 right-12 w-0.5 h-0.5 bg-white/20 rounded-full opacity-40"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>Dashboard</h1>
              <p className="text-white/80 text-sm">Visão em tempo real das recolhas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-white/80">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Atualizando...</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/30 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm border border-white/20">
              <div className="w-2 h-2 bg-white rounded-full opacity-90"></div>
              <span className="text-sm font-bold text-white">{dashboardData.totalCards}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-red-200/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100/80 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Atrasadas</h3>
                  <p className="text-sm text-gray-600">SLA &gt; 3 dias</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">{dashboardData.totalAtrasado}</div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-yellow-200/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100/80 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Em Alerta</h3>
                  <p className="text-sm text-gray-600">SLA = 2 dias</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{dashboardData.totalAlerta}</div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-200/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100/80 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">No Prazo</h3>
                  <p className="text-sm text-gray-600">SLA &lt; 2 dias</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-600">{dashboardData.totalPrazo}</div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <pre className="text-xs">{JSON.stringify(dashboardData, null, 2)}</pre>
          </div>
        )}
        
        {/* Gráficos */}
        <DashboardCharts data={dashboardData} />
      </div>
    </div>
  )
}