'use client'

import { useMemo } from 'react'

interface DashboardData {
  slaByCity: Record<string, { atrasado: number; alerta: number; prazo: number }>
  slaByCompany: Record<string, { atrasado: number; alerta: number; prazo: number }>
  slaByChofer: Record<string, { atrasado: number; alerta: number; prazo: number }>
  cardsByPhase: Record<string, number>
  cardsByDate: Record<string, number>
}

interface DashboardChartsProps {
  data: DashboardData
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  const chartData = useMemo(() => {
    // Top 5 cidades
    const topCities = Object.entries(data.slaByCity)
      .map(([city, sla]) => ({ city, total: sla.atrasado + sla.alerta + sla.prazo, ...sla }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Top 5 empresas
    const topCompanies = Object.entries(data.slaByCompany)
      .map(([company, sla]) => ({ company, total: sla.atrasado + sla.alerta + sla.prazo, ...sla }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Top 5 chofers
    const topChofers = Object.entries(data.slaByChofer)
      .map(([chofer, sla]) => ({ chofer, total: sla.atrasado + sla.alerta + sla.prazo, ...sla }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Fases
    const phases = Object.entries(data.cardsByPhase)
      .map(([phase, count]) => ({ phase, count }))
      .sort((a, b) => b.count - a.count)

    return { topCities, topCompanies, topChofers, phases }
  }, [data])

  const BarChart = ({ title, items, keyName }: { title: string; items: any[]; keyName: string }) => {
    const maxValue = Math.max(...items.map(item => item.total || item.count))
    
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-gray-800 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>{title}</h3>
          <div className="space-y-4">
            {items.map((item, index) => {
              const value = item.total || item.count
              const percentage = (value / maxValue) * 100
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 truncate" title={item[keyName]}>
                      {item[keyName]}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{value}</span>
                  </div>
                  <div className="w-full bg-gray-200/60 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF355A] to-[#E02E4D] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {item.atrasado !== undefined && (
                    <div className="flex gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {item.atrasado} atrasado
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {item.alerta} alerta
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        {item.prazo} prazo
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BarChart 
        title="Recolhas por Cidade" 
        items={chartData.topCities} 
        keyName="city" 
      />
      
      <BarChart 
        title="Recolhas por Empresa" 
        items={chartData.topCompanies} 
        keyName="company" 
      />
      
      <BarChart 
        title="Recolhas por Chofer" 
        items={chartData.topChofers} 
        keyName="chofer" 
      />
      
      <BarChart 
        title="Distribuição por Fases" 
        items={chartData.phases} 
        keyName="phase" 
      />
    </div>
  )
}