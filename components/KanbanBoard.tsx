// components/KanbanBoard.tsx
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import ControlPanel from './ControlPanel'
import CardComponent from './Card'
import CardModal from './CardModal'
import LoadingIndicator from './LoadingIndicator'
import { calcularSLA, fixedPhaseOrder, phaseDisplayNames, disabledPhases, disabledPhaseMessages, formatPersonName, formatDate } from '@/utils/helpers'
import type { Card, CardWithSLA } from '@/types'

interface KanbanBoardProps {
  initialCards: Card[]
  permissionType?: string
  onUpdateStatus?: (isUpdating: boolean) => void
}

export default function KanbanBoard({ initialCards, permissionType, onUpdateStatus }: KanbanBoardProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [searchTerm, setSearchTerm] = useState('');
  const [slaFilter, setSlaFilter] = useState('all');
  const [hideEmptyPhases, setHideEmptyPhases] = useState(false);
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
  const [selectedCard, setSelectedCard] = useState<CardWithSLA | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<{ [key: string]: number }>({});

  // Real-time subscription para atualização automática
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // Função para buscar dados atualizados
    const fetchUpdatedData = async () => {
      setIsUpdating(true);
      onUpdateStatus?.(true);
      try {
        let query = supabase.from('v_pipefy_cards_detalhada').select(`
          card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
          phase_name, created_at, email_chofer, empresa_recolha,
          modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
          endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
          valor_recolha, custo_km_adicional, public_url
        `).limit(100000);

        // Filtrar apenas cards com fases válidas
        const validPhases = [
          'Fila de Recolha',
          'Aprovar Custo de Recolha', 
          'Tentativa 1 de Recolha',
          'Tentativa 2 de Recolha',
          'Tentativa 3 de Recolha',
          'Desbloquear Veículo',
          'Solicitar Guincho',
          'Nova tentativa de recolha',
          'Confirmação de Entrega no Pátio'
        ];
        
        query = query.in('phase_name', validPhases);
        
        // Aplicar filtros de permissão
        if (permissionType === 'ativa' || permissionType === 'onsystem') {
          query = query.ilike('empresa_recolha', permissionType);
        } else if (permissionType === 'chofer') {
          // Para chofer, precisamos do email do usuário atual
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            query = query.eq('email_chofer', user.email);
          }
        } else if (permissionType !== 'kovi' && permissionType !== 'admin') {
          query = query.eq('card_id', 'impossivel');
        }

        const { data: cardsData, error } = await query;
        
        if (error) {
          console.error('Erro ao buscar dados atualizados:', error);
          return;
        }

        if (cardsData) {
          const updatedCards: Card[] = cardsData.map((card: any) => ({
            id: card.card_id,
            placa: card.placa_veiculo,
            nomeDriver: card.nome_driver,
            chofer: card.nome_chofer_recolha,
            faseAtual: card.phase_name,
            dataCriacao: card.created_at,
            emailChofer: card.email_chofer,
            empresaResponsavel: card.empresa_recolha,
            modeloVeiculo: card.modelo_veiculo,
            telefoneContato: card.telefone_contato,
            telefoneOpcional: card.telefone_opcional,
            emailCliente: card.email_cliente,
            enderecoCadastro: card.endereco_cadastro,
            enderecoRecolha: card.endereco_recolha,
            linkMapa: card.link_mapa,
            origemLocacao: card.origem_locacao,
            valorRecolha: card.valor_recolha,
            custoKmAdicional: card.custo_km_adicional,
            urlPublica: card.public_url,
          })).filter((card: Card) => card.id && card.placa);

          // Salvar posições de scroll antes da atualização
          const containers = document.querySelectorAll('.phase-container');
          containers.forEach((container, index) => {
            const phaseName = container.getAttribute('data-phase');
            if (phaseName) {
              scrollPositionsRef.current[phaseName] = container.scrollTop;
            }
          });

          setCards(updatedCards);
          console.log('Dados atualizados via real-time:', updatedCards.length, 'cards');

          // Restaurar posições de scroll após a atualização
          setTimeout(() => {
            containers.forEach((container) => {
              const phaseName = container.getAttribute('data-phase');
              if (phaseName && scrollPositionsRef.current[phaseName] !== undefined) {
                container.scrollTop = scrollPositionsRef.current[phaseName];
              }
            });
          }, 0);
        }
      } catch (error) {
        console.error('Erro ao buscar dados atualizados:', error);
      } finally {
        setIsUpdating(false);
        onUpdateStatus?.(false);
      }
    };

    // Configurar real-time subscription
    const channel = supabase
      .channel('cards-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'v_pipefy_cards_detalhada'
        },
        (payload) => {
          console.log('Mudança detectada no Supabase:', payload);
          // Atualizar dados quando houver mudanças
          fetchUpdatedData();
        }
      )
      .subscribe();

    // Buscar dados iniciais
    fetchUpdatedData();

               // Configurar atualização periódica como fallback (a cada 10 segundos)
           const intervalId = setInterval(fetchUpdatedData, 10000);

    // Cleanup
    return () => {
      channel.unsubscribe();
      clearInterval(intervalId);
    };
  }, [permissionType]);

  // Atualizar cards quando initialCards mudar (fallback)
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
    const filtered = cardsWithSLA.filter(card => {
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

    // Ordenar por SLA (do maior para o menor) quando estiver na visualização de lista
    if (activeView === 'list') {
      return filtered.sort((a, b) => b.sla - a.sla);
    }

    return filtered;
  }, [cards, searchTerm, slaFilter, permissionType, activeView]);

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
  const handleMouseDown = (e: any) => {
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
      
      {/* Indicador de atualização automática */}
      {isLoading && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-center">
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Atualizando dados em tempo real...</span>
          </div>
        </div>
      )}
      
      <main className="flex-1 flex overflow-hidden">
        {isLoading ? (
          <LoadingIndicator message="A carregar dados..." />
        ) : (
          activeView === 'kanban' ? (
            <div id="kanban-view" className="flex-1 flex overflow-x-auto overflow-y-hidden kanban-board p-6 scroll-container bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 relative">
              {/* Background decorativo */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,53,90,0.03)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.03)_0%,transparent_50%)] pointer-events-none"></div>
              <div id="kanban-container" className="flex gap-4 relative z-10">
                {fixedPhaseOrder.map((phaseName, index) => {
                  const cardsInPhase = phases[phaseName] || [];
                  if (hideEmptyPhases && cardsInPhase.length === 0) return null;
                   
                  const displayPhaseName = phaseDisplayNames[phaseName] || phaseName;
                  const isDisabledPhase = disabledPhases.includes(phaseName);
                  const lateOrAlertCount = cardsInPhase.filter(c => c.sla >= 2).length;
                  
                                                  // Esquema de cores moderno e elegante baseado na cor primária #FF355A
                  const columnColors = [
                    { bg: 'bg-gradient-to-b from-red-50/80 to-red-100/60', border: 'border-red-200/50', header: 'bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846]', text: 'text-red-600', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { bg: 'bg-gradient-to-b from-orange-50/80 to-orange-100/60', border: 'border-orange-200/50', header: 'bg-gradient-to-br from-orange-500 via-orange-600 to-red-500', text: 'text-orange-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
                    { bg: 'bg-gradient-to-b from-yellow-50/80 to-yellow-100/60', border: 'border-yellow-200/50', header: 'bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-500', text: 'text-yellow-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { bg: 'bg-gradient-to-b from-amber-50/80 to-amber-100/60', border: 'border-amber-200/50', header: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-500', text: 'text-amber-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { bg: 'bg-gradient-to-b from-lime-50/80 to-lime-100/60', border: 'border-lime-200/50', header: 'bg-gradient-to-br from-lime-500 via-lime-600 to-green-500', text: 'text-lime-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { bg: 'bg-gradient-to-b from-emerald-50/80 to-emerald-100/60', border: 'border-emerald-200/50', header: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-500', text: 'text-emerald-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { bg: 'bg-gradient-to-b from-blue-50/80 to-blue-100/60', border: 'border-blue-200/50', header: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-500', text: 'text-blue-600', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                    { bg: 'bg-gradient-to-b from-indigo-50/80 to-indigo-100/60', border: 'border-indigo-200/50', header: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-500', text: 'text-indigo-600', icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' },
                    { bg: 'bg-gradient-to-b from-green-50/80 to-green-100/60', border: 'border-green-200/50', header: 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-500', text: 'text-green-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
                  ];
                   
                   const colorScheme = isDisabledPhase 
                     ? { 
                         bg: 'bg-gradient-to-b from-gray-100/60 to-gray-200/40', 
                         border: 'border-gray-300/50', 
                         header: 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600', 
                         text: 'text-gray-500',
                         icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                       }
                     : {
                         bg: columnColors[index % columnColors.length].bg,
                         border: columnColors[index % columnColors.length].border,
                         header: 'bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846]', // Cor padrão para todos
                         text: columnColors[index % columnColors.length].text,
                         icon: columnColors[index % columnColors.length].icon
                       };
                    
                   return (
                     <div key={phaseName} className={`w-56 ${colorScheme.bg} rounded-xl flex flex-col flex-shrink-0 shadow-lg border ${colorScheme.border} hover:shadow-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden group animate-in`}>
                       {/* Borda animada no hover */}
                       <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                       <div className={`${colorScheme.header} text-white p-2.5 rounded-t-xl relative overflow-hidden`}>
                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         {/* Partículas decorativas */}
                         <div className="absolute top-1.5 right-2 w-1 h-1 bg-white/30 rounded-full opacity-60"></div>
                         <div className="absolute top-2 right-4 w-0.5 h-0.5 bg-white/20 rounded-full opacity-40"></div>
                         <div className="relative z-10">
                           {/* Header principal compacto */}
                           <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-1.5 flex-1 min-w-0">
                               <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                   <path strokeLinecap="round" strokeLinejoin="round" d={colorScheme.icon} />
                                 </svg>
                               </div>
                               <h2 className="phase-title text-xs font-bold tracking-wide truncate" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>
                                 {displayPhaseName}
                               </h2>
                             </div>
                             
                             {/* Contador total sempre visível */}
                             <div className="flex items-center gap-1 bg-white/25 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm flex-shrink-0">
                               <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                               <span className="text-xs font-bold text-white">{cardsInPhase.length}</span>
                             </div>
                           </div>
                           
                           {/* Indicador de alertas posicionado de forma flutuante */}
                           {!isDisabledPhase && lateOrAlertCount > 0 && (
                             <div className="absolute -top-1 -right-1 z-20">
                               <div className="relative">
                                 <div className="flex items-center gap-1 text-amber-200 font-bold text-xs bg-amber-900/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-lg border border-amber-700/50">
                                   <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                   </svg>
                                   <span>{lateOrAlertCount}</span>
                                 </div>
                                 {/* Pulse animation */}
                                 <div className="absolute inset-0 bg-amber-400/30 rounded-full animate-ping"></div>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                       <div className={`flex-1 p-3 space-y-3 overflow-y-auto scroll-container phase-container ${isDisabledPhase ? 'opacity-60' : ''}`} data-phase={phaseName}>
                         {cardsInPhase.length > 0 ? (
                           cardsInPhase.map(card => (
                             <div 
                               key={card.id} 
                               onClick={isDisabledPhase ? undefined : () => setSelectedCard(card)} 
                               className={`transition-all duration-300 ${isDisabledPhase ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:translate-y-[-4px] hover:scale-[1.02]'}`}
                             >
                               <CardComponent card={card} />
                             </div>
                           ))
                         ) : (
                           <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDisabledPhase ? 'bg-gray-300/50' : 'bg-gray-100'}`}>
                               <svg className={`w-6 h-6 ${isDisabledPhase ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                             </div>
                             <p className={`text-sm font-medium ${isDisabledPhase ? 'text-gray-400' : 'text-gray-600'}`}>
                               {isDisabledPhase ? 'Fase em processamento' : 'Nenhuma recolha nesta fase'}
                             </p>
                             {isDisabledPhase && (
                               <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                 <span>Aguardando...</span>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                })}
              </div>
            </div>
          ) : (
            <div id="list-view" className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 h-full overflow-hidden relative">
                {/* Header moderno da tabela */}
                <div className="bg-gradient-to-r from-[#FF355A] to-[#E02E4D] text-white px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold tracking-wide">Lista de Recolhas</h2>
                        <p className="text-white/80 text-sm">Visualização em tabela</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
                        <span className="text-sm font-semibold">{filteredCards.length} itens</span>
                      </div>
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Container da tabela com scroll moderno */}
                <div className="overflow-y-auto h-full scroll-container">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                      <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="px-4 py-2 text-left">Placa</th>
                        <th className="px-4 py-2 text-left">Driver</th>
                        <th className="px-4 py-2 text-left">Chofer</th>
                        <th className="px-4 py-2 text-left">Fase Atual</th>
                        <th className="px-4 py-2 text-left">Data Criação</th>
                        <th className="px-4 py-2 text-center">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50">
                      {filteredCards.map((card, index) => {
                        const isDisabled = disabledPhases.includes(card.faseAtual);
                        const slaStatus = card.sla >= 3 ? 'atrasado' : card.sla === 2 ? 'alerta' : 'no-prazo';
                        const displayPhase = phaseDisplayNames[card.faseAtual] || card.faseAtual;
                        const formattedDate = formatDate(card.dataCriacao);
                        
                        if (isDisabled) {
                          return (
                            <tr key={card.id} className="border-b border-gray-100/50 bg-gray-50/30 opacity-60 cursor-not-allowed">
                              <td className="px-4 py-1.5 font-medium text-gray-400">{card.placa}</td>
                              <td className="px-4 py-1.5 text-gray-400">{formatPersonName(card.nomeDriver)}</td>
                              <td className="px-4 py-1.5 text-gray-400">
                                {!card.chofer || card.chofer === 'N/A' ? (
                                  <span className="italic text-xs text-gray-400">Não alocado</span>
                                ) : (
                                  formatPersonName(card.chofer)
                                )}
                              </td>
                              <td className="px-4 py-1.5 text-gray-400">{displayPhase}</td>
                              <td className="px-4 py-1.5 text-gray-400">{formattedDate}</td>
                              <td className="px-4 py-1.5 text-center">
                                <div className="flex items-center justify-center">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-gray-400 ml-2">Processando</span>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        
                        return (
                          <tr 
                            key={card.id} 
                            className={`border-b border-gray-100/30 hover:bg-[#FF355A]/5 cursor-pointer transition-all duration-200 group ${
                              index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'
                            }`}
                            onClick={() => setSelectedCard(card)}
                          >
                            <td className="px-4 py-1.5">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-[#FF355A] rounded-full mr-3 opacity-60"></div>
                                <span className="font-semibold text-gray-900 group-hover:text-[#FF355A] transition-colors">
                                  {card.placa}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-1.5">
                              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                                {formatPersonName(card.nomeDriver)}
                              </span>
                            </td>
                            <td className="px-4 py-1.5">
                              {!card.chofer || card.chofer === 'N/A' ? (
                                <span className="italic text-xs text-gray-500 group-hover:text-gray-600 transition-colors">Não alocado</span>
                              ) : (
                                <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                                  {formatPersonName(card.chofer)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-1.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 group-hover:bg-[#FF355A]/10 group-hover:text-[#FF355A] transition-all">
                                {displayPhase}
                              </span>
                            </td>
                            <td className="px-4 py-1.5">
                              <span className="text-gray-600 text-xs">
                                {formattedDate}
                              </span>
                            </td>
                            <td className="px-4 py-1.5 text-center">
                              <div className="flex items-center justify-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white transition-all duration-200 ${
                                  slaStatus === 'atrasado' 
                                    ? 'bg-red-500 shadow-lg shadow-red-500/30' 
                                    : slaStatus === 'alerta' 
                                    ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' 
                                    : 'bg-green-500 shadow-lg shadow-green-500/30'
                                }`}>
                                  {card.sla}
                                </span>
                                {slaStatus === 'atrasado' && (
                                  <div className="ml-2 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Estado vazio moderno */}
                  {filteredCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma recolha encontrada</h3>
                      <p className="text-sm text-gray-500">Tente ajustar os filtros ou a busca</p>
                    </div>
                  )}
                </div>
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