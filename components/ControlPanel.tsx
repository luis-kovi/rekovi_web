// components/ControlPanel.tsx
'use client'

interface ControlPanelProps {
  activeView: 'kanban' | 'list';
  setActiveView: (view: 'kanban' | 'list') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  slaFilter: string;
  setSlaFilter: (filter: string) => void;
  hideEmptyPhases: boolean;
  setHideEmptyPhases: (hide: boolean) => void;
  permissionType?: string;
  onOpenCalculator?: () => void;
}

export default function ControlPanel({
  activeView, setActiveView,
  searchTerm, setSearchTerm,
  slaFilter, setSlaFilter,
  hideEmptyPhases, setHideEmptyPhases,
  permissionType,
  onOpenCalculator
}: ControlPanelProps) {
  const showCalculator = permissionType && ['kovi', 'onsystem', 'rvs', 'admin'].includes(permissionType.toLowerCase());

  return (
    <div className="py-4 bg-white/95 backdrop-blur-md border-b border-gray-200/60 flex-shrink-0 shadow-sm relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/30 to-transparent"></div>
      <div className="flex justify-between items-center px-6 relative z-10">
        <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-gray-200/50">
          <button
            id="kanban-view-btn"
            onClick={() => setActiveView('kanban')}
            className={`control-btn px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2.5 transition-all duration-300 ${
              activeView === 'kanban' 
                ? 'bg-white text-[#FF355A] shadow-lg transform scale-105 border border-gray-200/50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M9 3v18"/>
              <path d="M15 3v18"/>
            </svg>
            Kanban
          </button>
          <button
            id="list-view-btn"
            onClick={() => setActiveView('list')}
            className={`control-btn px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2.5 transition-all duration-300 ${
              activeView === 'list' 
                ? 'bg-white text-[#FF355A] shadow-lg transform scale-105 border border-gray-200/50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" x2="21" y1="6" y2="6"/>
              <line x1="8" x2="21" y1="12" y2="12"/>
              <line x1="8" x2="21" y1="18" y2="18"/>
              <line x1="3" x2="3.01" y1="6" y2="6"/>
              <line x1="3" x2="3.01" y1="12" y2="12"/>
              <line x1="3" x2="3.01" y1="18" y2="18"/>
            </svg>
            Lista
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle Ocultar Fases Vazias - Premium - Só visível na aba Kanban */}
          {activeView === 'kanban' && (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-gray-200/50 shadow-sm">
              <span className="text-xs text-gray-700 font-semibold">Ocultar vazias</span>
              <button 
                id="toggleEmptyPhasesBtn"
                onClick={() => setHideEmptyPhases(!hideEmptyPhases)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF355A]/30 ${
                  hideEmptyPhases ? 'bg-[#FF355A] shadow-md' : 'bg-gray-300'
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-300 ${
                    hideEmptyPhases ? 'bg-white translate-x-5' : 'bg-white translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Filtro SLA - Premium */}
          <div className="relative">
            <select 
              id="slaFilter"
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              className="text-sm border border-gray-300/60 rounded-2xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-[#FF355A]/30 focus:border-[#FF355A] focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white appearance-none font-medium text-gray-800"
              style={{ color: slaFilter !== 'all' ? '#374151' : '#6B7280' }}
            >
              <option value="all">Filtrar por SLA</option>
              <option value="No Prazo">No Prazo</option>
              <option value="Em Alerta">Em Alerta</option>
              <option value="Atrasado">Atrasado</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Campo de Busca - Premium */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              id="searchInput"
              type="search"
              placeholder="Buscar por placa, driver ou chofer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 pl-12 pr-4 py-2.5 text-sm border border-gray-300/60 rounded-2xl focus:ring-2 focus:ring-[#FF355A]/30 focus:border-[#FF355A] focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white font-medium placeholder:text-gray-500 text-gray-800"
            />
          </div>

          {/* Botão Calculadora - Premium */}
          {showCalculator && onOpenCalculator && (
            <button 
              id="openCalculatorBtn"
              onClick={onOpenCalculator}
              className="relative bg-gradient-to-r from-[#FF355A] to-[#E02E4D] hover:from-[#E02E4D] hover:to-[#D12846] text-white p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF355A]/30 group backdrop-blur-sm"
              title="Calculadora Km"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12 .5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5h8Zm-11 1A1.5 1.5 0 0 0 1 3v10a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 15 13V3a1.5 1.5 0 0 0-1.5-1.5h-11ZM4 2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1 0-1h.5V2.5A.5.5 0 0 1 4 2Zm1 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1V2.5A.5.5 0 0 1 5 2Zm2 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1V2.5A.5.5 0 0 1 7 2Zm3 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1V2.5A.5.5 0 0 1 10 2Zm1.5 1.5a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5v-.5Zm-9 1A.5.5 0 0 1 4 5h8a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-8ZM5 6v1h1V6H5Zm2 0v1h1V6H7Zm2 0v1h1V6H9Zm2 0v1h1V6h-1Zm-6 2v1h1V8H5Zm2 0v1h1V8H7Zm2 0v1h1V8H9Zm2 0v1h1V8h-1Zm-6 2v1h1v-1H5Zm2 0v1h1v-1H7Zm2 0v1h1v-1H9Zm2 0v1h1v-1h-1Zm-6 2v1h1v-1H5Zm2 0v1h1v-1H7Zm3 0v1h1v-1h-1Z"/>
              </svg>
              {/* Tooltip Premium */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-xl border border-gray-700/50">
                Calculadora Km
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}