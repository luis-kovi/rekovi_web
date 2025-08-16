// components/MobileTaskManager.tsx
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Card } from '@/types'
import MobileTaskCard from './MobileTaskCard'
import MobileTaskModal from './MobileTaskModal'
import MobileFilterPanel from './MobileFilterPanel'

interface MobileTaskManagerProps {
  initialCards: Card[]
  permissionType: string
  onUpdateStatus?: (isUpdating: boolean) => void
}

export default function MobileTaskManager({ initialCards, permissionType, onUpdateStatus }: MobileTaskManagerProps) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullToRefreshY, setPullToRefreshY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const scrollPositionRef = useRef<number>(0)

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
        `).order('card_id', { ascending: true }).limit(100000);

        // Filtrar apenas cards com fases válidas
        const validPhases = [
          'Fila de Recolha',
          'Aprovar Custo de Recolha', 
          'Tentativa 1 de Recolha',
          'Tentativa 2 de Recolha',
          'Tentativa 3 de Recolha',
          'Desbloquear Veículo',
          'Solicitar Guincho',
          'Tentativa 4 de Recolha',
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
            id: card.card_id || '',
            placa: card.placa_veiculo || '',
            nomeDriver: card.nome_driver || '',
            chofer: card.nome_chofer_recolha || '',
            faseAtual: card.phase_name || '',
            dataCriacao: card.created_at || '',
            emailChofer: card.email_chofer || '',
            empresaResponsavel: card.empresa_recolha || '',
            modeloVeiculo: card.modelo_veiculo || '',
            telefoneContato: card.telefone_contato || '',
            telefoneOpcional: card.telefone_opcional || '',
            emailCliente: card.email_cliente || '',
            enderecoCadastro: card.endereco_cadastro || '',
            enderecoRecolha: card.endereco_recolha || '',
            linkMapa: card.link_mapa || '',
            origemLocacao: card.origem_locacao || '',
            valorRecolha: card.valor_recolha || '',
            custoKmAdicional: card.custo_km_adicional || '',
            urlPublica: card.public_url || '',
          })).filter((card: Card) => card.id && card.placa);

          // Salvar posição de scroll antes da atualização
          if (containerRef.current) {
            scrollPositionRef.current = containerRef.current.scrollTop;
          }

          setCards(updatedCards);
          console.log('Dados atualizados via real-time (mobile):', updatedCards.length, 'cards');

          // Restaurar posição de scroll após a atualização
          setTimeout(() => {
            if (containerRef.current && scrollPositionRef.current !== undefined) {
              containerRef.current.scrollTop = scrollPositionRef.current;
            }
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
      .channel('cards-updates-mobile')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'v_pipefy_cards_detalhada'
        },
        (payload) => {
          console.log('Mudança detectada no Supabase (mobile):', payload);
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

  // Garantir que os cards sejam inicializados corretamente
  useEffect(() => {
    setCards(initialCards)
  }, [initialCards])

  // Fases disponíveis para filtro
  const phases = [
    'Fila de Recolha',
    'Aprovar Custo de Recolha', 
    'Tentativa 1 de Recolha',
    'Tentativa 2 de Recolha',
    'Tentativa 3 de Recolha',
    'Desbloquear Veículo',
    'Solicitar Guincho',
    'Tentativa 4 de Recolha',
    'Confirmação de Entrega no Pátio'
  ]

  // Função para obter cor da fase
  const getPhaseColor = (phase: string) => {
    const colors: { [key: string]: string } = {
      'Fila de Recolha': 'bg-blue-100 text-blue-800',
      'Aprovar Custo de Recolha': 'bg-yellow-100 text-yellow-800',
      'Tentativa 1 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 2 de Recolha': 'bg-orange-100 text-orange-800',
      'Tentativa 3 de Recolha': 'bg-red-100 text-red-800',
      'Desbloquear Veículo': 'bg-purple-100 text-purple-800',
      'Solicitar Guincho': 'bg-indigo-100 text-indigo-800',
      'Tentativa 4 de Recolha': 'bg-green-100 text-green-800',
      'Confirmação de Entrega no Pátio': 'bg-green-100 text-green-800'
    }
    return colors[phase] || 'bg-gray-100 text-gray-800'
  }

  // Filtrar e ordenar cards usando useMemo
  const filteredCards = useMemo(() => {
    let filtered = cards

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.nomeDriver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.faseAtual.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por fase
    if (selectedPhase !== 'all') {
      filtered = filtered.filter(card => card.faseAtual === selectedPhase)
    }

    // Ordenação: sempre ordem crescente de ID (menor ID primeiro)
    const sorted = [...filtered].sort((a, b) => {
      // Converter IDs para números para comparação numérica
      const idA = parseInt(a.id, 10)
      const idB = parseInt(b.id, 10)
      return idA - idB // Crescente: menor ID primeiro
    })

    return sorted
  }, [cards, searchTerm, selectedPhase])

  // Pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    
    const touchY = e.touches[0].clientY
    const deltaY = touchY - touchStartY.current
    
    if (deltaY > 0 && containerRef.current.scrollTop === 0) {
      e.preventDefault()
      setIsPulling(true)
      setPullToRefreshY(Math.min(deltaY * 0.5, 80))
    }
  }

  const handleTouchEnd = () => {
    if (isPulling && pullToRefreshY > 50) {
      // Trigger refresh real
      setIsRefreshing(true)
      
      // Buscar dados atualizados do Supabase
      const supabase = createClient();
      if (supabase) {
        const fetchUpdatedData = async () => {
          try {
            let query = supabase.from('v_pipefy_cards_detalhada').select(`
              card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
              phase_name, created_at, email_chofer, empresa_recolha,
              modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
              endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
              valor_recolha, custo_km_adicional, public_url
            `).order('card_id', { ascending: true }).limit(100000);

            const validPhases = [
              'Fila de Recolha',
              'Aprovar Custo de Recolha', 
              'Tentativa 1 de Recolha',
              'Tentativa 2 de Recolha',
              'Tentativa 3 de Recolha',
              'Desbloquear Veículo',
              'Solicitar Guincho',
              'Tentativa 4 de Recolha',
              'Confirmação de Entrega no Pátio'
            ];
            
            query = query.in('phase_name', validPhases);
            
            if (permissionType === 'ativa' || permissionType === 'onsystem') {
              query = query.ilike('empresa_recolha', permissionType);
            } else if (permissionType === 'chofer') {
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
                id: card.card_id || '',
                placa: card.placa_veiculo || '',
                nomeDriver: card.nome_driver || '',
                chofer: card.nome_chofer_recolha || '',
                faseAtual: card.phase_name || '',
                dataCriacao: card.created_at || '',
                emailChofer: card.email_chofer || '',
                empresaResponsavel: card.empresa_recolha || '',
                modeloVeiculo: card.modelo_veiculo || '',
                telefoneContato: card.telefone_contato || '',
                telefoneOpcional: card.telefone_opcional || '',
                emailCliente: card.email_cliente || '',
                enderecoCadastro: card.endereco_cadastro || '',
                enderecoRecolha: card.endereco_recolha || '',
                linkMapa: card.link_mapa || '',
                origemLocacao: card.origem_locacao || '',
                valorRecolha: card.valor_recolha || '',
                custoKmAdicional: card.custo_km_adicional || '',
                urlPublica: card.public_url || '',
              })).filter((card: Card) => card.id && card.placa);

              setCards(updatedCards);
              console.log('Dados atualizados via pull-to-refresh:', updatedCards.length, 'cards');
            }
          } catch (error) {
            console.error('Erro ao buscar dados atualizados:', error);
          }
        };

        fetchUpdatedData();
      }
      
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
    
    setIsPulling(false)
    setPullToRefreshY(0)
  }

  // Função para adaptar nomes das fases para melhor legibilidade
  const adaptPhaseName = (phase: string) => {
    const adaptations: { [key: string]: string } = {
      'Tentativa 1 de Recolha': 'Tentativa 1',
      'Tentativa 2 de Recolha': 'Tentativa 2',
      'Tentativa 3 de Recolha': 'Tentativa 3',
      'Tentativa 4 de Recolha': 'Tentativa 4',
      'Confirmação de Entrega no Pátio': 'Confirmação de Entrega'
    }
    return adaptations[phase] || phase
  }

  const [initialModalTab, setInitialModalTab] = useState<'details' | 'actions' | 'history'>('details')

  // Funções do Pipefy para mobile
  const handleAllocateDriver = async (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string) => {
    console.log('Alocando chofer (mobile):', { cardId, driverName, driverEmail, dateTime, collectionValue, additionalKm });
    
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

      console.log('Chofer alocado com sucesso no Pipefy (mobile)');
      
      // Atualizar o estado local do card
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId 
            ? { ...card, chofer: driverName, emailChofer: driverEmail }
            : card
        )
      );
      
    } catch (error) {
      console.error('Erro ao alocar chofer (mobile):', error);
      throw error;
    }
  };

  const handleRejectCollection = async (cardId: string, reason: string, observations: string) => {
    console.log('Rejeitando recolha (mobile):', { cardId, reason, observations });
    
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

      console.log('Recolha rejeitada com sucesso no Pipefy (mobile)');
      
    } catch (error) {
      console.error('Erro ao rejeitar recolha (mobile):', error);
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

      console.log('Enviando query para presigned URL (mobile):', presignedQuery);

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
        console.error('Erro na resposta presigned (mobile):', errorText);
        throw new Error(`Erro ao gerar URL de upload: ${presignedResponse.status} - ${errorText}`);
      }

      const presignedData = await presignedResponse.json();
      console.log('Resposta completa presigned URL (mobile):', presignedData);

      // Verificar se há erros na resposta
      if (presignedData.errors && presignedData.errors.length > 0) {
        console.error('Erros da API Pipefy (mobile):', presignedData.errors);
        const errorMessages = presignedData.errors.map((error: any) => error.message).join(', ');
        throw new Error(`Erro na API Pipefy: ${errorMessages}`);
      }

      // Verificar se a resposta tem a estrutura esperada
      if (!presignedData?.data?.createPresignedUrl) {
        console.error('Estrutura de resposta inválida (mobile):', presignedData);
        throw new Error('Resposta inválida da API de presigned URL');
      }

      const { url: uploadUrl, downloadUrl } = presignedData.data.createPresignedUrl;

      if (!uploadUrl || !downloadUrl) {
        throw new Error('URLs de upload/download não fornecidas');
      }

      console.log('URLs obtidas (mobile):', { uploadUrl, downloadUrl });

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
        console.error('Erro no upload (mobile):', errorText);
        throw new Error(`Erro ao fazer upload da imagem: ${uploadResponse.status}`);
      }

      console.log('Upload realizado com sucesso (mobile)');

      // Passo 3: Atualizar campo no card com o path do arquivo
      // Extrair o path do arquivo da downloadUrl
      const urlParts = downloadUrl.split('/uploads/');
      const filePath = urlParts[1] ? urlParts[1].split('?')[0] : '';
      const organizationId = "870bddf7-6ce7-4b9d-81d8-9087f1c10ae2"; // ID da organização
      const fullPath = `orgs/${organizationId}/uploads/${filePath}`;
      
      console.log('Path do arquivo (mobile):', fullPath);

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

      console.log('Atualizando campo com URL (mobile):', updateFieldQuery);

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
        console.error('Erro ao atualizar campo (mobile):', errorText);
        throw new Error(`Erro ao atualizar campo com imagem: ${updateResponse.status}`);
      }

      const updateData = await updateResponse.json();
      console.log('Resposta updateCardField completa (mobile):', updateData);

      // Verificar se há erros na atualização do campo
      if (updateData.errors && updateData.errors.length > 0) {
        console.error('Erros ao atualizar campo (mobile):', updateData.errors);
        const errorMessages = updateData.errors.map((error: any) => error.message).join(', ');
        throw new Error(`Erro ao atualizar campo ${fieldId}: ${errorMessages}`);
      }

      console.log('Campo atualizado com sucesso (mobile):', updateData);
      return downloadUrl;
    } catch (error) {
      console.error('Erro no upload da imagem (mobile):', error);
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
    console.log('Desbloqueando veículo (mobile):', { cardId, phase, photos, observations });
    
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

      console.log('Veículo desbloqueado com sucesso no Pipefy (mobile)');
      
    } catch (error) {
      console.error('Erro ao desbloquear veículo (mobile):', error);
      throw error;
    }
  };

  const handleRequestTowing = async (cardId: string, phase: string, reason: string, photos: Record<string, File>) => {
    console.log('Solicitando guincho (mobile):', { cardId, phase, reason, photos });
    
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

      console.log('Guincho solicitado com sucesso no Pipefy (mobile)');
      
    } catch (error) {
      console.error('Erro ao solicitar guincho (mobile):', error);
      throw error;
    }
  };

  const handleReportProblem = async (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => {
    console.log('Reportando problema (mobile):', { cardId, phase, difficulty, evidences });
    
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

      console.log('Problema reportado com sucesso no Pipefy (mobile)');
      
    } catch (error) {
      console.error('Erro ao reportar problema (mobile):', error);
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
    console.log('Confirmando entrega no pátio (mobile):', { cardId, photos, expenses, expenseValues, expenseReceipts });
    
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
          value: 'Confirmar entrega no pátio'
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

      const response = await fetch('https://api.pipefy.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIPEFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: updateQuery }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição ao Pipefy');
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(`Erro do Pipefy: ${result.errors[0].message}`);
      }

    } catch (error) {
      console.error('Erro ao confirmar entrega no pátio:', error);
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
    console.log('Confirmando carro guinchado (mobile):', { cardId, photo, expenses, expenseValues, expenseReceipts });
    
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

      const response = await fetch('https://api.pipefy.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIPEFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: updateQuery }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição ao Pipefy');
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(`Erro do Pipefy: ${result.errors[0].message}`);
      }

    } catch (error) {
      console.error('Erro ao confirmar carro guinchado:', error);
      throw error;
    }
  };

  const handleRequestTowMechanical = async (cardId: string, reason: string) => {
    console.log('Solicitando guincho mecânico (mobile):', { cardId, reason });
    
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

      const [updateResponse, commentResponse] = await Promise.all([
        fetch('https://api.pipefy.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIPEFY_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: updateQuery }),
        }),
        fetch('https://api.pipefy.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIPEFY_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: commentQuery }),
        })
      ]);

      if (!updateResponse.ok || !commentResponse.ok) {
        throw new Error('Erro na requisição ao Pipefy');
      }

      const [updateResult, commentResult] = await Promise.all([
        updateResponse.json(),
        commentResponse.json()
      ]);

      if (updateResult.errors || commentResult.errors) {
        throw new Error(`Erro do Pipefy: ${updateResult.errors?.[0]?.message || commentResult.errors?.[0]?.message}`);
      }

    } catch (error) {
      console.error('Erro ao solicitar guincho mecânico:', error);
      throw error;
    }
  };

  // Gestos de swipe
  const handleCardSwipe = (cardId: string, direction: 'left' | 'right') => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    setSelectedCard(card)
    
    // Definir a aba ativa baseada na direção do swipe
    if (direction === 'right') {
      // Swipe direito - abrir aba de detalhes
      setInitialModalTab('details')
    } else {
      // Swipe esquerdo - abrir aba de ações
      setInitialModalTab('actions')
    }
    
    setIsModalOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barra de Pesquisa */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por placa, motorista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:border-transparent"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Controles de Filtro */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{filteredCards.length}</span>
            <span>tarefas</span>
          </div>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      {isPulling && (
        <div 
          className="flex items-center justify-center py-4 bg-blue-50 text-blue-600 text-sm"
          style={{ transform: `translateY(${pullToRefreshY}px)` }}
        >
          <svg className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'A atualizar...' : 'Puxe para atualizar'}
        </div>
      )}

      {/* Lista de Tarefas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto mobile-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 py-2 space-y-3">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
              <p className="text-sm">Tente ajustar os filtros de pesquisa</p>
            </div>
          ) : (
            filteredCards.map((card) => (
              <MobileTaskCard
                key={card.id}
                card={card}
                phaseColor={getPhaseColor(card.faseAtual)}
                adaptedPhaseName={adaptPhaseName(card.faseAtual)}
                onCardPress={() => {
                  setSelectedCard(card)
                  setIsModalOpen(true)
                }}
                onSwipe={handleCardSwipe}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedCard && isModalOpen && (
        <MobileTaskModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCard(null)
          }}
          permissionType={permissionType}
          initialTab={initialModalTab}
          onAllocateDriver={handleAllocateDriver}
          onRejectCollection={handleRejectCollection}
          onUnlockVehicle={handleUnlockVehicle}
          onRequestTowing={handleRequestTowing}
          onReportProblem={handleReportProblem}
          onConfirmPatioDelivery={handleConfirmPatioDelivery}
          onConfirmCarTowed={handleConfirmCarTowed}
          onRequestTowMechanical={handleRequestTowMechanical}
        />
      )}

      {/* Painel de Filtros */}
      {isFilterOpen && (
        <MobileFilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onFilterChange={(phase) => setSelectedPhase(phase || 'all')}
          selectedPhase={selectedPhase === 'all' ? null : selectedPhase}
          cards={cards}
        />
      )}
    </div>
  )
} 