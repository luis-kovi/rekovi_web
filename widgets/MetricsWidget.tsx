import React, { useMemo } from 'react';
import { Card } from '@/types/card.types';
import { KanbanColumnType } from '@/types/kanban.types';

interface MetricsWidgetProps {
  cards: Card[];
  columns: KanbanColumnType[];
}

const MetricsWidget: React.FC<MetricsWidgetProps> = ({ cards, columns }) => {
  // Example: Calculate average lead time per column
  const leadTimes = useMemo(() => {
    const map: Record<string, number[]> = {};
    columns.forEach(col => { map[col.id] = []; });
    cards.forEach(card => {
      if (map[card.faseAtual]) {
        const days = Math.floor((Date.now() - new Date(card.dataCriacao).getTime()) / (1000 * 60 * 60 * 24));
        map[card.faseAtual].push(days);
      }
    });
    return map;
  }, [cards, columns]);

  return (
    <div className="flex gap-6 items-center">
      {columns.map(col => {
        const times = leadTimes[col.id] || [];
        const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '-';
        return (
          <div key={col.id} className="flex flex-col items-center">
            <span className="text-xs text-gray-500">{col.title}</span>
            <span className="font-bold text-base text-blue-600">{avg}d</span>
          </div>
        );
      })}
      {/* Add Cumulative Flow Diagram here (compact SVG) */}
    </div>
  );
};

export default React.memo(MetricsWidget);