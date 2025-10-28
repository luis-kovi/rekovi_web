// components/MobileTaskModal.tsx
'use client'

import { useMemo, useState, useEffect } from 'react'
import type { Card } from '@/types'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/utils/logger'
import AllocateDriverForm from './MobileTaskModal/FilaRecolhaActions/AllocateDriverForm'
import RejectCollectionForm from './MobileTaskModal/FilaRecolhaActions/RejectCollectionForm'
import UnlockVehicleForm from './MobileTaskModal/TentativaRecolhaActions/UnlockVehicleForm'
import RequestTowingForm from './MobileTaskModal/TentativaRecolhaActions/RequestTowingForm'
import ReportProblemForm from './MobileTaskModal/TentativaRecolhaActions/ReportProblemForm'
import ConfirmPatioDeliveryForm from './MobileTaskModal/ConfirmacaoRecolhaActions/ConfirmPatioDeliveryForm'
import CarTowedForm from './MobileTaskModal/ConfirmacaoRecolhaActions/CarTowedForm'
import RequestTowMechanicalForm from './MobileTaskModal/ConfirmacaoRecolhaActions/RequestTowMechanicalForm'

const uploadImageToPipefy = async (file: File, fieldId: string, cardId: string, session: any) => {
  try {
    const supabaseUrl = (createClient() as any).supabaseUrl;
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
      organizationId: '281428',
      fileName,
      contentType: file.type
    };

    const presignedResponse = await fetch(`${supabaseUrl}/functions/v1/upload-image-pipefy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ query: presignedQuery, variables })
    });

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text();
      throw new Error(`Erro ao gerar URL de upload: ${presignedResponse.status} - ${errorText}`);
    }

    const presignedData = await presignedResponse.json();

    if (presignedData.errors?.length) {
      const messages = presignedData.errors.map((error: any) => error.message).join(', ');
      throw new Error(`Erro na API Pipefy: ${messages}`);
    }

    const { url: uploadUrl, downloadUrl } = presignedData.data?.createPresignedUrl ?? {};

    if (!uploadUrl || !downloadUrl) {
      throw new Error('URLs de upload/download não fornecidas');
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Erro ao fazer upload da imagem: ${uploadResponse.status} - ${errorText}`);
    }

    const urlParts = downloadUrl.split('/uploads/');
    const filePath = urlParts[1] ? urlParts[1].split('?')[0] : '';
    const organizationId = '870bddf7-6ce7-4b9d-81d8-9087f1c10ae2';
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

    const updateResponse = await fetch(`${supabaseUrl}/functions/v1/upload-image-pipefy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ query: updateFieldQuery })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Erro ao atualizar campo com imagem: ${updateResponse.status} - ${errorText}`);
    }

    const updateData = await updateResponse.json();

    if (updateData.errors?.length) {
      const messages = updateData.errors.map((error: any) => error.message).join(', ');
      throw new Error(`Erro ao atualizar campo ${fieldId}: ${messages}`);
    }

    return downloadUrl;
  } catch (error) {
    logger.error('Erro no upload da imagem via Pipefy:', error);
    throw error;
  }
};

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
      action: 'qual_a_a_o_necess_ria_para_seguirmos_com_a_recolha',
      reason: 'qual_o_motivo_do_guincho',
      difficulty: 'qual_a_maior_dificuldade',
      photos: {
        frente: 'foto_do_ve_culo_e_ou_local_da_recolha',
        traseira: 'foto_da_lateral_traseira_esquerda_do_ve_culo',
        lateralEsquerda: 'foto_da_lateral_traseira_direita_do_ve_culo',
        lateralDireita: 'foto_da_lateral_direita_do_ve_culo',
        estepe: 'foto_do_estepe',
        painel: 'foto_da_parte_interna_do_ve_culo_'
      },
      evidences: {
        photo1: 'anexe_foto_do_cen_rio_atual_para_que_possamos_entender_melhor_a_situa_o',
        photo2: 'caso_tenha_algum_documento_que_possa_nos_ajudar_anexe_neste_campo',
        photo3: 'alguma_evid_ncia_extra_fotos_documentos'
      }
    },
    'Tentativa 3 de Recolha': {
      action: 'qual_a_a_o_necess_ria_para_seguirmos_com_a_recolha',
      reason: 'qual_o_motivo_do_guincho',
      difficulty: 'qual_o_maior_motivo_para_n_o_conseguir_a_recolha',
      photos: {
        frente: 'foto_do_ve_culo_e_do_local_da_recolha',
        traseira: 'foto_da_lateral_direita_do_ve_culo',
        lateralEsquerda: 'foto_da_lateral_esquerda_do_ve_culo',
        lateralDireita: 'foto_da_lateral_traseira_direita_do_ve_culo',
        estepe: 'foto_da_lateral_traseira_esquerda_do_ve_culo',
        painel: 'foto_da_chave_do_ve_culo'
      },
      evidences: {
        photo1: 'anexe_foto_do_cen_rio_atual_para_que_possamos_entender_melhor_a_situa_o',
        photo2: 'anexe_outra_evid_ncia_caso_tenha',
        photo3: 'caso_tenha_algum_documento_que_possa_nos_ajudar_anexe_neste_campo'
      }
    },
    'Tentativa 4 de Recolha': {
      action: 'qual_a_a_o_necess_ria_para_seguirmos_com_a_recolha',
      reason: 'qual_o_motivo_do_guincho',
      difficulty: 'qual_o_maior_motivo_para_n_o_conseguir_a_recolha',
      photos: {
        frente: 'foto_do_ve_culo_e_do_local_da_recolha',
        traseira: 'foto_da_lateral_direita_do_ve_culo',
        lateralEsquerda: 'foto_da_lateral_esquerda_do_ve_culo',
        lateralDireita: 'foto_da_lateral_traseira_direita_do_ve_culo',
        estepe: 'foto_da_lateral_traseira_esquerda_do_ve_culo',
        painel: 'foto_da_chave_do_ve_culo'
      },
      evidences: {
        photo1: 'anexe_foto_do_cen_rio_atual_para_que_possamos_entender_melhor_a_situa_o',
        photo2: 'anexe_outra_evid_ncia_caso_tenha',
        photo3: 'caso_tenha_algum_documento_que_possa_nos_ajudar_anexe_neste_campo'
      }
    }
  };

  return phaseFieldMap[phase] || phaseFieldMap['Tentativa 1 de Recolha'];
};

