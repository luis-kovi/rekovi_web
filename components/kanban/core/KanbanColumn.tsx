import React from 'react';
import type { CardWithSLA } from '@/types';
import { TaskCard } from './TaskCard';
import { useVirtualizer } from '@tanstack/react-virtual';

interface KanbanColumnProps {
  title: string;
  cards: CardWithSLA[];
  onCardClick: (card: CardWithSLA) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, cards, onCardClick }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // TODO: Implement drag and drop for cards
  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimate card height + gap
    overscan: 5,
  });

  return (
    <div className="w-80 bg-gray-100 rounded-lg p-4 flex flex-col flex-shrink-0" style={{ height: 'calc(100vh - 150px)' }}>
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '8px',
              }}
            >
              <TaskCard
                card={cards[virtualItem.index]}
                onClick={() => onCardClick(cards[virtualItem.index])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
