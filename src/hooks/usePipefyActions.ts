// src/hooks/usePipefyActions.ts
import { useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CardActions } from '@/types/card.types';
import { logger } from '@/utils/logger';

export interface UsePipefyActionsReturn extends CardActions {
  uploadImageToPipefy: (
    file: File, 
    fieldId: string, 
    cardId: string
  ) => Promise<string>;
}

export function usePipefyActions(): UsePipefyActionsReturn {
  const executeGraphQLMutation = useCallback(async (query: string, variables?: any) => {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado');
    }

    const supabaseUrl = (supabase as any).supabaseUrl;
    const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro na API: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Erro do Pipefy');
    }

    return result;
  }, []);

  const uploadImageToPipefy = useCallback(async (
    file: File, 
    fieldId: string, 
    cardId: string
  ): Promise<string> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    // Gerar URL pré-assinada
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

    const supabaseUrl = (supabase as any).supabaseUrl;
    const presignedResponse = await fetch(`${supabaseUrl}/functions/v1/upload-image-pipefy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ query: presignedQuery, variables })
    });

    if (!presignedResponse.ok) {
      throw new Error('Erro ao gerar URL de upload');
    }

    const presignedData = await presignedResponse.json();
    if (presignedData.errors?.length > 0) {
      throw new Error(`Erro na API Pipefy: ${presignedData.errors[0].message}`);
    }

    const { url: uploadUrl, downloadUrl } = presignedData.data.createPresignedUrl;

    // Upload da imagem
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    if (!uploadResponse.ok) {
      throw new Error('Erro ao fazer upload da imagem');
    }

    // Atualizar campo no card
    const urlParts = downloadUrl.split('/uploads/');
    const filePath = urlParts[1]?.split('?')[0] || '';
    const organizationId = "870bddf7-6ce7-4b9d-81d8-9087f1c10ae2";
    const fullPath = `orgs/${organizationId}/uploads/${filePath}`;

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

    await executeGraphQLMutation(updateFieldQuery);
    return downloadUrl;
  }, [executeGraphQLMutation]);

  const onUpdateChofer = useCallback(async (
    cardId: string, 
    newName: string, 
    newEmail: string
  ) => {
    logger.log('Atualizando chofer:', { cardId, newName, newEmail });

    const query = `
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

    await executeGraphQLMutation(query);
  }, [executeGraphQLMutation]);

  const onAllocateDriver = useCallback(async (
    cardId: string, 
    driverName: string, 
    driverEmail: string, 
    dateTime: string, 
    collectionValue: string, 
    additionalKm: string,
    billingType: string = 'Padrão'
  ) => {
    logger.log('Alocando chofer:', { cardId, driverName, driverEmail });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || 'Usuário desconhecido';

    const fieldsToUpdate = [
      { fieldId: "nome_do_chofer_que_far_a_recolha", value: driverName },
      { fieldId: "e_mail_do_chofer", value: driverEmail },
      { fieldId: "data_e_hora_prevista_para_recolha", value: dateTime },
      { fieldId: "custo_de_km_adicional", value: additionalKm },
      { fieldId: "ve_culo_ser_recolhido", value: "Sim" },
      { fieldId: "tipo_de_faturamento", value: billingType }
    ];

    if (collectionValue) {
      fieldsToUpdate.push({ fieldId: "valor_da_recolha", value: collectionValue });
    }

    const updateQuery = `
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

    const commentQuery = `
      mutation {
        createComment(
          input: {
            card_id: "${cardId}"
            text: "O ${userEmail} alocou o chofer para recolha."
          }
        ) {
          comment { id }
        }
      }
    `;

    await Promise.all([
      executeGraphQLMutation(updateQuery),
      executeGraphQLMutation(commentQuery)
    ]);
  }, [executeGraphQLMutation]);

  const onRejectCollection = useCallback(async (
    cardId: string, 
    reason: string, 
    observations: string
  ) => {
    logger.log('Rejeitando recolha:', { cardId, reason, observations });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || 'Usuário desconhecido';

    const updateQuery = `
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

    const commentQuery = `
      mutation {
        createComment(
          input: {
            card_id: "${cardId}"
            text: "O ${userEmail} rejeitou a recolha.\\nMotivo: ${reason}\\nComentário: ${observations}"
          }
        ) {
          comment { id }
        }
      }
    `;

    await Promise.all([
      executeGraphQLMutation(updateQuery),
      executeGraphQLMutation(commentQuery)
    ]);
  }, [executeGraphQLMutation]);

  // Implementar outros métodos conforme necessário...
  const onUnlockVehicle = useCallback(async (
    cardId: string, 
    phase: string, 
    photos: Record<string, File>, 
    observations?: string
  ) => {
    // Implementação do desbloqueio de veículo
    throw new Error('Método não implementado');
  }, []);

  const onRequestTowing = useCallback(async (
    cardId: string, 
    phase: string, 
    reason: string, 
    photos: Record<string, File>
  ) => {
    // Implementação da solicitação de guincho
    throw new Error('Método não implementado');
  }, []);

  const onReportProblem = useCallback(async (
    cardId: string, 
    phase: string, 
    difficulty: string, 
    evidences: Record<string, File>
  ) => {
    // Implementação do reporte de problema
    throw new Error('Método não implementado');
  }, []);

  const onConfirmPatioDelivery = useCallback(async (
    cardId: string,
    photos: Record<string, File>,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    // Implementação da confirmação de entrega no pátio
    throw new Error('Método não implementado');
  }, []);

  const onConfirmCarTowed = useCallback(async (
    cardId: string,
    photo: File,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    // Implementação da confirmação de carro guinchado
    throw new Error('Método não implementado');
  }, []);

  const onRequestTowMechanical = useCallback(async (
    cardId: string, 
    reason: string
  ) => {
    // Implementação da solicitação de guincho mecânico
    throw new Error('Método não implementado');
  }, []);

  return {
    onUpdateChofer,
    onAllocateDriver,
    onRejectCollection,
    onUnlockVehicle,
    onRequestTowing,
    onReportProblem,
    onConfirmPatioDelivery,
    onConfirmCarTowed,
    onRequestTowMechanical,
    uploadImageToPipefy
  };
}