const executePipefyMutation = async (session: any, query: string, variables?: Record<string, any>) => {
  const supabaseUrl = (createClient() as any).supabaseUrl;
  const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(variables ? { query, variables } : { query })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error || `Erro na API: ${response.status}`;
    throw new Error(message);
  }

  const result = await response.json();

  if (result.error || result.errors?.length) {
    const errorMessage =
      result.error ||
      result.errors.map((error: any) => error.message).join(', ');
    throw new Error(errorMessage);
  }

  return result;
};

interface MobileTaskModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  permissionType: string
  initialTab?: 'details' | 'actions' | 'history'
}

export default function MobileTaskModal({ card, isOpen, onClose, permissionType, initialTab = 'details' }: MobileTaskModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'history'>(initialTab)
  
  const [showAllocateDriver, setShowAllocateDriver] = useState(false);
  const [showRejectCollection, setShowRejectCollection] = useState(false);
  const [showUnlockVehicle, setShowUnlockVehicle] = useState(false);
  const [showRequestTowing, setShowRequestTowing] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  const [showConfirmPatioDelivery, setShowConfirmPatioDelivery] = useState(false);
  const [showCarTowed, setShowCarTowed] = useState(false);
  const [showRequestTowMechanical, setShowRequestTowMechanical] = useState(false);

  const getSessionOrThrow = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('Usuário não autenticado');
    }
    return session;
  };

  const getCurrentUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || 'Usuário desconhecido';
  };

  const handleAllocateDriver = async (
    cardId: string,
    driverName: string,
    driverEmail: string,
    dateTime: string,
    collectionValue: string,
    additionalKm: string,
    billingType: string
  ) => {
    logger.log('Alocando chofer (mobile):', { cardId, driverName, driverEmail, dateTime, collectionValue, additionalKm, billingType });

    const session = await getSessionOrThrow();
    const userEmail = await getCurrentUserEmail();

    const fieldsToUpdate = [
      {
        fieldId: 'nome_do_chofer_que_far_a_recolha',
        value: driverName
      },
      {
        fieldId: 'e_mail_do_chofer',
        value: driverEmail
      },
      {
        fieldId: 'data_e_hora_prevista_para_recolha',
        value: dateTime
      },
      {
        fieldId: 'custo_de_km_adicional',
        value: additionalKm
      },
      {
        fieldId: 've_culo_ser_recolhido',
        value: 'Sim'
      },
      {
        fieldId: 'tipo_de_faturamento',
        value: billingType
      }
    ];

    if (billingType === 'avulso') {
      fieldsToUpdate.push({
        fieldId: 'valor_da_recolha',
        value: collectionValue
      });
    } else {
      fieldsToUpdate.push({
        fieldId: 'valor_da_recolha',
        value: ''
      });
    }

    const mutationQuery = `
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
            text: "O ${userEmail} alocou o chofer ${driverName} para a recolha."
          }
        ) {
          comment {
            id
          }
        }
      }
    `;

    await Promise.all([
      executePipefyMutation(session, mutationQuery),
      executePipefyMutation(session, commentQuery)
    ]);
  };

  const handleRejectCollection = async (cardId: string, reason: string, observations: string) => {
    logger.log('Rejeitando recolha (mobile):', { cardId, reason, observations });

    const session = await getSessionOrThrow();
    const userEmail = await getCurrentUserEmail();

    const updateQuery = `
      mutation {
        updateFieldsValues(
          input: {
            nodeId: "${cardId}"
            values: [
              {
                fieldId: "ve_culo_ser_recolhido"
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
          comment {
            id
          }
        }
      }
    `;

    await Promise.all([
      executePipefyMutation(session, updateQuery),
      executePipefyMutation(session, commentQuery)
    ]);
  };

  const handleUnlockVehicle = async (
    cardId: string,
    phase: string,
    photos: Record<string, File>,
    observations?: string
  ) => {
    logger.log('Desbloqueando veículo (mobile):', { cardId, phase, photos, observations });

    const session = await getSessionOrThrow();
    const userEmail = await getCurrentUserEmail();
    const fieldIds = getPhaseFieldIds(phase);

    await Promise.all(
      Object.entries(photos).map(async ([key, file]) => {
        const fieldId = fieldIds.photos[key];
        if (fieldId) {
          await uploadImageToPipefy(file, fieldId, cardId, session);
        }
      })
    );

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
          success
        }
      }
    `;

    await executePipefyMutation(session, actionQuery);

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
            }
          }
        }
      `;

      await executePipefyMutation(session, commentQuery);
    }
  };

  const handleRequestTowing = async (
    cardId: string,
    phase: string,
    reason: string,
    photos: Record<string, File>
  ) => {
    logger.log('Solicitando guincho (mobile):', { cardId, phase, reason, photos });

    const session = await getSessionOrThrow();
    const fieldIds = getPhaseFieldIds(phase);

    const photosToUpload =
      reason === 'Veículo na rua sem recuperação da chave'
        ? Object.fromEntries(Object.entries(photos).filter(([key]) => !['estepe', 'painel'].includes(key)))
        : photos;

    await Promise.all(
      Object.entries(photosToUpload).map(async ([key, file]) => {
        const fieldId = fieldIds.photos[key];
        if (fieldId) {
          await uploadImageToPipefy(file, fieldId, cardId, session);
        }
      })
    );

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
          success
        }
      }
    `;

    await executePipefyMutation(session, updateQuery);
  };

  const handleReportProblem = async (
    cardId: string,
    phase: string,
    difficulty: string,
    evidences: Record<string, File>
  ) => {
    logger.log('Reportando problema (mobile):', { cardId, phase, difficulty, evidences });

    const session = await getSessionOrThrow();
    const fieldIds = getPhaseFieldIds(phase);

    await Promise.all(
      Object.entries(evidences).map(async ([key, file]) => {
        const fieldId = fieldIds.evidences[key];
        if (fieldId) {
          await uploadImageToPipefy(file, fieldId, cardId, session);
        }
      })
    );

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
          success
        }
      }
    `;

    await executePipefyMutation(session, updateQuery);
  };

  const handleConfirmPatioDelivery = async (
    cardId: string,
    photos: Record<string, File>,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    logger.log('Confirmando entrega no pátio (mobile):', { cardId, photos, expenses, expenseValues });

    const session = await getSessionOrThrow();

    const photoFieldMapping: Record<string, string> = {
      frente: 'foto_do_ve_culo_e_ou_local_da_recolha',
      traseira: 'foto_da_lateral_traseira_esquerda_do_ve_culo',
      lateralDireita: 'foto_da_lateral_traseira_direita_do_ve_culo',
      lateralEsquerda: 'foto_da_lateral_direita_do_ve_culo',
      painel: 'foto_da_lateral_esquerda_do_ve_culo',
      odometro: 'foto_do_od_metro'
    };

    await Promise.all(
      Object.entries(photos).map(async ([key, file]) => {
        const fieldId = photoFieldMapping[key];
        if (fieldId) {
          await uploadImageToPipefy(file, fieldId, cardId, session);
        }
      })
    );

    const expenseValueFields: Record<string, string> = {
      gasolina: 'valor_do_abastecimento',
      pedagio: 'valor_do_s_ped_gio_s',
      estacionamento: 'valor_do_estacionamento',
      motoboy: 'valor_do_motoboy'
    };

    const expenseFieldMapping: Record<string, string> = {
      gasolina: 'comprovante_ou_nota_do_abastecimento',
      pedagio: 'comprovante_do_ped_gio',
      estacionamento: 'comprovante_do_estacionamento',
      motoboy: 'comprovante_de_pagamento_ou_nota_do_motoboy'
    };

    await Promise.all(
      Object.entries(expenseReceipts).map(async ([key, file]) => {
        const fieldId = expenseFieldMapping[key];
        if (fieldId) {
          await uploadImageToPipefy(file, fieldId, cardId, session);
        }
      })
    );

    const fieldsToUpdate = [
      {
        fieldId: 'situa_o_da_recolha',
        value: 'Veículo entregue no pátio'
      },
      {
        fieldId: 'selecionar_tipo_de_entrega',
        value: 'Carro entregue no pátio'
      }
    ];

    expenses.forEach(expense => {
      const valueFieldId = expenseValueFields[expense];
      if (valueFieldId) {
        fieldsToUpdate.push({
          fieldId: valueFieldId,
          value: expenseValues[expense] || ''
        });
      }
    });

    const mutationQuery = `
      mutation {
        updateFieldsValues(
          input: {
            nodeId: "${cardId}"
            values: ${JSON.stringify(fieldsToUpdate).replace(/"fieldId"/g, 'fieldId').replace(/"value"/g, 'value')}
          }
        ) {
          success
        }
      }
    `;

    await executePipefyMutation(session, mutationQuery);
  };

  const handleConfirmCarTowed = async (
    cardId: string,
    photo: File,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    logger.log('Confirmando carro guinchado (mobile):', { cardId, expenses, expenseValues });

    const session = await getSessionOrThrow();

    await uploadImageToPipefy(photo, 'foto_do_carro_no_guincho', cardId, session);

    const expenseFieldMapping: Record<string, string> = {
      gasolina: 'comprovante_ou_nota_do_abastecimento',
      pedagio: 'comprovante_do_ped_gio',
      estacionamento: 'comprovante_do_estacionamento',
      motoboy: 'comprovante_de_pagamento_ou_nota_do_motoboy'
    };

    await Promise.all(
      Object.entries(expenseReceipts).map(async ([key, file]) => {
        const fieldId = expenseFieldMapping[key];
        if (fieldId) {
          await uploadImageToPipefy(file, fieldId, cardId, session);
        }
      })
    );

    const expenseValueFields: Record<string, string> = {
      gasolina: 'valor_do_abastecimento',
      pedagio: 'valor_do_s_ped_gio_s',
      estacionamento: 'valor_do_estacionamento',
      motoboy: 'valor_do_motoboy'
    };

    const fieldsToUpdate = [
      {
        fieldId: 'selecione_uma_op_o',
        value: 'Carro guinchado'
      },
      {
        fieldId: 'o_carro_chegou_no_guincho',
        value: 'Sim'
      }
    ];

    expenses.forEach(expense => {
      const valueFieldId = expenseValueFields[expense];
      if (valueFieldId) {
        fieldsToUpdate.push({
          fieldId: valueFieldId,
          value: expenseValues[expense] || ''
        });
      }
    });

    const mutationQuery = `
      mutation {
        updateFieldsValues(
          input: {
            nodeId: "${cardId}"
            values: ${JSON.stringify(fieldsToUpdate).replace(/"fieldId"/g, 'fieldId').replace(/"value"/g, 'value')}
          }
        ) {
          success
        }
      }
    `;

    await executePipefyMutation(session, mutationQuery);
  };

  const handleRequestTowMechanical = async (cardId: string, reason: string) => {
    logger.log('Solicitando guincho por problema mecânico (mobile):', { cardId, reason });

    const session = await getSessionOrThrow();
    const userEmail = await getCurrentUserEmail();

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
          success
        }
      }
    `;

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
          }
        }
      }
    `;

    await Promise.all([
      executePipefyMutation(session, updateQuery),
      executePipefyMutation(session, commentQuery)
    ]);
  };

  const isFila = card.faseAtual === 'Fila de Recolha';
  const isTentativaRecolha = [
    'Tentativa 1 de Recolha', 
    'Tentativa 2 de Recolha', 
    'Tentativa 3 de Recolha', 
    'Tentativa 4 de Recolha'
  ].includes(card.faseAtual);
  const isConfirmacaoRecolha = card.faseAtual === 'Confirmação de Entrega no Pátio';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const openMap = (link: string) => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  const makeCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone.replace(/\D/g, '')}`
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] fade-in">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm mobile-modal-backdrop"
        onClick={onClose}
      />
      
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 mobile-modal-content mobile-shadow-lg z-[10000] ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{card.placa}</h2>
                <p className="text-sm text-gray-500">{card.nomeDriver}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {[
            { id: 'details', label: 'Detalhes', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'actions', label: 'Ações', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
            { id: 'history', label: 'Histórico', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'details' | 'actions' | 'history')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-[#FF355A] border-b-2 border-[#FF355A]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          <div className="min-h-[400px]">
            {activeTab === 'details' && (
              <div className="p-4 space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      Status Atual
                    </h3>
                    <span className="text-xs text-gray-500">{formatDate(card.dataCriacao)}</span>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getPhaseColor(card.faseAtual)}`}>
                    {adaptPhaseName(card.faseAtual)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Informações do Veículo</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Placa</p>
                        <p className="font-bold text-lg text-gray-900">{card.placa}</p>
                      </div>
                      {card.modeloVeiculo && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Modelo</p>
                          <p className="font-medium text-sm text-gray-900">{card.modeloVeiculo}</p>
                        </div>
                      )}
                    </div>

                    {card.enderecoRecolha && (
                      <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-orange-700">📍 Localização</p>
                          {card.linkMapa && (
                            <button
                              onClick={() => openMap(card.linkMapa!)}
                              className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-md text-xs text-orange-700 hover:bg-orange-200 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              Maps
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed">{card.enderecoRecolha}</p>
                      </div>
                    )}

                    {card.origemLocacao && (
                      <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-100">
                        <p className="text-xs font-medium text-green-700 mb-1">🎯 Local para Entrega</p>
                        <p className="text-xs text-gray-800">{card.origemLocacao}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Cliente</h4>
                    </div>

                    {card.nomeDriver && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-600 mb-1">Nome</p>
                        <p className="font-semibold text-gray-900">{card.nomeDriver}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      {card.telefoneContato && (
                        <button
                          onClick={() => makeCall(card.telefoneContato!)}
                          className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div className="text-left">
                              <p className="text-xs text-green-600">Telefone Principal</p>
                              <p className="font-medium text-sm text-gray-900">{card.telefoneContato}</p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}

                      {card.telefoneOpcional && (
                        <button
                          onClick={() => makeCall(card.telefoneOpcional!)}
                          className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div className="text-left">
                              <p className="text-xs text-yellow-600">Telefone Opcional</p>
                              <p className="font-medium text-sm text-gray-900">{card.telefoneOpcional}</p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {card.enderecoCadastro && (
                      <div className="mt-3 bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-purple-700">🏠 Endereço de Cadastro</p>
                          <button
                            onClick={() => copyToClipboard(card.enderecoCadastro!)}
                            className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-md text-xs text-purple-700 hover:bg-purple-200 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar
                          </button>
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed">{card.enderecoCadastro}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Prestador</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {card.empresaResponsavel && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Empresa</p>
                          <p className="font-medium text-sm text-gray-900">{card.empresaResponsavel}</p>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Chofer</p>
                        <p className="font-medium text-sm text-gray-900">
                          {card.chofer ? card.chofer : <span className="italic text-gray-400">Não há chofer alocado</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="h-full min-h-[500px] p-4">
                {isFila ? (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Gerenciar Recolha</h3>
                      <p className="text-sm text-gray-500">Escolha uma das opções abaixo</p>
                    </div>

                    {!showAllocateDriver && !showRejectCollection && (
                      <div className="space-y-3">
                        {(() => {
                          const pType = permissionType?.toLowerCase();
                          const empresaCard = card?.empresaResponsavel?.toLowerCase();
                          
                          const canAllocate = 
                            pType === 'admin' ||
                            (pType === 'onsystem' && empresaCard === 'onsystem') ||
                            (pType === 'rvs' && empresaCard === 'rvs') ||
                            (pType === 'ativa' && empresaCard === 'ativa');
                          
                          if (canAllocate) {
                            return (
                              <button
                                onClick={() => setShowAllocateDriver(true)}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Alocar Chofer
                              </button>
                            );
                          }
                          return null;
                        })()}
                        
                        <button
                          onClick={() => setShowRejectCollection(true)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rejeitar Recolha
                        </button>
                      </div>
                    )}

                    {showAllocateDriver && (
                      <AllocateDriverForm
                        card={card}
                        onAllocateDriver={handleAllocateDriver}
                        onClose={onClose}
                        onBack={() => setShowAllocateDriver(false)}
                      />
                    )}

                    {showRejectCollection && (
                      <RejectCollectionForm
                        card={card}
                        onRejectCollection={handleRejectCollection}
                        onClose={onClose}
                        onBack={() => setShowRejectCollection(false)}
                      />
                    )}
                  </div>
                ) : isTentativaRecolha ? (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Ações de Recolha</h3>
                      <p className="text-sm text-gray-500">Selecione uma ação para prosseguir</p>
                    </div>

                    {!showUnlockVehicle && !showRequestTowing && !showReportProblem && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowUnlockVehicle(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Desbloquear Veículo
                        </button>
                        
                        <button
                          onClick={() => setShowRequestTowing(true)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                          Solicitar Guincho
                        </button>

                        <button
                          onClick={() => setShowReportProblem(true)}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Reportar Problema
                        </button>
                      </div>
                    )}

                    {showUnlockVehicle && (
                      <UnlockVehicleForm
                        card={card}
                        onUnlockVehicle={handleUnlockVehicle}
                        onClose={onClose}
                        onBack={() => setShowUnlockVehicle(false)}
                      />
                    )}

                    {showRequestTowing && (
                      <RequestTowingForm
                        card={card}
                        onRequestTowing={handleRequestTowing}
                        onClose={onClose}
                        onBack={() => setShowRequestTowing(false)}
                      />
                    )}

                    {showReportProblem && (
                      <ReportProblemForm
                        card={card}
                        onReportProblem={handleReportProblem}
                        onClose={onClose}
                        onBack={() => setShowReportProblem(false)}
                      />
                    )}
                  </div>
                ) : isConfirmacaoRecolha ? (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmação de Recolha</h3>
                      <p className="text-sm text-gray-500">Selecione uma das opções para finalizar</p>
                    </div>

                    {!showConfirmPatioDelivery && !showCarTowed && !showRequestTowMechanical && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowConfirmPatioDelivery(true)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Confirmar entrega no pátio
                        </button>
                        
                        <button
                          onClick={() => setShowCarTowed(true)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                          Carro guinchado
                        </button>

                        <button
                          onClick={() => setShowRequestTowMechanical(true)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-4 text-sm font-bold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="text-center">
                            <div>Solicitar guincho</div>
                            <div className="text-xs opacity-90">(problemas mecânicos)</div>
                          </div>
                        </button>
                      </div>
                    )}

                    {showConfirmPatioDelivery && (
                      <ConfirmPatioDeliveryForm
                        card={card}
                        onConfirmPatioDelivery={handleConfirmPatioDelivery}
                        onClose={onClose}
                        onBack={() => setShowConfirmPatioDelivery(false)}
                      />
                    )}

                    {showCarTowed && (
                      <CarTowedForm
                        card={card}
                        onConfirmCarTowed={handleConfirmCarTowed}
                        onClose={onClose}
                        onBack={() => setShowCarTowed(false)}
                      />
                    )}

                    {showRequestTowMechanical && (
                      <RequestTowMechanicalForm
                        card={card}
                        onRequestTowMechanical={handleRequestTowMechanical}
                        onClose={onClose}
                        onBack={() => setShowRequestTowMechanical(false)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[400px]">
                    {card.urlPublica ? (
                      <iframe
                        src={card.urlPublica}
                        className="w-full h-full min-h-[400px] border-0 rounded-xl"
                        title="Pipefy Card"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="bg-yellow-50 rounded-xl p-4 text-center">
                          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-sm text-yellow-700">URL pública não disponível</p>
                          <p className="text-xs text-yellow-600 mt-1">Este card não possui uma URL pública configurada</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-6 space-y-4 h-full min-h-[500px] flex flex-col justify-start">
                <h3 className="font-semibold text-gray-900">Histórico de Atividades</h3>
                
                <div className="space-y-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#FF355A] rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Tarefa criada</p>
                      <p className="text-xs text-gray-500">{formatDate(card.dataCriacao)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Aguardando processamento...</p>
                      <p className="text-xs text-gray-400">Histórico em desenvolvimento</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <span className="text-xs text-gray-500">ID: {card.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
