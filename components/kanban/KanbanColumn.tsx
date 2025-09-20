import React, { useMemo } from 'react';
import TaskCard from './TaskCard';
import { Card } from '@/types/card.types';
import { KanbanColumnType } from '@/types/kanban.types';
import { motion } from 'framer-motion';

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: Card[];
  wipLimit?: number;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, cards, wipLimit }) => {
  const isWipLimitReached = wipLimit !== undefined && cards.length >= wipLimit;

  // Memoize sorted cards (e.g., by created date)
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime());
  }, [cards]);

  return (
    <motion.div layout className="bg-white rounded-lg shadow-md flex flex-col w-[320px] min-w-[320px] max-w-[320px] h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-semibold text-lg text-gray-900">{column.title}</span>
        {wipLimit !== undefined && (
          <span className={`text-xs px-2 py-1 rounded ${isWipLimitReached ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{cards.length}/{wipLimit}</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {sortedCards.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No tasks</div>
        ) : (
          sortedCards.map(card => <TaskCard key={card.id} card={card} />)
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(KanbanColumn);