// src/components/organisms/KanbanColumn/KanbanColumn.tsx
import React from 'react';
import { CardWithSLA } from '@/types/card.types';
import { TaskCard } from '@/components/organisms/TaskCard';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/utils/cn';

export interface KanbanColumnProps {
  title: string;
  cards: CardWithSLA[];
  onCardClick?: (card: CardWithSLA) => void;
  className?: string;
  isEmpty?: boolean;
  isDisabled?: boolean;
  emptyMessage?: string;
  colorScheme?: {
    bg: string;
    border: string;
    header: string;
    text: string;
    icon: string;
  };
}

const defaultColorScheme = {
  bg: 'bg-gradient-to-b from-red-50/80 to-red-100/60',
  border: 'border-red-200/50',
  header: 'bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846]',
  text: 'text-red-600',
  icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
};

const disabledColorScheme = {
  bg: 'bg-gradient-to-b from-gray-100/60 to-gray-200/40',
  border: 'border-gray-300/50',
  header: 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600',
  text: 'text-gray-500',
  icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
};

export function KanbanColumn({
  title,
  cards,
  onCardClick,
  className,
  isEmpty = false,
  isDisabled = false,
  emptyMessage,
  colorScheme
}: KanbanColumnProps) {
  const colors = isDisabled ? disabledColorScheme : (colorScheme || defaultColorScheme);
  const lateOrAlertCount = cards.filter(c => c.sla >= 2).length;

  return (
    <div className={cn(
      'w-56 rounded-xl flex flex-col flex-shrink-0 shadow-lg border hover:shadow-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden group animate-in',
      colors.bg,
      colors.border,
      isDisabled && 'opacity-60',
      className
    )}>
      {/* Borda animada no hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Header */}
      <div className={cn('text-white p-2.5 rounded-t-xl relative overflow-hidden', colors.header)}>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Partículas decorativas */}
        <div className="absolute top-1.5 right-2 w-1 h-1 bg-white/30 rounded-full opacity-60" />
        <div className="absolute top-2 right-4 w-0.5 h-0.5 bg-white/20 rounded-full opacity-40" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
              <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                <Icon name="user" size="xs" className="text-white" />
              </div>
              <h2 className="text-[10px] font-bold tracking-wide truncate leading-tight" 
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>
                {title}
              </h2>
            </div>
            
            {/* Indicadores */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Indicador de alertas */}
              {!isDisabled && lateOrAlertCount > 0 && (
                <Badge
                  variant="warning"
                  size="sm"
                  className="bg-amber-900/90 text-amber-200 border-amber-700/50"
                  icon={<Icon name="warning" size="xs" />}
                >
                  {lateOrAlertCount}
                </Badge>
              )}
              
              {/* Contador total */}
              <Badge
                variant="outline"
                size="sm"
                className="bg-white/25 text-white border-white/30"
              >
                {cards.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className={cn(
        'flex-1 p-3 space-y-3 overflow-y-auto scroll-container',
        isDisabled && 'opacity-60'
      )}>
        {cards.length > 0 ? (
          cards.map(card => (
            <TaskCard
              key={card.id}
              card={card}
              onClick={isDisabled ? undefined : () => onCardClick?.(card)}
              className={cn(
                'transition-all duration-300',
                !isDisabled && 'hover:translate-y-[-4px] hover:scale-[1.02]',
                isDisabled && 'cursor-not-allowed opacity-70'
              )}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center mb-3',
              isDisabled ? 'bg-gray-300/50' : 'bg-gray-100'
            )}>
              <Icon
                name="user"
                size="lg"
                className={isDisabled ? 'text-gray-400' : 'text-gray-500'}
              />
            </div>
            <p className={cn(
              'text-sm font-medium',
              isDisabled ? 'text-gray-400' : 'text-gray-600'
            )}>
              {emptyMessage || 'Nenhuma recolha nesta fase'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
