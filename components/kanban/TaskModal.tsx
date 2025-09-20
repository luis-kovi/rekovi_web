import React, { Suspense } from 'react';
import { Card } from '@/types/card.types';
import { motion } from 'framer-motion';

interface TaskModalProps {
  card: Card;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ card, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      style={{ willChange: 'transform' }}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose}>
          &times;
        </button>
        <h2 className="font-bold text-xl mb-4">Detalhes do Card</h2>
        <div className="space-y-2">
          <div><strong>Placa:</strong> {card.placa}</div>
          <div><strong>Modelo:</strong> {card.modeloVeiculo}</div>
          <div><strong>Chofer:</strong> {card.chofer}</div>
          <div><strong>Empresa:</strong> {card.empresaResponsavel}</div>
          <div><strong>Endereço:</strong> {card.enderecoRecolha}</div>
          <div><strong>Telefone:</strong> {card.telefoneContato}</div>
          <div><strong>Email Cliente:</strong> {card.emailCliente}</div>
          <div><strong>Data de Criação:</strong> {new Date(card.dataCriacao).toLocaleString()}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(TaskModal);