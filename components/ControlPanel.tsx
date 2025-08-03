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
}

export default function ControlPanel({
  activeView, setActiveView,
  searchTerm, setSearchTerm,
  slaFilter, setSlaFilter,
  hideEmptyPhases, setHideEmptyPhases
}: ControlPanelProps) {
  return (
    <div className="py-3 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-gray-100">
          <button
            onClick={() => setActiveView('kanban')}
            className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-2 ${
              activeView === 'kanban' ? 'bg-[#FF355A] text-white' : 'text-gray-600'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-2 ${
              activeView === 'list' ? 'bg-[#FF355A] text-white' : 'text-gray-600'
            }`}
          >
            Lista
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
            <span className="text-xs text-gray-700">Ocultar fases vazias</span>
            <button 
              onClick={() => setHideEmptyPhases(!hideEmptyPhases)}
              className={`relative w-8 h-5 rounded-full transition-colors ${hideEmptyPhases ? 'bg-[#FF355A]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${hideEmptyPhases ? 'translate-x-3' : 'translate-x-0'}`} />
            </button>
          </div>
          <select 
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#FF355A]"
          >
            <option value="all">Todos os SLAs</option>
            <option value="No Prazo">No Prazo</option>
            <option value="Em Alerta">Em Alerta</option>
            <option value="Atrasado">Atrasado</option>
          </select>
          <div className="relative">
            <input
              type="search"
              placeholder="Procurar cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 p-2 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF355A]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}