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
      <div className="kanban-card bg-gray-200 rounded-md shadow-sm border border-gray-300 flex flex-col h-48 opacity-70 cursor-not-allowed">
        <div className="p-2 flex justify-between items-center">
          <h3 className="font-bold text-gray-500 card-placa truncate text-sm">{card.placa}</h3>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-gray-300 text-gray-500">Processando</span>
        </div>
        <div className="px-2 space-y-1 text-xs flex-1">
          <div className="text-gray-400">
            <div className="font-bold text-gray-500" style={{ fontSize: '10px' }}>🚗 MODELO</div>
            <div className="truncate">{formatPersonName(card.modeloVeiculo)}</div>
          </div>
          <div className="text-gray-400 card-driver">
            <div className="font-bold text-gray-500" style={{ fontSize: '10px' }}>👤 DRIVER</div>
            <div className="truncate">{formatPersonName(card.nomeDriver)}</div>
          </div>
          <div className="text-gray-400 card-chofer">
            <div className="font-bold text-gray-500" style={{ fontSize: '10px' }}>🚛 CHOFER</div>
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
    <div className="kanban-card data-item bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-52 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-300 backdrop-blur-sm">
      <div className="p-2 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b border-gray-200">
        <h3 className="font-bold text-gray-800 card-placa truncate text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>{card.placa}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${slaColor} shadow-sm`}>
          {card.slaText}
        </span>
      </div>
      <div className="px-3 py-1 space-y-1 text-xs flex-1">
        <div className="text-gray-600">
          <div className="font-semibold text-gray-700 mb-0.5" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>🚗 MODELO</div>
          <div className="truncate text-gray-800 font-medium">{formatPersonName(card.modeloVeiculo)}</div>
        </div>
        <div className="text-gray-600 card-driver">
          <div className="font-semibold text-gray-700 mb-0.5" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>👤 DRIVER</div>
          <div className="truncate text-gray-800 font-medium">{formatPersonName(card.nomeDriver)}</div>
        </div>
        <div className="text-gray-600 card-chofer">
          <div className="font-semibold text-gray-700 mb-0.5" style={{ fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>🚛 CHOFER</div>
          <div className="truncate text-gray-800 font-medium">{card.faseAtual !== 'Fila de Recolha' ? formatPersonName(card.chofer) : '-'}</div>
        </div>
      </div>
      <div className="p-2 flex items-center justify-between border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-b-lg mt-auto">
        <div className="flex items-center text-xs text-red-600 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          SLA: {card.sla}d
        </div>
        <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
          📍 {keepOriginalFormat(card.origemLocacao)}
        </span>
      </div>
    </div>
  );
}