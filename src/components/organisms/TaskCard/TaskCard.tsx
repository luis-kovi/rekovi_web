// src/components/organisms/TaskCard/TaskCard.tsx
import React from 'react';
import { CardWithSLA } from '@/types/card.types';
import { StatusBadge } from '@/components/molecules/StatusBadge';
import { InfoField } from '@/components/molecules/InfoField';
import { formatPersonName, keepOriginalFormat, disabledPhases, disabledPhaseMessages } from '@/utils/helpers';
import { cn } from '@/utils/cn';

export interface TaskCardProps {
  card: CardWithSLA;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export function TaskCard({ 
  card, 
  onClick, 
  className,
  variant = 'default'
}: TaskCardProps) {
  const isDisabledPhase = disabledPhases.includes(card.faseAtual);
  
  if (isDisabledPhase) {
    const message = disabledPhaseMessages[card.faseAtual];
    
    return (
      <div className={cn(
        'bg-gradient-to-br from-gray-100/80 to-gray-200/60 rounded-xl shadow-lg border border-gray-300/50 flex flex-col opacity-60 cursor-not-allowed backdrop-blur-sm relative overflow-hidden',
        variant === 'compact' ? 'h-44' : 'h-56',
        className
      )}>
        {/* Efeito de carregamento */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/20 to-transparent animate-pulse" />
        
        <div className="p-3 flex justify-between items-center">
          <h3 className="font-bold text-gray-500 truncate text-sm">{card.placa}</h3>
          <StatusBadge status="No Prazo" className="bg-gray-300 text-gray-500" />
        </div>
        
        <div className="px-3 py-2 space-y-2 flex-1">
          <InfoField
            label="MODELO"
            value={formatPersonName(card.modeloVeiculo)}
            icon="car"
            variant="compact"
            className="text-gray-400"
          />
          <InfoField
            label="DRIVER"
            value={formatPersonName(card.nomeDriver)}
            icon="user"
            variant="compact"
            className="text-gray-400"
          />
          <InfoField
            label="CHOFER"
            value={formatPersonName(card.chofer)}
            icon="user"
            variant="compact"
            className="text-gray-400"
          />
        </div>
        
        <div className="p-2 flex items-center justify-center border-t border-gray-300">
          <div className="flex items-center text-xs text-gray-500 font-medium">
            <div className="animate-spin mr-1 h-3 w-3 border border-gray-400 border-t-transparent rounded-full" />
            <span className="text-center text-xs">{message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 flex flex-col cursor-pointer hover:shadow-xl hover:border-gray-300/80 hover:bg-white transition-all duration-300 group relative overflow-hidden',
        variant === 'compact' ? 'h-44' : 'h-56',
        className
      )}
      onClick={onClick}
    >
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out pointer-events-none" />
      
      {/* Header */}
      <div className="p-3 flex justify-between items-center bg-gradient-to-r from-gray-50/80 to-gray-100/60 rounded-t-xl border-b border-gray-200/50 relative z-10">
        <h3 className="font-bold text-gray-800 truncate text-sm tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>
          {card.placa}
        </h3>
        <StatusBadge 
          status={card.slaText} 
          className="shadow-sm backdrop-blur-sm border border-white/20"
        />
      </div>
      
      {/* Content */}
      <div className="px-3 py-2 space-y-2 text-xs flex-1 relative z-10">
        <InfoField
          label="MODELO"
          value={formatPersonName(card.modeloVeiculo)}
          icon="car"
          variant="compact"
        />
        <InfoField
          label="DRIVER"
          value={formatPersonName(card.nomeDriver)}
          icon="user"
          variant="compact"
        />
        <InfoField
          label="CHOFER"
          value={card.faseAtual !== 'Fila de Recolha' ? formatPersonName(card.chofer) : '-'}
          icon="user"
          variant="compact"
        />
      </div>
      
      {/* Footer */}
      <div className="p-2 flex items-center justify-between border-t border-gray-100/50 bg-gradient-to-r from-gray-50/80 to-white/60 rounded-b-xl mt-auto relative z-10 backdrop-blur-sm">
        <StatusBadge 
          status={card.slaText}
          slaValue={card.sla}
          showIcon={true}
          className="text-xs"
        />
        <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate max-w-16">{keepOriginalFormat(card.origemLocacao)}</span>
        </div>
      </div>
    </div>
  );
}
