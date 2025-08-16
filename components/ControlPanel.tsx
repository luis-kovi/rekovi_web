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
    <div className="py-3 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
          <button
            id="kanban-view-btn"
            onClick={() => setActiveView('kanban')}
            className={`control-btn px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
              activeView === 'kanban' 
                ? 'bg-white text-primary shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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
            className={`control-btn px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
              activeView === 'list' 
                ? 'bg-white text-primary shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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
        <div className="flex items-center gap-3">
          {/* Toggle Ocultar Fases Vazias - Modernizado - Só visível na aba Kanban */}
          {activeView === 'kanban' && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <span className="text-xs text-gray-700 font-medium">Ocultar fases vazias</span>
                           <button 
                 id="toggleEmptyPhasesBtn"
                 onClick={() => setHideEmptyPhases(!hideEmptyPhases)}
                 className={`relative w-10 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 ${
                   hideEmptyPhases ? 'bg-[#FF355A] ring-2 ring-[#FF355A] ring-opacity-30' : 'bg-gray-200'
                 }`}
               >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                    hideEmptyPhases ? 'bg-white translate-x-4' : 'bg-white translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Filtro SLA - Modernizado */}
          <div className="relative">
            <select 
              id="slaFilter"
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 focus:border-[#FF355A] focus:outline-none transition-all duration-200 bg-white shadow-sm hover:shadow-md appearance-none"
            >
              <option value="all">Filtrar por SLA</option>
              <option value="No Prazo">No Prazo</option>
              <option value="Em Alerta">Em Alerta</option>
              <option value="Atrasado">Atrasado</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Campo de Busca - Modernizado */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              id="searchInput"
              type="search"
              placeholder="Procurar cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 focus:border-[#FF355A] focus:outline-none transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
          </div>

          {/* Botão Calculadora - Modernizado (apenas ícone) */}
          {showCalculator && onOpenCalculator && (
            <button 
              id="openCalculatorBtn"
              onClick={onOpenCalculator}
              className="relative bg-[#FF355A] hover:bg-[#E02E4D] text-white p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 group"
              title="Calculadora Km"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12 .5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5h8Zm-11 1A1.5 1.5 0 0 0 1 3v10a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 15 13V3a1.5 1.5 0 0 0-1.5-1.5h-11ZM4 2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1 0-1h.5V2.5A.5.5 0 0 1 4 2Zm1 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1V2.5A.5.5 0 0 1 5 2Zm2 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1V2.5A.5.5 0 0 1 7 2Zm3 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1V2.5A.5.5 0 0 1 10 2Zm1.5 1.5a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5v-.5Zm-9 1A.5.5 0 0 1 4 5h8a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-8ZM5 6v1h1V6H5Zm2 0v1h1V6H7Zm2 0v1h1V6H9Zm2 0v1h1V6h-1Zm-6 2v1h1V8H5Zm2 0v1h1V8H7Zm2 0v1h1V8H9Zm2 0v1h1V8h-1Zm-6 2v1h1v-1H5Zm2 0v1h1v-1H7Zm2 0v1h1v-1H9Zm2 0v1h1v-1h-1Zm-6 2v1h1v-1H5Zm2 0v1h1v-1H7Zm3 0v1h1v-1h-1Z"/>
              </svg>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Calculadora Km
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}