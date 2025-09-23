// components/KanbanBoard.tsx
'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import ControlPanel from './ControlPanel'
import CardComponent from './Card'
import CardModal from './CardModal'
import LoadingIndicator from './LoadingIndicator'
import { calcularSLA, fixedPhaseOrder, phaseDisplayNames, disabledPhases, disabledPhaseMessages, formatPersonName, formatDate } from '@/utils/helpers'
import type { Card, CardWithSLA } from '@/types'
import { logger } from '@/utils/logger'
import { useCards } from '@/hooks/useCards'

interface KanbanBoardProps {
  initialCards: Card[]
  permissionType?: string
  onUpdateStatus?: (isUpdating: boolean) => void
}

export default function KanbanBoard({ initialCards, permissionType, onUpdateStatus }: KanbanBoardProps) {
  const { cards, setCards, isLoading } = useCards(initialCards, permissionType, onUpdateStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [slaFilter, setSlaFilter] = useState('all');
  const [hideEmptyPhases, setHideEmptyPhases] = useState(false);
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
  const [selectedCard, setSelectedCard] = useState<CardWithSLA | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<{ [key: string]: number }>({});

  const filteredCards = useMemo((): CardWithSLA[] => {
    // Filtrar por permissão
    let permissionFilteredCards = [];
    const pType = permissionType?.toLowerCase();
    
    logger.log('Debug - Filtering cards. Total cards:', cards.length);
    logger.log('Debug - Permission type:', pType);
    
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
    
    logger.log('Debug - After permission filter:', permissionFilteredCards.length);
    logger.log('Debug - Sample card phases:', permissionFilteredCards.slice(0, 5).map(c => c.faseAtual));

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

  const [visibleCards, setVisibleCards] = useState<{ [key: string]: number }>({});

  const phases = useMemo(() => {
    const phaseMap: { [key: string]: CardWithSLA[] } = {};
    let phaseOrderToRender = fixedPhaseOrder;
    
    logger.log('Debug - Fixed phase order:', fixedPhaseOrder);
    logger.log('Debug - Filtered cards count:', filteredCards.length);
    
    // Filtrar fases para chofer
    if (permissionType === 'chofer') {
      const hiddenPhasesForChofer = ['Fila de Recolha', 'Aprovar Custo de Recolha'];
      phaseOrderToRender = fixedPhaseOrder.filter(phase => !hiddenPhasesForChofer.includes(phase));
    }
    
    phaseOrderToRender.forEach(phase => { phaseMap[phase] = [] });
    filteredCards.forEach(card => { 
      if (phaseMap[card.faseAtual]) phaseMap[card.faseAtual].push(card) 
    });
    
    logger.log('Debug - Phases with cards:', Object.keys(phaseMap).filter(phase => phaseMap[phase].length > 0));
    logger.log('Debug - Cards per phase:', Object.entries(phaseMap).map(([phase, cards]) => `${phase}: ${cards.length}`));
    
    return phaseMap;
  }, [filteredCards, permissionType]);

  const handleScroll = (phaseName: string, e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setVisibleCards(prev => ({
        ...prev,
        [phaseName]: Math.min((prev[phaseName] || 10) + 10, phases[phaseName]?.length || 0)
      }));
    }
  };

  const getVisibleCardsForPhase = (phaseName: string) => {
    const allCards = phases[phaseName] || [];
    const visibleCount = visibleCards[phaseName] || 10;
    return allCards.slice(0, visibleCount);
  };

  const handleUpdateChofer = async (cardId: string, newName: string, newEmail: string) => {
    logger.log('Atualizando chofer:', { cardId, newName, newEmail });
    
    try {
      const supabase = createClient();
      
      // Obter o token de autenticação do usuário atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // O cardId já é o card_id do Pipefy (vem da view v_pipefy_cards_detalhada)
      // Query GraphQL para atualizar o chofer no Pipefy
      const pipefyQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                {
                  fieldId: "nome_do_chofer_que_far_a_recolha",
                  value: "${newName}"
                },
                {
                  fieldId: "e_mail_do_chofer",
                  value: "${newEmail}"
                }
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      // Chamar a Function Edge do Supabase
      // Usar a mesma URL que está nas variáveis de ambiente do cliente
      const supabaseUrl = (supabase as any).supabaseUrl;
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: pipefyQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro na API: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      logger.log('Chofer atualizado com sucesso no Pipefy:', result);
      
      // Atualizar o estado local do card para refletir a mudança imediatamente
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId 
            ? { ...card, chofer: newName, emailChofer: newEmail }
            : card
        )
      );
      
    } catch (error) {
      logger.error('Erro ao atualizar chofer:', error);
      throw error; // Re-throw para que o CardModal possa exibir o erro
    }
  };

  const handleAllocateDriver = async (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string, billingType: string) => {
    logger.log('Alocando chofer:', { cardId, driverName, driverEmail, dateTime, collectionValue, additionalKm, billingType });
    
    try {
      const supabase = createClient();
      
      // Obter o token de autenticação e dados do usuário atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // Obter dados do usuário para o comentário
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Usuário desconhecido';

      // Preparar os valores para atualização
      const fieldsToUpdate = [
        {
          fieldId: "nome_do_chofer_que_far_a_recolha",
          value: driverName
        },
        {
          fieldId: "e_mail_do_chofer",
          value: driverEmail
        },
        {
          fieldId: "data_e_hora_prevista_para_recolha",
          value: dateTime
        },
        {
          fieldId: "custo_de_km_adicional",
          value: additionalKm
        },
        {
          fieldId: "ve_culo_ser_recolhido",
          value: "Sim"
        },
        {
          fieldId: "tipo_de_faturamento",
          value: billingType
        }
      ];

      // Adicionar valor da recolha se fornecido
      if (collectionValue) {
        fieldsToUpdate.push({
          fieldId: "valor_da_recolha",
          value: collectionValue
        });
      }

      // Query GraphQL para atualizar os campos no Pipefy
      const pipefyQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: ${JSON.stringify(fieldsToUpdate).replace(/"fieldId"/g, 'fieldId').replace(/"value"/g, 'value')}
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      // Adicionar comentário
      const commentQuery = `
        mutation {
          createComment(
            input: {
              card_id: "${cardId}"
              text: "O ${userEmail} alocou o chofer para recolha."
            }
          ) {
            comment {
              id
              text
              created_at
              author {
                id
                name
              }
            }
          }
        }
      `;

      // Usar a mesma URL que está nas variáveis de ambiente do cliente
      const supabaseUrl = (supabase as any).supabaseUrl;
      
      // Executar a mutation para atualizar campos
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: pipefyQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro na API: ${response.status}`);
      }

      // Executar a mutation para adicionar comentário
      const commentResponse = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: commentQuery
        })
      });

      logger.log('Chofer alocado com sucesso no Pipefy');
      
      // Atualizar o estado local do card
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId 
            ? { ...card, chofer: driverName, emailChofer: driverEmail }
            : card
        )
      );
      
    } catch (error) {
      logger.error('Erro ao alocar chofer:', error);
      throw error;
    }
  };

  const handleRejectCollection = async (cardId: string, reason: string, observations: string) => {
    logger.log('Rejeitando recolha:', { cardId, reason, observations });
    
    try {
      const supabase = createClient();
      
      // Obter o token de autenticação e dados do usuário atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // Obter dados do usuário para o comentário
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Usuário desconhecido';

      // Query GraphQL para atualizar o campo no Pipefy
      const pipefyQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                {
                  fieldId: "ve_culo_ser_recolhido",
                  value: "Não"
                }
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      // Adicionar comentário
      const commentQuery = `
        mutation {
          createComment(
            input: {
              card_id: "${cardId}"
              text: "O ${userEmail} rejeitou a recolha.\\nMotivo: ${reason}\\nComentário: ${observations}"
            }
          ) {
            comment {
              id
              text
              created_at
              author {
                id
                name
              }
            }
          }
        }
      `;

      // Usar a mesma URL que está nas variáveis de ambiente do cliente
      const supabaseUrl = (supabase as any).supabaseUrl;
      
      // Executar a mutation para atualizar campo
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: pipefyQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro na API: ${response.status}`);
      }

      // Executar a mutation para adicionar comentário
      const commentResponse = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: commentQuery
        })
      });

      logger.log('Recolha rejeitada com sucesso no Pipefy');
      
    } catch (error) {
      logger.error('Erro ao rejeitar recolha:', error);
      throw error;
    }
  };

  // Função utilitária para upload de imagens via Pipefy
  const uploadImageToPipefy = async (file: File, fieldId: string, cardId: string, session: any) => {
    try {
      const supabaseUrl = (createClient() as any).supabaseUrl;
      
      // Passo 1: Gerar URL pré-assinada
      const fileName = `${cardId}_${fieldId}_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
      const presignedQuery = `
        mutation CreatePresignedUrl($organizationId: ID!, $fileName: String!, $contentType: String!) {
          createPresignedUrl(
            input: {
              organizationId: $organizationId
              fileName: $fileName
              contentType: $contentType
            }
          ) {
            url
            downloadUrl
            clientMutationId
          }
        }
      `;

      const variables = {
        organizationId: "281428",
        fileName: fileName,
        contentType: file.type
      };

      logger.log('Enviando query para presigned URL:', presignedQuery);

      const presignedResponse = await fetch(`${supabaseUrl}/functions/v1/upload-image-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          query: presignedQuery,
          variables: variables
        })
      });

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        logger.error('Erro na resposta presigned:', errorText);
        throw new Error(`Erro ao gerar URL de upload: ${presignedResponse.status} - ${errorText}`);
      }

      const presignedData = await presignedResponse.json();
      logger.log('Resposta completa presigned URL:', presignedData);

      // Verificar se há erros na resposta
      if (presignedData.errors && presignedData.errors.length > 0) {
        logger.error('Erros da API Pipefy:', presignedData.errors);
        const errorMessages = presignedData.errors.map((error: any) => error.message).join(', ');
        throw new Error(`Erro na API Pipefy: ${errorMessages}`);
      }

      // Verificar se a resposta tem a estrutura esperada
      if (!presignedData?.data?.createPresignedUrl) {
        logger.error('Estrutura de resposta inválida:', presignedData);
        throw new Error('Resposta inválida da API de presigned URL');
      }

      const { url: uploadUrl, downloadUrl } = presignedData.data.createPresignedUrl;

      if (!uploadUrl || !downloadUrl) {
        throw new Error('URLs de upload/download não fornecidas');
      }

      logger.log('URLs obtidas:', { uploadUrl, downloadUrl });

      // Passo 2: Upload da imagem
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        logger.error('Erro no upload:', errorText);
        throw new Error(`Erro ao fazer upload da imagem: ${uploadResponse.status}`);
      }

      logger.log('Upload realizado com sucesso');

      // Passo 3: Atualizar campo no card com o path do arquivo
      // Extrair o path do arquivo da downloadUrl
      const urlParts = downloadUrl.split('/uploads/');
      const filePath = urlParts[1] ? urlParts[1].split('?')[0] : '';
      const organizationId = "870bddf7-6ce7-4b9d-81d8-9087f1c10ae2"; // ID da organização
      const fullPath = `orgs/${organizationId}/uploads/${filePath}`;
      
      logger.log('Path do arquivo:', fullPath);

      const updateFieldQuery = `
        mutation {
          updateCardField(
            input: {
              card_id: "${cardId}"
              field_id: "${fieldId}"
              new_value: ["${fullPath}"]
            }
          ) {
            success
            clientMutationId
          }
        }
      `;

      logger.log('Atualizando campo com URL:', updateFieldQuery);

      const updateResponse = await fetch(`${supabaseUrl}/functions/v1/upload-image-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateFieldQuery })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        logger.error('Erro ao atualizar campo:', errorText);
        throw new Error(`Erro ao atualizar campo com imagem: ${updateResponse.status}`);
      }

      const updateData = await updateResponse.json();
      logger.log('Resposta updateCardField completa:', updateData);

      // Verificar se há erros na atualização do campo
      if (updateData.errors && updateData.errors.length > 0) {
        logger.error('Erros ao atualizar campo:', updateData.errors);
        const errorMessages = updateData.errors.map((error: any) => error.message).join(', ');
        throw new Error(`Erro ao atualizar campo ${fieldId}: ${errorMessages}`);
      }

      logger.log('Campo atualizado com sucesso:', updateData);
      return downloadUrl;
    } catch (error) {
      logger.error('Erro no upload da imagem:', error);
      throw error;
    }
  };

  // Função para mapear fase para os IDs corretos dos campos
  const getPhaseFieldIds = (phase: string) => {
    const phaseFieldMap: Record<string, any> = {
      'Tentativa 1 de Recolha': {
        action: 'para_seguir_com_a_recolha_nos_informe_a_a_o_necess_ria',
        reason: 'qual_o_motivo_do_guincho',
        difficulty: 'carro_localizado',
        photos: {
          frente: 'foto_do_ve_culo_e_ou_local_da_recolha_1',
          traseira: 'foto_do_ve_culo_e_ou_local_da_recolha_2',
          lateralEsquerda: 'foto_do_ve_culo_e_ou_local_da_recolha_3',
          lateralDireita: 'foto_da_lateral_direita_passageiro',
          estepe: 'foto_do_estepe',
          painel: 'foto_do_painel'
        },
        evidences: {
          photo1: 'evid_ncia_1',
          photo2: 'evid_ncia_2',
          photo3: 'evid_ncia_3'
        }
      },
      'Tentativa 2 de Recolha': {
        action: 'para_seguir_com_a_recolha_informe_a_a_o_necess_ria',
        reason: 'qual_o_motivo_do_guincho_1',
        difficulty: 'carro_localizado_1',
        photos: {
          frente: 'foto_do_ve_culo_e_ou_local_da_recolha_1_1',
          traseira: 'foto_do_ve_culo_e_ou_local_da_recolha_2_1',
          lateralEsquerda: 'foto_do_ve_culo_e_ou_local_da_recolha_3_1',
          lateralDireita: 'foto_da_lateral_direita_passageiro_1',
          estepe: 'foto_do_estepe_1',
          painel: 'foto_do_painel_1'
        },
        evidences: {
          photo1: 'evid_ncia_1_1',
          photo2: 'evid_ncia_2_1',
          photo3: 'evid_ncia_3_1'
        }
      },
      'Tentativa 3 de Recolha': {
        action: 'para_seguir_com_a_recolha_informe_a_a_o_necess_ria_1',
        reason: 'qual_o_motivo_do_guincho_2',
        difficulty: 'carro_localizado_2',
        photos: {
          frente: 'foto_do_ve_culo_e_ou_local_da_recolha_1_2',
          traseira: 'foto_do_ve_culo_e_ou_local_da_recolha_2_2',
          lateralEsquerda: 'foto_do_ve_culo_e_ou_local_da_recolha_3_2',
          lateralDireita: 'foto_da_lateral_direita_passageiro_2',
          estepe: 'foto_do_estepe_2',
          painel: 'foto_do_painel_2'
        },
        evidences: {
          photo1: 'evid_ncia_1_2',
          photo2: 'evid_ncia_2_2',
          photo3: 'evid_ncia_3_2'
        }
      },
      'Tentativa 4 de Recolha': {
        action: 'para_seguir_com_a_recolha_informe_a_a_o_necess_ria_2',
        reason: 'qual_o_motivo_do_guincho_3',
        difficulty: 'carro_localizado_3',
        photos: {
          frente: 'foto_do_ve_culo_e_ou_local_da_recolha_1_3',
          traseira: 'foto_do_ve_culo_e_ou_local_da_recolha_2_3',
          lateralEsquerda: 'foto_do_ve_culo_e_ou_local_da_recolha_3_3',
          lateralDireita: 'foto_da_lateral_direita_passageiro_3',
          estepe: 'foto_do_estepe_3',
          painel: 'foto_do_painel_3'
        },
        evidences: {
          photo1: 'evid_ncia_1_3',
          photo2: 'evid_ncia_2_3',
          photo3: 'evid_ncia_3_3'
        }
      }
    };
    return phaseFieldMap[phase] || phaseFieldMap['Tentativa 1 de Recolha'];
  };

  const handleUnlockVehicle = async (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => {
    logger.log('Desbloqueando veículo:', { cardId, phase, photos, observations });
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Usuário desconhecido';
      const fieldIds = getPhaseFieldIds(phase);

      // Upload das imagens
      const uploadPromises = Object.entries(photos).map(async ([key, file]) => {
        const fieldId = fieldIds.photos[key];
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session);
        }
      });

      await Promise.all(uploadPromises);

      // Atualizar campo de ação necessária
      const actionQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                {
                  fieldId: "${fieldIds.action}"
                  value: "Desbloquear Veículo"
                }
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      const supabaseUrl = (supabase as any).supabaseUrl;
      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: actionQuery })
      });

      // Adicionar comentário se houver observações
      if (observations) {
        const commentQuery = `
          mutation {
            createComment(
              input: {
                card_id: "${cardId}"
                text: "Usuário ${userEmail} inseriu a observação ${observations} na solicitação de desbloqueio."
              }
            ) {
              comment {
                id
                text
                created_at
                author {
                  id
                  name
                }
              }
            }
          }
        `;

        await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query: commentQuery })
        });
      }

      logger.log('Veículo desbloqueado com sucesso no Pipefy');
      
    } catch (error) {
      logger.error('Erro ao desbloquear veículo:', error);
      throw error;
    }
  };

  const handleRequestTowing = async (cardId: string, phase: string, reason: string, photos: Record<string, File>) => {
    logger.log('Solicitando guincho:', { cardId, phase, reason, photos });
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      const fieldIds = getPhaseFieldIds(phase);

      // Upload das imagens (excluir estepe e painel se for "sem recuperação da chave")
      const photosToUpload = reason === 'Veículo na rua sem recuperação da chave' 
        ? Object.fromEntries(Object.entries(photos).filter(([key]) => !['estepe', 'painel'].includes(key)))
        : photos;

      const uploadPromises = Object.entries(photosToUpload).map(async ([key, file]) => {
        const fieldId = fieldIds.photos[key];
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session);
        }
      });

      await Promise.all(uploadPromises);

      // Atualizar campos
      const updateQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                {
                  fieldId: "${fieldIds.reason}"
                  value: "${reason}"
                },
                {
                  fieldId: "${fieldIds.action}"
                  value: "Solicitar Guincho"
                }
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      const supabaseUrl = (supabase as any).supabaseUrl;
      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery })
      });

      logger.log('Guincho solicitado com sucesso no Pipefy');
      
    } catch (error) {
      logger.error('Erro ao solicitar guincho:', error);
      throw error;
    }
  };

  const handleReportProblem = async (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => {
    logger.log('Reportando problema:', { cardId, phase, difficulty, evidences });
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      const fieldIds = getPhaseFieldIds(phase);

      // Upload das evidências
      const uploadPromises = Object.entries(evidences).map(async ([key, file]) => {
        const fieldId = fieldIds.evidences[key];
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session);
        }
      });

      await Promise.all(uploadPromises);

      // Atualizar campos
      const updateQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                {
                  fieldId: "${fieldIds.difficulty}"
                  value: "${difficulty}"
                },
                {
                  fieldId: "${fieldIds.action}"
                  value: "Reportar Problema"
                }
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      const supabaseUrl = (supabase as any).supabaseUrl;
      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery })
      });

      logger.log('Problema reportado com sucesso no Pipefy');
      
    } catch (error) {
      logger.error('Erro ao reportar problema:', error);
      throw error;
    }
  };

  // Funções para fase "Confirmação de Entrega no Pátio"
  const handleConfirmPatioDelivery = async (
    cardId: string,
    photos: Record<string, File>,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    logger.log('Confirmando entrega no pátio:', { cardId, photos, expenses, expenseValues, expenseReceipts });
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // Upload das fotos do veículo no pátio
      const photoFieldMapping: Record<string, string> = {
        frente: 'anexe_imagem_do_carro_no_p_tio',
        traseira: 'foto_da_traseira_do_ve_culo',
        lateralDireita: 'foto_da_lateral_direita_passageiro_4',
        lateralEsquerda: 'foto_da_lateral_esquerda_motorista',
        estepe: 'foto_do_estepe_4',
        painel: 'foto_do_painel_4'
      };

      const uploadPromises = Object.entries(photos).map(async ([key, file]) => {
        const fieldId = photoFieldMapping[key];
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session);
        }
      });

      await Promise.all(uploadPromises);

      // Upload dos comprovantes de despesas
      const expenseFieldMapping: Record<string, string> = {
        gasolina: 'comprovante_ou_nota_do_abastecimento',
        pedagio: 'comprovante_do_ped_gio',
        estacionamento: 'comprovante_do_estacionamento',
        motoboy: 'comprovante_de_pagamento_ou_nota_do_motoboy'
      };

      const receiptPromises = Object.entries(expenseReceipts).map(async ([key, file]) => {
        const fieldId = expenseFieldMapping[key];
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session);
        }
      });

      await Promise.all(receiptPromises);

      // Preparar valores das despesas
      const expenseValueFields: Record<string, string> = {
        gasolina: 'valor_do_abastecimento',
        pedagio: 'valor_do_s_ped_gio_s',
        estacionamento: 'valor_do_estacionamento',
        motoboy: 'valor_do_motoboy'
      };

      // Montar lista de campos para atualizar
      const fieldsToUpdate = [
        {
          fieldId: 'selecione_uma_op_o',
          value: 'Carro entregue no pátio'
        },
        {
          fieldId: 'houveram_despesas_extras_no_processo_de_recolha',
          value: expenses
        }
      ];

      // Adicionar valores de despesas
      Object.entries(expenseValues).forEach(([key, value]) => {
        const fieldId = expenseValueFields[key];
        if (fieldId && value) {
          fieldsToUpdate.push({
            fieldId: fieldId,
            value: value
          });
        }
      });

      // Atualizar campos no Pipefy
      const updateQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                ${fieldsToUpdate.map(field => `{
                  fieldId: "${field.fieldId}"
                  value: ${Array.isArray(field.value) ? JSON.stringify(field.value) : `"${field.value}"`}
                }`).join(',')}
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      const supabaseUrl = (supabase as any).supabaseUrl;
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Erro na requisição ao Pipefy (desktop):', errorText);
        throw new Error('Erro na requisição ao Pipefy');
      }

      const result = await response.json();
      if (result.errors) {
        logger.error('Erro do Pipefy (desktop):', result.errors);
        throw new Error(`Erro do Pipefy: ${result.errors?.[0]?.message || 'Erro desconhecido'}`);
      }

      logger.log('Entrega no pátio confirmada com sucesso no Pipefy');
      
    } catch (error) {
      logger.error('Erro ao confirmar entrega no pátio:', error);
      throw error;
    }
  };

  const handleConfirmCarTowed = async (
    cardId: string,
    photo: File,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    logger.log('Confirmando carro guinchado:', { cardId, photo, expenses, expenseValues, expenseReceipts });
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // Upload da foto do veículo no guincho
      await uploadImageToPipefy(photo, 'anexe_imagem_do_carro_no_guincho', cardId, session);

      // Upload dos comprovantes de despesas (mesmo mapeamento da entrega no pátio)
      const expenseFieldMapping: Record<string, string> = {
        gasolina: 'comprovante_ou_nota_do_abastecimento',
        pedagio: 'comprovante_do_ped_gio',
        estacionamento: 'comprovante_do_estacionamento',
        motoboy: 'comprovante_de_pagamento_ou_nota_do_motoboy'
      };

      const receiptPromises = Object.entries(expenseReceipts).map(async ([key, file]) => {
        const fieldId = expenseFieldMapping[key];
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session);
        }
      });

      await Promise.all(receiptPromises);

      // Preparar valores das despesas
      const expenseValueFields: Record<string, string> = {
        gasolina: 'valor_do_abastecimento',
        pedagio: 'valor_do_s_ped_gio_s',
        estacionamento: 'valor_do_estacionamento',
        motoboy: 'valor_do_motoboy'
      };

      // Montar lista de campos para atualizar
      const fieldsToUpdate = [
        {
          fieldId: 'selecione_uma_op_o',
          value: 'Carro guinchado'
        },
        {
          fieldId: 'houveram_despesas_extras_no_processo_de_recolha',
          value: expenses
        }
      ];

      // Adicionar valores de despesas
      Object.entries(expenseValues).forEach(([key, value]) => {
        const fieldId = expenseValueFields[key];
        if (fieldId && value) {
          fieldsToUpdate.push({
            fieldId: fieldId,
            value: value
          });
        }
      });

      // Atualizar campos no Pipefy
      const updateQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                ${fieldsToUpdate.map(field => `{
                  fieldId: "${field.fieldId}"
                  value: ${Array.isArray(field.value) ? JSON.stringify(field.value) : `"${field.value}"`}
                }`).join(',')}
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      const supabaseUrl = (supabase as any).supabaseUrl;
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Erro na requisição ao Pipefy (desktop):', errorText);
        throw new Error('Erro na requisição ao Pipefy');
      }

      const result = await response.json();
      if (result.errors) {
        logger.error('Erro do Pipefy (desktop):', result.errors);
        throw new Error(`Erro do Pipefy: ${result.errors?.[0]?.message || 'Erro desconhecido'}`);
      }

      logger.log('Carro guinchado confirmado com sucesso no Pipefy');
      
    } catch (error) {
      logger.error('Erro ao confirmar carro guinchado:', error);
      throw error;
    }
  };

  const handleRequestTowMechanical = async (cardId: string, reason: string) => {
    logger.log('Solicitando guincho mecânico:', { cardId, reason });
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Usuário não autenticado');
      }

      // Obter email do usuário logado
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || 'usuário';

      // Atualizar campo selecione_uma_op_o
      const updateQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                {
                  fieldId: "selecione_uma_op_o"
                  value: "Solicitar um novo guincho (carro não desbloqueou ou apresentou problemas mecânicos após a solicitação de desbloqueio)"
                }
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `;

      // Criar comentário
      const commentQuery = `
        mutation {
          createComment(
            input: {
              card_id: "${cardId}"
              text: "O ${userEmail} inseriu a seguinte observação no pedido do guincho: ${reason}"
            }
          ) {
            comment {
              id
              text
              created_at
              author {
                id
                name
              }
            }
          }
        }
      `;

      const supabaseUrl = (supabase as any).supabaseUrl;
      
      // Executar ambas as mutations
      await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query: updateQuery })
        }),
        fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query: commentQuery })
        })
      ]);

      logger.log('Guincho mecânico solicitado com sucesso no Pipefy');
      
    } catch (error) {
      logger.error('Erro ao solicitar guincho mecânico:', error);
      throw error;
    }
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
            <div id="kanban-view" className="flex-1 overflow-hidden bg-gradient-to-br from-white via-gray-50/20 to-blue-50/10 relative">
              {/* Background decorativo premium */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,53,90,0.02)_0%,transparent_60%),radial-gradient(circle_at_75%_75%,rgba(59,130,246,0.02)_0%,transparent_60%)] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200/30 to-transparent"></div>
              <div className="h-full overflow-x-scroll overflow-y-hidden p-6 kanban-scroll">
                <div id="kanban-container" className="flex gap-5 relative z-10" style={{ width: 'max-content' }}>
                {fixedPhaseOrder.map((phaseName, index) => {
                  const cardsInPhase = phases[phaseName] || [];
                  if (hideEmptyPhases && cardsInPhase.length === 0) return null;
                   
                  const displayPhaseName = phaseDisplayNames[phaseName] || phaseName;
                  const isDisabledPhase = disabledPhases.includes(phaseName);
                  const lateOrAlertCount = cardsInPhase.filter(c => c.sla >= 2).length;
                   
                   // Ícones personalizados para fases específicas
                   const getPhaseIcon = (phaseName: string) => {
                     switch (phaseName) {
                       case 'Aprovar Custo de Recolha':
                         return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
                       case 'Desbloquear Veículo':
                         return 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z';
                       case 'Solicitar Guincho':
                         return 'M8 5v14l11-7L8 5z';
                       default:
                         return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
                     }
                   };
                   
                   const colorScheme = isDisabledPhase 
                     ? { 
                         bg: 'bg-gradient-to-b from-gray-50/70 to-gray-100/50', 
                         border: 'border-gray-200/60', 
                         header: 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600', 
                         text: 'text-gray-500',
                         icon: getPhaseIcon(phaseName)
                       }
                     : {
                         bg: 'bg-white/95 backdrop-blur-sm', 
                         border: 'border-gray-200/60',
                         header: 'bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846]',
                         text: 'text-gray-700',
                         icon: getPhaseIcon(phaseName)
                       };
                    
                   return (
                     <div key={phaseName} className={`w-56 ${colorScheme.bg} rounded-2xl flex flex-col flex-shrink-0 shadow-md border ${colorScheme.border} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-sm relative overflow-hidden group`}>
                       {/* Borda animada premium no hover */}
                       <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                       <div className={`${colorScheme.header} text-white p-2 rounded-t-2xl relative overflow-hidden`}>
                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         {/* Partículas decorativas premium */}
                         <div className="absolute top-2 right-3 w-1 h-1 bg-white/30 rounded-full opacity-60"></div>
                         <div className="absolute top-2.5 right-5 w-0.5 h-0.5 bg-white/20 rounded-full opacity-40"></div>
                         <div className="relative z-10">
                           {/* Header principal premium */}
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                               <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 bg-white/20 rounded-lg backdrop-blur-sm">
                                 <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                   <path strokeLinecap="round" strokeLinejoin="round" d={colorScheme.icon} />
                                 </svg>
                               </div>
                               <h2 className="phase-title text-[10px] font-bold tracking-wide truncate leading-tight" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>
                             {displayPhaseName}
                           </h2>
                             </div>
                             
                             {/* Indicadores premium lado a lado */}
                             <div className="flex items-center gap-2 flex-shrink-0">
                               {/* Indicador de alertas premium */}
                              {!isDisabledPhase && lateOrAlertCount > 0 && (
                                 <div className="relative">
                                   <div className="flex items-center gap-1 text-amber-100 font-bold text-xs bg-amber-900/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-amber-700/50">
                                     <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                     <span className="text-[9px] font-bold">{lateOrAlertCount}</span>
                                   </div>
                                   {/* Pulse animation premium */}
                                   <div className="absolute inset-0 bg-amber-400/30 rounded-full animate-ping"></div>
                                 </div>
                               )}
                               
                               {/* Contador total premium */}
                               <div className="flex items-center gap-1 bg-white/30 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm border border-white/20">
                                 <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                                 <span className="text-[9px] font-bold text-white">{cardsInPhase.length}</span>
                               </div>
                             </div>
                            </div>
                         </div>
                       </div>
                       <div 
                         className={`flex-1 p-4 space-y-3 overflow-y-auto scroll-container phase-container ${isDisabledPhase ? 'opacity-60' : ''}`} 
                         data-phase={phaseName} 
                         style={{ maxHeight: 'calc(100vh - 280px)' }}
                         onScroll={(e) => handleScroll(phaseName, e)}
                       >
                         {cardsInPhase.length > 0 ? (
                           <>
                             {getVisibleCardsForPhase(phaseName).map(card => (
                               <div 
                                 key={card.id} 
                                 onClick={isDisabledPhase ? undefined : () => setSelectedCard(card)} 
                                 className={`transition-all duration-75 ${isDisabledPhase ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-[1.01]'}`}
                               >
                                 <CardComponent card={card} />
                               </div>
                             ))}
                             {(visibleCards[phaseName] || 10) < cardsInPhase.length && (
                               <div className="flex justify-center py-2">
                                 <div className="text-xs text-gray-500 bg-gray-100/80 px-3 py-1 rounded-full">
                                   +{cardsInPhase.length - (visibleCards[phaseName] || 10)} mais
                                 </div>
                               </div>
                             )}
                           </>
                         ) : (
                           <div className="flex flex-col items-center justify-center h-36 text-center p-4">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDisabledPhase ? 'bg-gray-200/60' : 'bg-gray-100/80'} backdrop-blur-sm shadow-sm`}>
                               <svg className={`w-7 h-7 ${isDisabledPhase ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                 <path strokeLinecap="round" strokeLinejoin="round" d={colorScheme.icon} />
                                </svg>
                              </div>
                             
                             {/* Mensagens personalizadas por fase */}
                             {(() => {
                               if (isDisabledPhase) {
                                 switch (phaseName) {
                                   case 'Aprovar Custo de Recolha':
                                     return (
                                       <p className="text-sm font-semibold text-gray-500">
                                         Nenhum custo pendente
                                       </p>
                                     );
                                   case 'Desbloquear Veículo':
                                     return (
                                       <p className="text-sm font-semibold text-gray-500">
                                         Nenhum desbloqueio pendente
                                       </p>
                                     );
                                   case 'Solicitar Guincho':
                                     return (
                                       <p className="text-sm font-semibold text-gray-500">
                                         Nenhum guincho pendente
                                       </p>
                                     );
                                   default:
                                     return (
                                       <>
                                         <p className="text-sm font-semibold text-gray-500">
                                           Em processamento
                                         </p>
                                         <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                           <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                           <span>Aguardando...</span>
                                         </div>
                                       </>
                                     );
                                 }
                               } else {
                                 return (
                                   <p className="text-sm font-semibold text-gray-600">
                                     Nenhuma recolha
                                   </p>
                                 );
                               }
                             })()}
                            </div>
                         )}
                       </div>
                     </div>
                   );
                })}
                </div>
              </div>
            </div>
          ) : (
            <div id="list-view" className="h-full w-full bg-gradient-to-br from-white via-gray-50/20 to-blue-50/10 pt-3 px-6 pb-6 relative">
              {/* Background decorativo premium similar ao Kanban */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,53,90,0.02)_0%,transparent_60%),radial-gradient(circle_at_75%_75%,rgba(59,130,246,0.02)_0%,transparent_60%)] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200/30 to-transparent"></div>
              
              <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60 h-full overflow-hidden relative z-10">
                {/* Header premium com estilo Kanban */}
                <div className="bg-gradient-to-br from-[#FF355A] via-[#E02E4D] to-[#D12846] text-white px-0 py-4 rounded-t-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  {/* Partículas decorativas premium */}
                  <div className="absolute top-3 right-8 w-1 h-1 bg-white/30 rounded-full opacity-60"></div>
                  <div className="absolute top-4 right-12 w-0.5 h-0.5 bg-white/20 rounded-full opacity-40"></div>
                  
                  <div className="flex items-center justify-between relative z-10 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/30 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-base font-bold tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700' }}>Lista de Recolhas</h2>
                        <p className="text-white/90 text-sm font-medium">Visualização detalhada</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-white/30 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm border border-white/20">
                        <div className="w-2 h-2 bg-white rounded-full opacity-90"></div>
                        <span className="text-sm font-bold text-white">{filteredCards.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Container da tabela premium com scroll moderno */}
                <div className="overflow-y-auto scroll-container" style={{ height: 'calc(100% - 5rem)' }}>
                  <table className="w-full text-sm bg-white">
                    <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50/95 to-white/90 backdrop-blur-md border-b border-gray-200/60">
                      <tr className="text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center bg-red-100/80 rounded-lg">
                              <svg className="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <span>Placa</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center bg-emerald-100/80 rounded-lg">
                              <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span>Driver</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center bg-orange-100/80 rounded-lg">
                              <svg className="w-2.5 h-2.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span>Chofer</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center bg-blue-100/80 rounded-lg">
                              <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <span>Fase</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center bg-purple-100/80 rounded-lg">
                              <svg className="w-2.5 h-2.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span>Data</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center bg-yellow-100/80 rounded-lg">
                              <svg className="w-2.5 h-2.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span>SLA</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredCards.map((card, index) => {
                        const isDisabled = disabledPhases.includes(card.faseAtual);
                        const slaStatus = card.sla >= 3 ? 'atrasado' : card.sla === 2 ? 'alerta' : 'no-prazo';
                        const displayPhase = phaseDisplayNames[card.faseAtual] || card.faseAtual;
                        const formattedDate = formatDate(card.dataCriacao);
                        
                        if (isDisabled) {
                          return (
                            <tr key={card.id} className="border-b border-gray-100/50 bg-gray-50/40 opacity-70 cursor-not-allowed">
                              <td className="px-6 py-3 font-semibold text-gray-500">{card.placa}</td>
                              <td className="px-6 py-3 text-gray-500">{formatPersonName(card.nomeDriver)}</td>
                              <td className="px-6 py-3 text-gray-500">
                                {!card.chofer || card.chofer === 'N/A' ? (
                                  <span className="italic text-sm text-gray-500">Não alocado</span>
                                ) : (
                                  formatPersonName(card.chofer)
                                )}
                              </td>
                              <td className="px-6 py-3 text-gray-500">{displayPhase}</td>
                              <td className="px-6 py-3 text-gray-500">{formattedDate}</td>
                              <td className="px-6 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-gray-500 font-medium">Processando</span>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        
                        return (
                          <tr 
                            key={card.id} 
                            className={`border-b border-gray-100/40 hover:bg-gray-50/60 hover:shadow-sm cursor-pointer transition-all duration-300 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'
                            }`}
                            onClick={() => setSelectedCard(card)}
                          >
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-red-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </div>
                                <span className="font-bold text-gray-900 text-sm truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {card.placa}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-emerald-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="text-gray-900 text-sm font-semibold truncate">
                                {formatPersonName(card.nomeDriver)}
                              </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-orange-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              {!card.chofer || card.chofer === 'N/A' ? (
                                  <span className="italic text-sm text-gray-500 font-medium">Não alocado</span>
                              ) : (
                                  <span className="text-gray-900 text-sm font-semibold truncate">
                                  {formatPersonName(card.chofer)}
                                </span>
                              )}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100/80 text-red-700 border border-red-200/50">
                                {displayPhase}
                              </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-purple-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <span className="text-gray-900 text-sm font-semibold">
                                {formattedDate}
                              </span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-6 h-6 bg-yellow-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="relative">
                                  <span className={`inline-flex items-center justify-center w-8 h-6 rounded-xl text-sm font-bold text-white shadow-sm ${
                                  slaStatus === 'atrasado' 
                                      ? 'bg-red-500' 
                                    : slaStatus === 'alerta' 
                                      ? 'bg-yellow-500' 
                                      : 'bg-emerald-500'
                                }`}>
                                  {card.sla}
                                </span>

                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Estado vazio premium com estilo Kanban */}
                  {filteredCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-red-100/90 to-red-200/70 rounded-3xl flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
                        <svg className="w-10 h-10 text-red-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Nenhuma recolha encontrada</h3>
                      <p className="text-base text-gray-600 font-medium mb-4">Tente ajustar os filtros ou a busca</p>
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50/80 px-4 py-2 rounded-full border border-red-200/50">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Sistema atualizado em tempo real</span>
                      </div>
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
        permissionType={permissionType}
        onUpdateChofer={handleUpdateChofer}
        onAllocateDriver={handleAllocateDriver}
        onRejectCollection={handleRejectCollection}
        onUnlockVehicle={handleUnlockVehicle}
        onRequestTowing={handleRequestTowing}
        onReportProblem={handleReportProblem}
        onConfirmPatioDelivery={handleConfirmPatioDelivery}
        onConfirmCarTowed={handleConfirmCarTowed}
        onRequestTowMechanical={handleRequestTowMechanical}
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

