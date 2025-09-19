// src/components/optimized/MemoizedCard.tsx
import React from 'react';

// Tipo Card estendido com SLA (opcional para compatibilidade)
export interface CardWithOptionalSLA {
  id: string;
  placa: string;
  driver?: string;
  chofer?: string;
  phase: string;
  created_at: string;
  origin?: string;
  sla?: {
    hours: number;
    formatted: string;
  };
}

export interface MemoizedCardProps {
  card: CardWithOptionalSLA;
  isDisabledPhase: boolean;
  onClick?: (card: CardWithOptionalSLA) => void;
  className?: string;
}

// Componente memoizado para cards individuais
export const MemoizedCard = React.memo<MemoizedCardProps>(({
  card,
  isDisabledPhase,
  onClick,
  className
}) => {
  const handleClick = React.useCallback(() => {
    onClick?.(card);
  }, [onClick, card]);

  // Memoizar cálculos custosos
  const slaColor = React.useMemo(() => {
    if (!card.sla) return 'text-gray-400';
    
    const hours = card.sla.hours;
    if (hours <= 2) return 'text-green-600';
    if (hours <= 6) return 'text-yellow-600';
    if (hours <= 12) return 'text-orange-600';
    return 'text-red-600';
  }, [card.sla]);

  const statusColor = React.useMemo(() => {
    const colorMap = {
      'Em coleta': 'bg-blue-100 text-blue-800',
      'Coletado': 'bg-green-100 text-green-800',
      'Em análise': 'bg-yellow-100 text-yellow-800',
      'Aguardando peças': 'bg-orange-100 text-orange-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    
    return colorMap[card.phase as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  }, [card.phase]);

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-soft border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-medium cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {card.placa}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {card.phase}
        </span>
      </div>

      {/* Card Content */}
      <div className="space-y-2 text-sm">
        {card.driver && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">👤</span>
            <span className="text-gray-700 dark:text-gray-300">{card.driver}</span>
          </div>
        )}
        
        {card.chofer && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">🚗</span>
            <span className="text-gray-700 dark:text-gray-300">{card.chofer}</span>
          </div>
        )}
        
        {card.origin && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">📍</span>
            <span className="text-gray-700 dark:text-gray-300">{card.origin}</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        {card.sla && (
          <span className={`text-xs font-medium ${slaColor}`}>
            SLA: {card.sla.formatted}
          </span>
        )}
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(card.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para otimizar re-renders
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.phase === nextProps.card.phase &&
    prevProps.card.chofer === nextProps.card.chofer &&
    prevProps.isDisabledPhase === nextProps.isDisabledPhase &&
    prevProps.className === nextProps.className
  );
});

MemoizedCard.displayName = 'MemoizedCard';

// Componente memoizado para lista de cards
export interface MemoizedCardListProps {
  cards: CardWithOptionalSLA[];
  disabledPhases: string[];
  onCardClick?: (card: CardWithOptionalSLA) => void;
  className?: string;
}

export const MemoizedCardList = React.memo<MemoizedCardListProps>(({
  cards,
  disabledPhases,
  onCardClick,
  className
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {cards.map((card) => (
        <MemoizedCard
          key={card.id}
          card={card}
          isDisabledPhase={disabledPhases.includes(card.phase)}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação profunda otimizada
  if (prevProps.cards.length !== nextProps.cards.length) return false;
  if (prevProps.disabledPhases.length !== nextProps.disabledPhases.length) return false;
  if (prevProps.className !== nextProps.className) return false;
  
  // Verificar se os IDs dos cards mudaram (indicando reordenação ou novos cards)
  for (let i = 0; i < prevProps.cards.length; i++) {
    if (prevProps.cards[i].id !== nextProps.cards[i].id) return false;
    if (prevProps.cards[i].phase !== nextProps.cards[i].phase) return false;
  }
  
  return true;
});

MemoizedCardList.displayName = 'MemoizedCardList';
