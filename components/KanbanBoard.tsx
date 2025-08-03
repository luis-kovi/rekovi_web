// components/KanbanBoard.tsx
'use client'

import { useState, useMemo } from 'react'
import ControlPanel from './ControlPanel'
import CardComponent from './Card'
import CardModal from './CardModal'
import { calcularSLA } from '@/utils/helpers'
import type { Card, CardWithSLA } from '@/types'; // <-- CORREÇÃO IMPORTANTE

const fixedPhaseOrder = [ 'Fila de Recolha', 'Aprovar Custo de Recolha', 'Tentativa 1 de Recolha', 'Tentativa 2 de Recolha', 'Tentativa 3 de Recolha', 'Nova tentativa de recolha', 'Desbloquear Veículo', 'Solicitar Guincho', 'Confirmação de Entrega no Pátio' ];
const phaseDisplayNames: { [key: string]: string } = { 'Fila de Recolha': 'Fila', 'Aprovar Custo de Recolha': 'Aprovar Custo', 'Tentativa 1 de Recolha': 'Tentativa 1', 'Tentativa 2 de Recolha': 'Tentativa 2', 'Tentativa 3 de Recolha': 'Tentativa 3', 'Nova tentativa de recolha': 'Nova Tentativa', 'Desbloquear Veículo': 'Desbloquear', 'Solicitar Guincho': 'Guincho', 'Confirmação de Entrega no Pátio': 'Confirmar' };

interface KanbanBoardProps {
  initialCards: Card[]
}

export default function KanbanBoard({ initialCards }: KanbanBoardProps) {
    const [cards] = useState<Card[]>(initialCards);
    const [searchTerm, setSearchTerm] = useState('');
    const [slaFilter, setSlaFilter] = useState('all');
    const [hideEmptyPhases, setHideEmptyPhases] = useState(false);
    const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
    const [selectedCard, setSelectedCard] = useState<CardWithSLA | null>(null);

    const filteredCards = useMemo((): CardWithSLA[] => {
        const cardsWithSLA = cards.map(card => {
        const sla = calcularSLA(card.dataCriacao);
        let slaText: CardWithSLA['slaText'] = 'No Prazo';
        if (sla >= 3) slaText = 'Atrasado'; else if (sla === 2) slaText = 'Em Alerta';
        return { ...card, sla, slaText };
        });
        return cardsWithSLA.filter(card => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' || card.placa.toLowerCase().includes(search) || card.nomeDriver.toLowerCase().includes(search) || (card.chofer || '').toLowerCase().includes(search);
        const matchesSla = slaFilter === 'all' || card.slaText === slaFilter;
        return matchesSearch && matchesSla;
        });
    }, [cards, searchTerm, slaFilter]);

    const phases = useMemo(() => {
        const phaseMap: { [key: string]: CardWithSLA[] } = {};
        fixedPhaseOrder.forEach(phase => { phaseMap[phase] = [] });
        filteredCards.forEach(card => { if (phaseMap[card.faseAtual]) phaseMap[card.faseAtual].push(card) });
        return phaseMap;
    }, [filteredCards]);

    return (
        <>
          <ControlPanel
            activeView={activeView} setActiveView={setActiveView}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            slaFilter={slaFilter} setSlaFilter={setSlaFilter}
            hideEmptyPhases={hideEmptyPhases} setHideEmptyPhases={setHideEmptyPhases}
          />
          <main className="flex-1 overflow-auto">
            {activeView === 'kanban' ? (
              <div className="p-4 flex gap-4 h-full overflow-x-auto">
                {fixedPhaseOrder.map(phaseName => {
                  const cardsInPhase = phases[phaseName] || [];
                  if (hideEmptyPhases && cardsInPhase.length === 0) return null;
                  return (
                    <div key={phaseName} className="w-64 bg-gray-200 rounded-lg flex flex-col flex-shrink-0">
                      <div className="p-3 flex items-center justify-between border-b border-gray-300">
                        <h2 className="font-semibold text-sm text-gray-700">{phaseDisplayNames[phaseName]}</h2>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-300 rounded-full px-2 py-0.5">{cardsInPhase.length}</span>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                        {cardsInPhase.map(card => (
                          <div key={card.id} onClick={() => setSelectedCard(card)}>
                            <CardComponent card={card} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4">
                <table className="min-w-full bg-white">
                  {/* ... o seu código da tabela ... */}
                </table>
              </div>
            )}
          </main>
          <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
        </>
      );
}