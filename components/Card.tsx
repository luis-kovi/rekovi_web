// components/Card.tsx
import type { CardWithSLA } from '@/types';
import { formatPersonName, keepOriginalFormat, disabledPhases, disabledPhaseMessages } from '@/utils/helpers';

interface CardProps {
  card: CardWithSLA 
}

export default function Card({ card }: CardProps) {
  const isDisabledPhase = disabledPhases.includes(card.faseAtual);
  
  if (isDisabledPhase) {
    const message = disabledPhaseMessages[card.faseAtual];
    return (
      <div className="kanban-card bg-gradient-to-br from-gray-100/80 to-gray-200/60 rounded-xl shadow-lg border border-gray-300/50 flex flex-col h-56 opacity-60 cursor-not-allowed backdrop-blur-sm relative overflow-hidden">
      {/* Efeito de carregamento animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/20 to-transparent animate-pulse"></div>
        <div className="p-2 flex justify-between items-center">
          <h3 className="font-bold text-gray-500 card-placa truncate text-sm">{card.placa}</h3>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-gray-300 text-gray-500">Processando</span>
        </div>
        <div className="px-2 space-y-1 text-xs flex-1">
          <div className="text-gray-400">
            <div className="flex items-center gap-1 font-bold text-gray-500 mb-1" style={{ fontSize: '10px' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <span>MODELO</span>
            </div>
            <div className="truncate">{formatPersonName(card.modeloVeiculo)}</div>
          </div>
          <div className="text-gray-400 card-driver">
            <div className="flex items-center gap-1 font-bold text-gray-500 mb-1" style={{ fontSize: '10px' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>DRIVER</span>
            </div>
            <div className="truncate">{formatPersonName(card.nomeDriver)}</div>
          </div>
          <div className="text-gray-400 card-chofer">
            <div className="flex items-center gap-1 font-bold text-gray-500 mb-1" style={{ fontSize: '10px' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span>CHOFER</span>
            </div>
            <div className="truncate">{formatPersonName(card.chofer)}</div>
          </div>
        </div>
        <div className="p-2 flex items-center justify-center border-t border-gray-300">
          <div className="flex items-center text-xs text-gray-500 font-medium">
            <svg className="animate-spin mr-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-center text-xs">{message}</span>
          </div>
        </div>
      </div>
    );
  }

  const slaColor = card.slaText === 'Atrasado' ? 'bg-red-100 text-red-700 blink' 
                 : card.slaText === 'Em Alerta' ? 'bg-yellow-100 text-yellow-700' 
                 : 'bg-green-100 text-green-700';

  return (
    <div className="kanban-card data-item bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 flex flex-col h-56 cursor-pointer hover:shadow-xl hover:border-gray-300/80 hover:bg-white transition-all duration-300 group relative overflow-hidden">
      {/* Efeito de brilho animado no hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out pointer-events-none"></div>
      <div className="p-3 flex justify-between items-center bg-gradient-to-r from-gray-50/80 to-gray-100/60 rounded-t-xl border-b border-gray-200/50 relative z-10">
        <h3 className="font-bold text-gray-800 card-placa truncate text-sm tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>{card.placa}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${slaColor} shadow-sm backdrop-blur-sm border border-white/20`}>
          {card.slaText}
        </span>
      </div>
      <div className="px-3 py-2 space-y-2 text-xs flex-1 relative z-10">
        <div className="text-gray-600">
          <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
            <div className="w-3 h-3 flex items-center justify-center bg-blue-100 rounded-sm">
              <svg className="w-2 h-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span>MODELO</span>
          </div>
          <div className="truncate text-gray-800 font-medium text-xs">{formatPersonName(card.modeloVeiculo)}</div>
        </div>
        <div className="text-gray-600 card-driver">
          <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
            <div className="w-3 h-3 flex items-center justify-center bg-green-100 rounded-sm">
              <svg className="w-2 h-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span>DRIVER</span>
          </div>
          <div className="truncate text-gray-800 font-medium text-xs">{formatPersonName(card.nomeDriver)}</div>
        </div>
        <div className="text-gray-600 card-chofer">
          <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1" style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
            <div className="w-3 h-3 flex items-center justify-center bg-orange-100 rounded-sm">
              <svg className="w-2 h-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>CHOFER</span>
          </div>
          <div className="truncate text-gray-800 font-medium text-xs">{card.faseAtual !== 'Fila de Recolha' ? formatPersonName(card.chofer) : '-'}</div>
        </div>
      </div>
      <div className="p-2 flex items-center justify-between border-t border-gray-100/50 bg-gradient-to-r from-gray-50/80 to-white/60 rounded-b-xl mt-auto relative z-10 backdrop-blur-sm">
        <div className="flex items-center text-xs font-semibold">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            card.sla >= 3 ? 'bg-red-100 text-red-600' : 
            card.sla === 2 ? 'bg-yellow-100 text-yellow-600' : 
            'bg-green-100 text-green-600'
          }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>SLA: {card.sla}d</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{keepOriginalFormat(card.origemLocacao)}</span>
        </div>
      </div>
    </div>
  );
}     