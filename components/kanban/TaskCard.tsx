import React from 'react';
import { Card } from '@/types/card.types';
import { motion } from 'framer-motion';

interface TaskCardProps {
  card: Card;
}

const getCycleTimeColor = (cycleTime: number) => {
  if (cycleTime < 2) return 'bg-green-100 text-green-700';
  if (cycleTime < 5) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const TaskCard: React.FC<TaskCardProps> = ({ card }) => {
  // Example: Calculate cycle time (days since creation)
  const cycleTime = Math.floor((Date.now() - new Date(card.dataCriacao).getTime()) / (1000 * 60 * 60 * 24));
  const cycleColor = getCycleTimeColor(cycleTime);

  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`rounded-lg shadow-sm bg-white border p-4 flex flex-col gap-2 min-h-[88px]`}
      style={{ willChange: 'transform' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900 text-base">{card.placa}</span>
        <span className={`text-xs px-2 py-1 rounded ${cycleColor}`}>{cycleTime}d</span>
      </div>
      <div className="text-xs text-gray-500">{card.modeloVeiculo}</div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{card.nomeDriver || card.chofer}</span>
        <span>•</span>
        <span>{card.empresaResponsavel}</span>
      </div>
    </motion.div>
  );
};

export default React.memo(TaskCard);