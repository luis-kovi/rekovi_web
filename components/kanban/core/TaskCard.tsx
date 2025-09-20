import React from 'react';
import { motion } from 'framer-motion';
import type { CardWithSLA } from '@/types';
import { formatPersonName } from '@/utils/helpers';
import { Clock, User, Car } from 'lucide-react';

interface TaskCardProps {
  card: CardWithSLA;
  onClick: () => void;
}

const TaskCardComponent: React.FC<TaskCardProps> = ({ card, onClick }) => {
  const getSlaColor = () => {
    switch (card.slaText) {
      case 'Atrasado':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'Em Alerta':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-700 border-green-500/20';
    }
  };

  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200/80 cursor-pointer p-4 space-y-3"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-sm text-gray-800 tracking-tight">{card.placa}</h3>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSlaColor()}`}>
          {card.slaText}
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Car size={14} className="text-gray-400" />
          <span className="font-medium">{formatPersonName(card.modeloVeiculo)}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span className="font-medium">{formatPersonName(card.nomeDriver)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span className="font-medium">{card.dataCriacao ? new Date(card.dataCriacao).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const TaskCard = React.memo(TaskCardComponent);
