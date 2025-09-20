"use client";
import React, { Suspense, useMemo } from 'react';
import KanbanColumn from './KanbanColumn';
import MetricsWidget from '../../widgets/MetricsWidget';
import FilterPanel from '../../widgets/FilterPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/types/card.types';
import { KanbanColumnType } from '@/types/kanban.types';

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  cards: Card[];
  loading: boolean;
  error?: string;
  wipLimits: Record<string, number>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, cards, loading, error, wipLimits }) => {
  // Virtualize columns for performance
  const parentRef = React.useRef<HTMLDivElement>(null);
  const columnVirtualizer = useVirtualizer({
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320,
    horizontal: true,
    overscan: 2,
  });

  // Memoize cards by column
  const cardsByColumn = useMemo(() => {
    const map: Record<string, Card[]> = {};
    columns.forEach(col => { map[col.id] = []; });
    cards.forEach(card => {
      if (map[card.faseAtual]) map[card.faseAtual].push(card);
    });
    return map;
  }, [columns, cards]);

  if (loading) {
    return <div className="flex w-full h-full items-center justify-center"><span className="animate-pulse">Loading Kanban...</span></div>;
  }
  if (error) {
    return <div className="text-red-500 p-8">Error: {error}</div>;
  }
  if (columns.length === 0) {
    return <div className="p-8 text-center text-gray-400">No columns available.</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full h-full">
      <div className="flex items-center justify-between px-8 pt-8">
        <FilterPanel />
        <MetricsWidget cards={cards} columns={columns} />
      </div>
      <div ref={parentRef} className="flex overflow-x-auto gap-8 px-8 pb-8" style={{ willChange: 'transform' }}>
        <div style={{ width: columnVirtualizer.getTotalSize(), height: '100%', position: 'relative' }}>
          {columnVirtualizer.getVirtualItems().map(virtualCol => {
            const col = columns[virtualCol.index];
            return (
              <motion.div
                key={col.id}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  left: virtualCol.start,
                  width: virtualCol.size,
                  height: '100%',
                }}
              >
                <KanbanColumn
                  column={col}
                  cards={cardsByColumn[col.id] || []}
                  wipLimit={wipLimits[col.id]}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(KanbanBoard);