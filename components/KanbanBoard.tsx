// components/KanbanBoard.tsx
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import ControlPanel from './ControlPanel'
import CardComponent from './Card'
import CardModal from './CardModal'
import LoadingIndicator from './LoadingIndicator'
import { calcularSLA, fixedPhaseOrder, phaseDisplayNames, disabledPhases, disabledPhaseMessages, formatPersonName, formatDate } from '@/utils/helpers'
import type { Card, CardWithSLA } from '@/types'

interface KanbanBoardProps {
  initialCards: Card[]
  permissionType?: string
}

export default function KanbanBoard({ initialCards, permissionType }: KanbanBoardProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [searchTerm, setSearchTerm] = useState('');
  const [slaFilter, setSlaFilter] = useState('all');
  const [hideEmptyPhases, setHideEmptyPhases] = useState(false);
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
  const [selectedCard, setSelectedCard] = useState<CardWithSLA | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Atualizar cards quando initialCards mudar
  useEffect(() => {
    console.log('Debug - Initial Cards:', initialCards);
    console.log('Debug - Cards Count:', initialCards.length);
    console.log('Debug - Permission Type:', permissionType);
    setCards(initialCards);
  }, [initialCards, permissionType]);

  const filteredCards = useMemo((): CardWithSLA[] => {
    // Filtrar por permissão
    let permissionFilteredCards = [];
    const pType = permissionType?.toLowerCase();
    
    console.log('Debug - Filtering cards. Total cards:', cards.length);
    console.log('Debug - Permission type:', pType);
    
    switch (pType) {
      case 'ativa':
        permissionFilteredCards = cards.filter(card => card.empresaResponsavel?.toLowerCase() === 'ativa');
        break;
      case 'onsystem':
        permissionFilteredCards = cards.filter(card => card.empresaResponsavel?.toLowerCase() === 'onsystem');
        break;
      case 'chofer':
        const hiddenPhasesForChofer = ['Fila de Recolha', 'Aprovar Custo de Recolha'];
        permissionFilteredCards = cards.filter(card => !hiddenPhasesForChofer.includes(card.faseAtual));
        break;
      case 'admin':
      case 'kovi':
      default:
        permissionFilteredCards = cards;
        break;
    }
    
    console.log('Debug - After permission filter:', permissionFilteredCards.length);
    console.log('Debug - Sample card phases:', permissionFilteredCards.slice(0, 5).map(c => c.faseAtual));

    // Aplicar SLA e calcular SLA para cada card
    const cardsWithSLA = permissionFilteredCards.map(card => {
      const sla = calcularSLA(card.dataCriacao);
      let slaText: CardWithSLA['slaText'] = 'No Prazo';
      if (sla >= 3) slaText = 'Atrasado'; 
      else if (sla === 2) slaText = 'Em Alerta';
      return { ...card, sla, slaText };
    });

    // Filtrar por busca e SLA
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
  }, [cards, searchTerm, slaFilter, permissionType]);

  const phases = useMemo(() => {
    const phaseMap: { [key: string]: CardWithSLA[] } = {};
    let phaseOrderToRender = fixedPhaseOrder;
    
    console.log('Debug - Fixed phase order:', fixedPhaseOrder);
    console.log('Debug - Filtered cards count:', filteredCards.length);
    
    // Filtrar fases para chofer
    if (permissionType === 'chofer') {
      const hiddenPhasesForChofer = ['Fila de Recolha', 'Aprovar Custo de Recolha'];
      phaseOrderToRender = fixedPhaseOrder.filter(phase => !hiddenPhasesForChofer.includes(phase));
    }
    
    phaseOrderToRender.forEach(phase => { phaseMap[phase] = [] });
    filteredCards.forEach(card => { 
      if (phaseMap[card.faseAtual]) phaseMap[card.faseAtual].push(card) 
    });
    
    console.log('Debug - Phases with cards:', Object.keys(phaseMap).filter(phase => phaseMap[phase].length > 0));
    console.log('Debug - Cards per phase:', Object.entries(phaseMap).map(([phase, cards]) => `${phase}: ${cards.length}`));
    
    return phaseMap;
  }, [filteredCards, permissionType]);

  const handleUpdateChofer = async (cardId: string, newName: string, newEmail: string) => {
    // Implementar a lógica de atualização do chofer
    console.log('Atualizando chofer:', { cardId, newName, newEmail });
    // Aqui você implementaria a chamada para a API do Supabase
  };

  const handleOpenCalculator = () => {
    setShowCalculator(true);
    // Centralizar a calculadora na tela
    setCalculatorPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 });
  };

  const handleCloseCalculator = () => {
    setShowCalculator(false);
  };

  // Função para drag and drop da calculadora
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!calculatorRef.current) return;
    
    setIsDragging(true);
    const rect = calculatorRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      
      // Limitar aos limites da tela
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      setCalculatorPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      <ControlPanel
        activeView={activeView} 
        setActiveView={setActiveView}
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        slaFilter={slaFilter} 
        setSlaFilter={setSlaFilter}
        hideEmptyPhases={hideEmptyPhases} 
        setHideEmptyPhases={setHideEmptyPhases}
        permissionType={permissionType}
        onOpenCalculator={handleOpenCalculator}
      />
      
      <main className="flex-1 flex overflow-hidden">
        {cards.length === 0 ? (
          <LoadingIndicator message="A carregar dados..." />
        ) : (
          activeView === 'kanban' ? (
            <div id="kanban-view" className="flex-1 flex overflow-x-auto overflow-y-hidden kanban-board p-6 scroll-container bg-gradient-to-br from-gray-50 to-gray-100">
              <div id="kanban-container" className="flex gap-6">
                {fixedPhaseOrder.map((phaseName, index) => {
                  const cardsInPhase = phases[phaseName] || [];
                  if (hideEmptyPhases && cardsInPhase.length === 0) return null;
                   
                  const displayPhaseName = phaseDisplayNames[phaseName] || phaseName;
                  const isDisabledPhase = disabledPhases.includes(phaseName);
                  const lateOrAlertCount = cardsInPhase.filter(c => c.sla >= 2).length;
                  
                                                  // Cores baseadas no tom primário da ferramenta #FF355A
             const columnColors = [
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' },
               { bg: 'bg-gradient-to-b from-red-50 to-red-100', border: 'border-red-200', header: 'bg-gradient-to-r from-[#FF355A] to-[#E02E4D]', text: 'text-red-700' }
             ];
                   
                   const colorScheme = isDisabledPhase 
                     ? { bg: 'bg-gradient-to-b from-gray-50 to-gray-100', border: 'border-gray-300', header: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'text-gray-500' }
                     : columnColors[index % columnColors.length];
                    
                   return (
                     <div key={phaseName} className={`w-64 ${colorScheme.bg} rounded-lg flex flex-col flex-shrink-0 shadow-md border ${colorScheme.border} hover:shadow-lg transition-all duration-200`}>
                       <div className={`${colorScheme.header} text-white p-3 rounded-t-lg border-b ${colorScheme.border} shadow-sm`}>
                         <div className="flex items-center justify-between">
                           <h2 className="phase-title text-sm font-bold tracking-wide uppercase" style={{ fontFamily: 'Poppins, sans-serif' }}>
                             {displayPhaseName}
                           </h2>
                                                       <div className="flex items-center gap-1">
                              {!isDisabledPhase && lateOrAlertCount > 0 && (
                                <span className="flex items-center text-amber-300 font-bold text-xs bg-amber-900 bg-opacity-30 rounded-full px-1.5 py-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                  </svg>
                                  {lateOrAlertCount}
                                </span>
                              )}
                              <span className="text-xs font-bold bg-white bg-opacity-20 rounded-full px-1.5 py-0.5 text-gray-700">
                                {cardsInPhase.length}
                              </span>
                            </div>
                         </div>
                       </div>
                       <div className="flex-1 p-2 space-y-2 overflow-y-auto scroll-container">
                         {cardsInPhase.length > 0 ? (
                           cardsInPhase.map(card => (
                             <div key={card.id} onClick={() => setSelectedCard(card)} className="transition-transform duration-200 hover:translate-y-[-2px]">
                               <CardComponent card={card} />
                             </div>
                           ))
                         ) : (
                                                       <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-600">Nenhuma recolha nesta fase</p>
                            </div>
                         )}
                       </div>
                     </div>
                   );
                })}
              </div>
            </div>
          ) : (
            <div id="list-view" className="h-full w-full bg-gray-50 p-4">
              <div className="bg-white rounded-lg shadow-md h-full overflow-y-auto relative table-border-primary scroll-container">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs uppercase bg-gray-50 sticky top-0 z-10 table-header-primary">
                    <tr>
                      <th scope="col" className="px-6 py-3">Placa</th>
                      <th scope="col" className="px-6 py-3">Driver</th>
                      <th scope="col" className="px-6 py-3">Chofer</th>
                      <th scope="col" className="px-6 py-3">Fase Atual</th>
                      <th scope="col" className="px-6 py-3">Data Criação</th>
                      <th scope="col" className="px-6 py-3 text-center">SLA (dias)</th>
                    </tr>
                  </thead>
                  <tbody id="list-container" className="bg-white compact-table">
                    {filteredCards.map(card => {
                      const isDisabled = disabledPhases.includes(card.faseAtual);
                      const slaBg = card.sla >= 3 ? 'bg-red-100 blink' : card.sla === 2 ? 'bg-yellow-100' : 'bg-green-100';
                      const displayPhase = phaseDisplayNames[card.faseAtual] || card.faseAtual;
                      const formattedDate = formatDate(card.dataCriacao);
                      
                      if (isDisabled) {
                        return (
                          <tr key={card.id} className="table-list-item border-b bg-gray-100 opacity-70 cursor-not-allowed">
                            <td className="px-6 py-2 font-bold text-gray-500 card-placa">{card.placa}</td>
                            <td className="px-6 py-2 text-gray-500 card-driver">{formatPersonName(card.nomeDriver)}</td>
                            <td className="px-6 py-2 text-gray-500 card-chofer">{formatPersonName(card.chofer)}</td>
                            <td className="px-6 py-2 text-gray-500">{displayPhase}</td>
                            <td className="px-6 py-2 text-gray-500">{formattedDate}</td>
                            <td className="px-6 py-2 text-center">
                              <div className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 text-gray-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-xs text-gray-500">Processando</span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      
                      return (
                        <tr 
                          key={card.id} 
                          className={`table-list-item data-item border-b hover:bg-gray-50 cursor-pointer ${slaBg}`}
                          onClick={() => setSelectedCard(card)}
                        >
                          <td className="px-6 py-2 font-bold text-gray-900 card-placa">{card.placa}</td>
                          <td className="px-6 py-2 card-driver">{formatPersonName(card.nomeDriver)}</td>
                          <td className="px-6 py-2 card-chofer">{formatPersonName(card.chofer)}</td>
                          <td className="px-6 py-2">{displayPhase}</td>
                          <td className="px-6 py-2">{formattedDate}</td>
                          <td className="px-6 py-2 text-center font-bold text-lg">{card.sla}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>
      
      <CardModal 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)}
        onUpdateChofer={handleUpdateChofer}
      />

      {/* Modal da Calculadora */}
      {showCalculator && (
        <div id="calculatorModal" className="modal-overlay fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            ref={calculatorRef}
            id="calculatorContainer" 
            className="calculator-modal bg-white rounded-lg shadow-2xl border border-gray-200 cursor-move"
            style={{ 
              position: 'absolute',
              left: `${calculatorPosition.x}px`,
              top: `${calculatorPosition.y}px`,
              minWidth: '400px',
              minHeight: '600px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="calculator-header bg-primary text-white p-3 rounded-t-lg flex justify-between items-center cursor-move">
              <h3 className="text-lg font-semibold">Calculadora de KM</h3>
              <button 
                id="closeCalculator" 
                onClick={handleCloseCalculator} 
                className="text-white hover:text-gray-200 text-xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            <iframe 
              id="calculatorIframe" 
              src="https://calculadorakm.vercel.app/" 
              className="w-full h-full rounded-b-lg"
              style={{ height: 'calc(100% - 60px)' }}
              scrolling="no"
            />
          </div>
        </div>
      )}
    </>
  );
}