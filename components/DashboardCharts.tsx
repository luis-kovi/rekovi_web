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
    
    // Todas as cidades
    const topCities = Object.entries(data.slaByCity)
      .map(([city, sla]) => ({ city, total: sla.atrasado + sla.alerta + sla.prazo, ...sla }))
      .sort((a, b) => b.total - a.total)

    // Todas as empresas
    const topCompanies = Object.entries(data.slaByCompany)
      .map(([company, sla]) => ({ company, total: sla.atrasado + sla.alerta + sla.prazo, ...sla }))
      .sort((a, b) => b.total - a.total)

    // Todos os chofers
    const topChofers = Object.entries(data.slaByChofer)
      .map(([chofer, sla]) => ({ chofer, total: sla.atrasado + sla.alerta + sla.prazo, ...sla }))
      .sort((a, b) => b.total - a.total)

    // Fases
    const phases = Object.entries(data.cardsByPhase)
      .map(([phase, count]) => ({ phase, count }))
      .sort((a, b) => b.count - a.count)

    const result = { topCities, topCompanies, topChofers, phases }
    
    return result
  }, [data])

  const PieChart = ({ title, items, keyName }: { title: string; items: any[]; keyName: string }) => {
    const total = items.reduce((sum, item) => sum + item.total, 0)
    
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-gray-800 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>{title}</h3>
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Nenhum dado disponível
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const percentage = total > 0 ? (item.total / total) * 100 : 0
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-gray-700 truncate" title={item[keyName]}>
                        {item[keyName]}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{item.total}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const BarChart = ({ title, items, keyName }: { title: string; items: any[]; keyName: string }) => {
    const maxValue = items.length > 0 ? Math.max(...items.map(item => item.total || item.count)) : 0
    
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-gray-800 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>{title}</h3>
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Nenhum dado disponível
              </div>
            ) : (
              items.map((item, index) => {
                const value = item.total || item.count
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700 truncate" title={item[keyName]}>
                        {item[keyName]}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{value}</span>
                    </div>
                    <div className="w-full bg-gray-200/60 rounded-full h-2 overflow-hidden">
                      {item.atrasado !== undefined ? (
                        <div className="h-full flex rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(item.prazo / value) * 100}%` }}
                          />
                          <div 
                            className="bg-yellow-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(item.alerta / value) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(item.atrasado / value) * 100}%` }}
                          />
                        </div>
                      ) : (
                        <div 
                          className="h-full bg-gradient-to-r from-[#FF355A] to-[#E02E4D] rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      )}
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
              })
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!data || Object.keys(data.slaByCity).length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 text-center">
          <p className="text-gray-500">Nenhum dado disponível para gráficos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PieChart 
        title="Recolhas por Cidade" 
        items={chartData.topCities} 
        keyName="city" 
      />
      
      <PieChart 
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