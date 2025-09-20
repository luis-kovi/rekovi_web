'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanColumn } from './kanban/core/KanbanColumn';
import { FilterPanel } from './kanban/widgets/FilterPanel';
import { MetricsWidget } from './kanban/widgets/MetricsWidget';
import CardModal from './CardModal';
import LoadingIndicator from './LoadingIndicator';
import { fixedPhaseOrder, phaseDisplayNames, calcularSLA } from '@/utils/helpers';
import type { Card, CardWithSLA } from '@/types';

interface KanbanBoardProps {
  cards: Card[];
  isLoading: boolean;
  isError: boolean;
  permissionType: string;
}

export default function KanbanBoard({ cards, isLoading, isError, permissionType }: KanbanBoardProps) {
  const [selectedCard, setSelectedCard] = useState<CardWithSLA | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [slaFilter, setSlaFilter] = useState('all');

  const cardsWithSLA = useMemo((): CardWithSLA[] => {
    return cards.map(card => {
      const sla = calcularSLA(card.dataCriacao);
      let slaText: CardWithSLA['slaText'] = 'No Prazo';
      if (sla >= 3) slaText = 'Atrasado';
      else if (sla === 2) slaText = 'Em Alerta';
      return { ...card, sla, slaText };
    });
  }, [cards]);

  const filteredCards = useMemo((): CardWithSLA[] => {
    return cardsWithSLA.filter(card => {
      const search = searchTerm.toLowerCase();
      const placa = (card.placa || '').toLowerCase();
      const driver = (card.nomeDriver || '').toLowerCase();
      const chofer = (card.chofer || '').toLowerCase();

      const matchesSearch = searchTerm === '' ||
        placa.includes(search) ||
        driver.includes(search) ||
        chofer.includes(search);

      const matchesSla = slaFilter === 'all' || card.slaText === slaFilter;

      return matchesSearch && matchesSla;
    });
  }, [cardsWithSLA, searchTerm, slaFilter]);

  const phases = useMemo(() => {
    const phaseMap: { [key: string]: CardWithSLA[] } = {};
    fixedPhaseOrder.forEach(phase => { phaseMap[phase] = [] });
    filteredCards.forEach(card => {
      if (phaseMap[card.faseAtual]) {
        phaseMap[card.faseAtual].push(card);
      }
    });
    return phaseMap;
  }, [filteredCards]);

  if (isLoading) {
    return <LoadingIndicator message="Loading board..." />;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error loading data. Please try again later.</div>;
  }

  // TODO: The action handlers for the modal need to be reimplemented.
  // For now, we are passing empty functions.
  const emptyFunc = async () => {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <div className="flex gap-4 mt-4">
            <FilterPanel />
            <MetricsWidget />
        </div>
      </header>

      <motion.main
        className="flex-1 flex overflow-x-auto p-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {fixedPhaseOrder.map(phaseName => (
          <motion.div key={phaseName} variants={itemVariants}>
            <KanbanColumn
              title={phaseDisplayNames[phaseName] || phaseName}
              cards={phases[phaseName] || []}
              onCardClick={setSelectedCard}
            />
          </motion.div>
        ))}
      </motion.main>

      <AnimatePresence>
        {selectedCard && (
          <CardModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            permissionType={permissionType}
            onUpdateChofer={emptyFunc}
            onAllocateDriver={emptyFunc}
            onRejectCollection={emptyFunc}
            onUnlockVehicle={emptyFunc}
            onRequestTowing={emptyFunc}
            onReportProblem={emptyFunc}
            onConfirmPatioDelivery={emptyFunc}
            onConfirmCarTowed={emptyFunc}
            onRequestTowMechanical={emptyFunc}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
