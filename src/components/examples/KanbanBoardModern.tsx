// src/components/examples/KanbanBoardModern.tsx
/**
 * Exemplo de implementação do KanbanBoard usando a nova arquitetura
 * Este componente demonstra como usar os novos componentes modulares
 */

import React, { useState } from 'react';
import { KanbanColumn } from '@/components/organisms/KanbanColumn';
import { SearchInput } from '@/components/molecules/SearchInput';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useCards } from '@/hooks/useCards';
import { usePipefyActions } from '@/hooks/usePipefyActions';
import { Card, CardPhase } from '@/types/card.types';
import { PermissionType } from '@/types/user.types';
import { ViewMode } from '@/types/ui.types';
import { fixedPhaseOrder, phaseDisplayNames } from '@/utils/helpers';

export interface KanbanBoardModernProps {
  initialCards: Card[];
  permissionType?: PermissionType;
  onUpdateStatus?: (isUpdating: boolean) => void;
}

export function KanbanBoardModern({
  initialCards,
  permissionType,
  onUpdateStatus
}: KanbanBoardModernProps) {
  const [activeView, setActiveView] = useState<ViewMode>('kanban');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Usar os novos hooks
  const {
    filteredCards,
    isLoading,
    isUpdating,
    filters,
    setFilters,
    refreshCards,
    statusCounts
  } = useCards(initialCards, {
    permissionType,
    onUpdateStatus,
    realTimeEnabled: true
  });

  const pipefyActions = usePipefyActions();

  // Organizar cards por fase
  const cardsByPhase = React.useMemo(() => {
    const phases: Record<string, typeof filteredCards> = {};
    
    fixedPhaseOrder.forEach(phase => {
      phases[phase] = filteredCards.filter(card => card.faseAtual === phase);
    });
    
    return phases;
  }, [filteredCards]);

  // Definir esquemas de cores para as fases
  const getPhaseColorScheme = (phase: string, index: number) => {
    const colorSchemes = [
      { bg: 'bg-gradient-to-b from-red-50/80 to-red-100/60', border: 'border-red-200/50', header: 'bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846]', text: 'text-red-600', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { bg: 'bg-gradient-to-b from-orange-50/80 to-orange-100/60', border: 'border-orange-200/50', header: 'bg-gradient-to-br from-orange-500 via-orange-600 to-red-500', text: 'text-orange-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
      { bg: 'bg-gradient-to-b from-yellow-50/80 to-yellow-100/60', border: 'border-yellow-200/50', header: 'bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-500', text: 'text-yellow-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { bg: 'bg-gradient-to-b from-green-50/80 to-green-100/60', border: 'border-green-200/50', header: 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-500', text: 'text-green-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
    ];
    
    return colorSchemes[index % colorSchemes.length];
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header de controles */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Kanban de Recolhas</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredCards.length} cards</span>
              <span>•</span>
              <span className="text-red-600">{statusCounts.atrasados} atrasados</span>
              <span>•</span>
              <span className="text-yellow-600">{statusCounts.emAlerta} em alerta</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <SearchInput
              value={filters.searchTerm || ''}
              onChange={(value) => setFilters({ searchTerm: value })}
              placeholder="Pesquisar por placa, driver..."
              className="w-64"
            />
            
            <Button
              variant="secondary"
              size="sm"
              onClick={refreshCards}
              isLoading={isUpdating}
              leftIcon={<Icon name="refresh" size="sm" />}
            >
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Indicador de atualização */}
      {isUpdating && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-center">
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Atualizando dados em tempo real...</span>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <main className="flex-1 flex overflow-x-auto overflow-y-hidden p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 relative">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,53,90,0.03)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.03)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="flex gap-4 relative z-10">
          {fixedPhaseOrder.map((phaseName, index) => {
            const cardsInPhase = cardsByPhase[phaseName] || [];
            
            // Pular fases vazias se o filtro estiver ativo
            if (filters.hideEmptyPhases && cardsInPhase.length === 0) return null;
            
            const displayPhaseName = phaseDisplayNames[phaseName] || phaseName;
            const colorScheme = getPhaseColorScheme(phaseName, index);
            
            return (
              <KanbanColumn
                key={phaseName}
                title={displayPhaseName}
                cards={cardsInPhase}
                onCardClick={setSelectedCard}
                colorScheme={colorScheme}
                emptyMessage={`Nenhuma recolha em ${displayPhaseName.toLowerCase()}`}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default KanbanBoardModern;
