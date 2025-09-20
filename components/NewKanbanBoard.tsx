// components/NewKanbanBoard.tsx
'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useNewCards } from '@/hooks/useNewCards'
import NewCard from './NewCard'
import LoadingIndicator from './LoadingIndicator'
import ControlPanel from './ControlPanel'
import CardModal from './CardModal'
import type { Card, CardWithSLA } from '@/types'
import { calcularSLA, fixedPhaseOrder, phaseDisplayNames, disabledPhases, formatPersonName, formatDate } from '@/utils/helpers'
import { logger } from '@/utils/logger'

interface NewKanbanBoardProps {
  initialCards: Card[]
  permissionType?: string
  onUpdateStatus?: (isUpdating: boolean) => void
}

export default function NewKanbanBoard({ initialCards, permissionType, onUpdateStatus }: NewKanbanBoardProps) {
  const { cards, setCards, isLoading } = useNewCards(initialCards, permissionType, onUpdateStatus)
  const [searchTerm, setSearchTerm] = useState('')
  const [slaFilter, setSlaFilter] = useState('all')
  const [hideEmptyPhases, setHideEmptyPhases] = useState(false)
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban')
  const [selectedCard, setSelectedCard] = useState<CardWithSLA | null>(null)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const calculatorRef = useRef<HTMLDivElement>(null)

  const filteredCards = useMemo((): CardWithSLA[] => {
    const cardsWithSLA = cards.map(card => {
      const sla = calcularSLA(card.dataCriacao)
      let slaText: CardWithSLA['slaText'] = 'No Prazo'
      if (sla >= 3) slaText = 'Atrasado'
      else if (sla === 2) slaText = 'Em Alerta'
      return { ...card, sla, slaText }
    })

    const filtered = cardsWithSLA.filter(card => {
      const search = searchTerm.toLowerCase()
      const placa = (card.placa || '').toLowerCase()
      const driver = (card.nomeDriver || '').toLowerCase()
      const chofer = (card.chofer || '').toLowerCase()

      const matchesSearch =
        searchTerm === '' ||
        placa.includes(search) ||
        driver.includes(search) ||
        chofer.includes(search)

      const matchesSla = slaFilter === 'all' || card.slaText === slaFilter

      return matchesSearch && matchesSla
    })

    if (activeView === 'list') {
      return filtered.sort((a, b) => b.sla - a.sla)
    }

    return filtered
  }, [cards, searchTerm, slaFilter, activeView])

  const phases = useMemo(() => {
    const phaseMap: { [key: string]: CardWithSLA[] } = {}
    fixedPhaseOrder.forEach(phase => {
      phaseMap[phase] = []
    })
    filteredCards.forEach(card => {
      if (phaseMap[card.faseAtual]) {
        phaseMap[card.faseAtual].push(card)
      }
    })
    return phaseMap
  }, [filteredCards])

  const handleUpdateChofer = async (cardId: string, newName: string, newEmail: string) => {
    logger.log('Atualizando chofer:', { cardId, newName, newEmail })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

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
      `

      const supabaseUrl = (supabase as any).supabaseUrl
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: pipefyQuery,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro na API: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      logger.log('Chofer atualizado com sucesso no Pipefy:', result)

      setCards(prevCards =>
        prevCards.map(card =>
          card.id === cardId ? { ...card, chofer: newName, emailChofer: newEmail } : card
        )
      )
    } catch (error) {
      logger.error('Erro ao atualizar chofer:', error)
      throw error
    }
  }

  const handleAllocateDriver = async (
    cardId: string,
    driverName: string,
    driverEmail: string,
    dateTime: string,
    collectionValue: string,
    additionalKm: string,
    billingType: string
  ) => {
    logger.log('Alocando chofer:', {
      cardId,
      driverName,
      driverEmail,
      dateTime,
      collectionValue,
      additionalKm,
      billingType,
    })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userEmail = user?.email || 'Usuário desconhecido'

      const fieldsToUpdate = [
        {
          fieldId: 'nome_do_chofer_que_far_a_recolha',
          value: driverName,
        },
        {
          fieldId: 'e_mail_do_chofer',
          value: driverEmail,
        },
        {
          fieldId: 'data_e_hora_prevista_para_recolha',
          value: dateTime,
        },
        {
          fieldId: 'custo_de_km_adicional',
          value: additionalKm,
        },
        {
          fieldId: 've_culo_ser_recolhido',
          value: 'Sim',
        },
        {
          fieldId: 'tipo_de_faturamento',
          value: billingType,
        },
      ]

      if (collectionValue) {
        fieldsToUpdate.push({
          fieldId: 'valor_da_recolha',
          value: collectionValue,
        })
      }

      const pipefyQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: ${JSON.stringify(fieldsToUpdate)
                .replace(/"fieldId"/g, 'fieldId')
                .replace(/"value"/g, 'value')}
            }
          ) {
            clientMutationId
            success
          }
        }
      `

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
      `

      const supabaseUrl = (supabase as any).supabaseUrl

      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: pipefyQuery,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro na API: ${response.status}`)
      }

      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: commentQuery,
        }),
      })

      logger.log('Chofer alocado com sucesso no Pipefy')

      setCards(prevCards =>
        prevCards.map(card =>
          card.id === cardId ? { ...card, chofer: driverName, emailChofer: driverEmail } : card
        )
      )
    } catch (error) {
      logger.error('Erro ao alocar chofer:', error)
      throw error
    }
  }

  const handleRejectCollection = async (cardId: string, reason: string, observations: string) => {
    logger.log('Rejeitando recolha:', { cardId, reason, observations })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userEmail = user?.email || 'Usuário desconhecido'

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
      `

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
      `

      const supabaseUrl = (supabase as any).supabaseUrl

      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: pipefyQuery,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro na API: ${response.status}`)
      }

      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: commentQuery,
        }),
      })

      logger.log('Recolha rejeitada com sucesso no Pipefy')
    } catch (error) {
      logger.error('Erro ao rejeitar recolha:', error)
      throw error
    }
  }

  const uploadImageToPipefy = async (file: File, fieldId: string, cardId: string, session: any) => {
    try {
      const supabaseUrl = (createClient() as any).supabaseUrl

      const fileName = `${cardId}_${fieldId}_${Date.now()}.${
        file.type.split('/')[1] || 'jpg'
      }`
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
      `

      const variables = {
        organizationId: '281428',
        fileName: fileName,
        contentType: file.type,
      }

      logger.log('Enviando query para presigned URL:', presignedQuery)

      const presignedResponse = await fetch(`${supabaseUrl}/functions/v1/upload-image-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: presignedQuery,
          variables: variables,
        }),
      })

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text()
        logger.error('Erro na resposta presigned:', errorText)
        throw new Error(
          `Erro ao gerar URL de upload: ${presignedResponse.status} - ${errorText}`
        )
      }

      const presignedData = await presignedResponse.json()
      logger.log('Resposta completa presigned URL:', presignedData)

      if (presignedData.errors && presignedData.errors.length > 0) {
        logger.error('Erros da API Pipefy:', presignedData.errors)
        const errorMessages = presignedData.errors.map((error: any) => error.message).join(', ')
        throw new Error(`Erro na API Pipefy: ${errorMessages}`)
      }

      if (!presignedData?.data?.createPresignedUrl) {
        logger.error('Estrutura de resposta inválida:', presignedData)
        throw new Error('Resposta inválida da API de presigned URL')
      }

      const { url: uploadUrl, downloadUrl } = presignedData.data.createPresignedUrl

      if (!uploadUrl || !downloadUrl) {
        throw new Error('URLs de upload/download não fornecidas')
      }

      logger.log('URLs obtidas:', { uploadUrl, downloadUrl })

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        logger.error('Erro no upload:', errorText)
        throw new Error(`Erro ao fazer upload da imagem: ${uploadResponse.status}`)
      }

      logger.log('Upload realizado com sucesso')

      const urlParts = downloadUrl.split('/uploads/')
      const filePath = urlParts[1] ? urlParts[1].split('?')[0] : ''
      const organizationId = '870bddf7-6ce7-4b9d-81d8-9087f1c10ae2'
      const fullPath = `orgs/${organizationId}/uploads/${filePath}`

      logger.log('Path do arquivo:', fullPath)

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
      `

      logger.log('Atualizando campo com URL:', updateFieldQuery)

      const updateResponse = await fetch(`${supabaseUrl}/functions/v1/upload-image-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateFieldQuery }),
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        logger.error('Erro ao atualizar campo:', errorText)
        throw new Error(`Erro ao atualizar campo com imagem: ${updateResponse.status}`)
      }

      const updateData = await updateResponse.json()
      logger.log('Resposta updateCardField completa:', updateData)

      if (updateData.errors && updateData.errors.length > 0) {
        logger.error('Erros ao atualizar campo:', updateData.errors)
        const errorMessages = updateData.errors.map((error: any) => error.message).join(', ')
        throw new Error(`Erro ao atualizar campo ${fieldId}: ${errorMessages}`)
      }

      logger.log('Campo atualizado com sucesso:', updateData)
      return downloadUrl
    } catch (error) {
      logger.error('Erro no upload da imagem:', error)
      throw error
    }
  }

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
          painel: 'foto_do_painel',
        },
        evidences: {
          photo1: 'evid_ncia_1',
          photo2: 'evid_ncia_2',
          photo3: 'evid_ncia_3',
        },
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
          painel: 'foto_do_painel_1',
        },
        evidences: {
          photo1: 'evid_ncia_1_1',
          photo2: 'evid_ncia_2_1',
          photo3: 'evid_ncia_3_1',
        },
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
          painel: 'foto_do_painel_2',
        },
        evidences: {
          photo1: 'evid_ncia_1_2',
          photo2: 'evid_ncia_2_2',
          photo3: 'evid_ncia_3_2',
        },
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
          painel: 'foto_do_painel_3',
        },
        evidences: {
          photo1: 'evid_ncia_1_3',
          photo2: 'evid_ncia_2_3',
          photo3: 'evid_ncia_3_3',
        },
      },
    }
    return phaseFieldMap[phase] || phaseFieldMap['Tentativa 1 de Recolha']
  }

  const handleUnlockVehicle = async (
    cardId: string,
    phase: string,
    photos: Record<string, File>,
    observations?: string
  ) => {
    logger.log('Desbloqueando veículo:', { cardId, phase, photos, observations })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userEmail = user?.email || 'Usuário desconhecido'
      const fieldIds = getPhaseFieldIds(phase)

      const uploadPromises = Object.entries(photos).map(async ([key, file]) => {
        const fieldId = fieldIds.photos[key]
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session)
        }
      })

      await Promise.all(uploadPromises)

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
      `

      const supabaseUrl = (supabase as any).supabaseUrl
      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: actionQuery }),
      })

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
        `

        await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query: commentQuery }),
        })
      }

      logger.log('Veículo desbloqueado com sucesso no Pipefy')
    } catch (error) {
      logger.error('Erro ao desbloquear veículo:', error)
      throw error
    }
  }

  const handleRequestTowing = async (
    cardId: string,
    phase: string,
    reason: string,
    photos: Record<string, File>
  ) => {
    logger.log('Solicitando guincho:', { cardId, phase, reason, photos })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      const fieldIds = getPhaseFieldIds(phase)

      const photosToUpload =
        reason === 'Veículo na rua sem recuperação da chave'
          ? Object.fromEntries(
              Object.entries(photos).filter(([key]) => !['estepe', 'painel'].includes(key))
            )
          : photos

      const uploadPromises = Object.entries(photosToUpload).map(async ([key, file]) => {
        const fieldId = fieldIds.photos[key]
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session)
        }
      })

      await Promise.all(uploadPromises)

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
      `

      const supabaseUrl = (supabase as any).supabaseUrl
      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery }),
      })

      logger.log('Guincho solicitado com sucesso no Pipefy')
    } catch (error) {
      logger.error('Erro ao solicitar guincho:', error)
      throw error
    }
  }

  const handleReportProblem = async (
    cardId: string,
    phase: string,
    difficulty: string,
    evidences: Record<string, File>
  ) => {
    logger.log('Reportando problema:', { cardId, phase, difficulty, evidences })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      const fieldIds = getPhaseFieldIds(phase)

      const uploadPromises = Object.entries(evidences).map(async ([key, file]) => {
        const fieldId = fieldIds.evidences[key]
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session)
        }
      })

      await Promise.all(uploadPromises)

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
      `

      const supabaseUrl = (supabase as any).supabaseUrl
      await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery }),
      })

      logger.log('Problema reportado com sucesso no Pipefy')
    } catch (error) {
      logger.error('Erro ao reportar problema:', error)
      throw error
    }
  }

  const handleConfirmPatioDelivery = async (
    cardId: string,
    photos: Record<string, File>,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    logger.log('Confirmando entrega no pátio:', {
      cardId,
      photos,
      expenses,
      expenseValues,
      expenseReceipts,
    })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      const photoFieldMapping: Record<string, string> = {
        frente: 'anexe_imagem_do_carro_no_p_tio',
        traseira: 'foto_da_traseira_do_ve_culo',
        lateralDireita: 'foto_da_lateral_direita_passageiro_4',
        lateralEsquerda: 'foto_da_lateral_esquerda_motorista',
        estepe: 'foto_do_estepe_4',
        painel: 'foto_do_painel_4',
      }

      const uploadPromises = Object.entries(photos).map(async ([key, file]) => {
        const fieldId = photoFieldMapping[key]
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session)
        }
      })

      await Promise.all(uploadPromises)

      const expenseFieldMapping: Record<string, string> = {
        gasolina: 'comprovante_ou_nota_do_abastecimento',
        pedagio: 'comprovante_do_ped_gio',
        estacionamento: 'comprovante_do_estacionamento',
        motoboy: 'comprovante_de_pagamento_ou_nota_do_motoboy',
      }

      const receiptPromises = Object.entries(expenseReceipts).map(async ([key, file]) => {
        const fieldId = expenseFieldMapping[key]
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session)
        }
      })

      await Promise.all(receiptPromises)

      const expenseValueFields: Record<string, string> = {
        gasolina: 'valor_do_abastecimento',
        pedagio: 'valor_do_s_ped_gio_s',
        estacionamento: 'valor_do_estacionamento',
        motoboy: 'valor_do_motoboy',
      }

      const fieldsToUpdate = [
        {
          fieldId: 'selecione_uma_op_o',
          value: 'Carro entregue no pátio',
        },
        {
          fieldId: 'houveram_despesas_extras_no_processo_de_recolha',
          value: expenses,
        },
      ]

      Object.entries(expenseValues).forEach(([key, value]) => {
        const fieldId = expenseValueFields[key]
        if (fieldId && value) {
          fieldsToUpdate.push({
            fieldId: fieldId,
            value: value,
          })
        }
      })

      const updateQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                ${fieldsToUpdate
                  .map(
                    field => `{
                  fieldId: "${field.fieldId}"
                  value: ${
                    Array.isArray(field.value) ? JSON.stringify(field.value) : `"${field.value}"`
                  }
                }`
                  )
                  .join(',')}
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `

      const supabaseUrl = (supabase as any).supabaseUrl
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Erro na requisição ao Pipefy (desktop):', errorText)
        throw new Error('Erro na requisição ao Pipefy')
      }

      const result = await response.json()
      if (result.errors) {
        logger.error('Erro do Pipefy (desktop):', result.errors)
        throw new Error(
          `Erro do Pipefy: ${result.errors?.[0]?.message || 'Erro desconhecido'}`
        )
      }

      logger.log('Entrega no pátio confirmada com sucesso no Pipefy')
    } catch (error) {
      logger.error('Erro ao confirmar entrega no pátio:', error)
      throw error
    }
  }

  const handleConfirmCarTowed = async (
    cardId: string,
    photo: File,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => {
    logger.log('Confirmando carro guinchado:', {
      cardId,
      photo,
      expenses,
      expenseValues,
      expenseReceipts,
    })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      await uploadImageToPipefy(photo, 'anexe_imagem_do_carro_no_guincho', cardId, session)

      const expenseFieldMapping: Record<string, string> = {
        gasolina: 'comprovante_ou_nota_do_abastecimento',
        pedagio: 'comprovante_do_ped_gio',
        estacionamento: 'comprovante_do_estacionamento',
        motoboy: 'comprovante_de_pagamento_ou_nota_do_motoboy',
      }

      const receiptPromises = Object.entries(expenseReceipts).map(async ([key, file]) => {
        const fieldId = expenseFieldMapping[key]
        if (fieldId) {
          return uploadImageToPipefy(file, fieldId, cardId, session)
        }
      })

      await Promise.all(receiptPromises)

      const expenseValueFields: Record<string, string> = {
        gasolina: 'valor_do_abastecimento',
        pedagio: 'valor_do_s_ped_gio_s',
        estacionamento: 'valor_do_estacionamento',
        motoboy: 'valor_do_motoboy',
      }

      const fieldsToUpdate = [
        {
          fieldId: 'selecione_uma_op_o',
          value: 'Carro guinchado',
        },
        {
          fieldId: 'houveram_despesas_extras_no_processo_de_recolha',
          value: expenses,
        },
      ]

      Object.entries(expenseValues).forEach(([key, value]) => {
        const fieldId = expenseValueFields[key]
        if (fieldId && value) {
          fieldsToUpdate.push({
            fieldId: fieldId,
            value: value,
          })
        }
      })

      const updateQuery = `
        mutation {
          updateFieldsValues(
            input: {
              nodeId: "${cardId}"
              values: [
                ${fieldsToUpdate
                  .map(
                    field => `{
                  fieldId: "${field.fieldId}"
                  value: ${
                    Array.isArray(field.value) ? JSON.stringify(field.value) : `"${field.value}"`
                  }
                }`
                  )
                  .join(',')}
              ]
            }
          ) {
            clientMutationId
            success
          }
        }
      `

      const supabaseUrl = (supabase as any).supabaseUrl
      const response = await fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: updateQuery }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Erro na requisição ao Pipefy (desktop):', errorText)
        throw new Error('Erro na requisição ao Pipefy')
      }

      const result = await response.json()
      if (result.errors) {
        logger.error('Erro do Pipefy (desktop):', result.errors)
        throw new Error(
          `Erro do Pipefy: ${result.errors?.[0]?.message || 'Erro desconhecido'}`
        )
      }

      logger.log('Carro guinchado confirmado com sucesso no Pipefy')
    } catch (error) {
      logger.error('Erro ao confirmar carro guinchado:', error)
      throw error
    }
  }

  const handleRequestTowMechanical = async (cardId: string, reason: string) => {
    logger.log('Solicitando guincho mecânico:', { cardId, reason })

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado')
      }

      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData.user?.email || 'usuário'

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
      `

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
      `

      const supabaseUrl = (supabase as any).supabaseUrl

      await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query: updateQuery }),
        }),
        fetch(`${supabaseUrl}/functions/v1/update-chofer-pipefy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query: commentQuery }),
        }),
      ])

      logger.log('Guincho mecânico solicitado com sucesso no Pipefy')
    } catch (error) {
      logger.error('Erro ao solicitar guincho mecânico:', error)
      throw error
    }
  }

  const handleOpenCalculator = () => {
    setShowCalculator(true)
    setCalculatorPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 })
  }

  const handleCloseCalculator = () => {
    setShowCalculator(false)
  }

  const handleMouseDown = (e: any) => {
    if (!calculatorRef.current) return

    setIsDragging(true)
    const rect = calculatorRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - offsetX
      const newY = e.clientY - offsetY

      const maxX = window.innerWidth - rect.width
      const maxY = window.innerHeight - rect.height

      setCalculatorPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (isLoading) {
    return <LoadingIndicator message="A carregar dados..." />
  }

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
      <main className="flex-1 flex overflow-hidden bg-gray-100">
        {activeView === 'kanban' ? (
          <div className="flex-1 flex overflow-x-auto overflow-y-hidden p-4">
            <div className="flex gap-4">
              {fixedPhaseOrder.map(phaseName => {
                const cardsInPhase = phases[phaseName] || []
                if (hideEmptyPhases && cardsInPhase.length === 0) return null

                const displayPhaseName = phaseDisplayNames[phaseName] || phaseName
                const isDisabledPhase = disabledPhases.includes(phaseName)

                return (
                  <div
                    key={phaseName}
                    className={`w-72 bg-gray-50 rounded-lg shadow-md flex flex-col flex-shrink-0 ${
                      isDisabledPhase ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-700">{displayPhaseName}</h2>
                      <span className="text-sm text-gray-500">{cardsInPhase.length} cards</span>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto">
                      {cardsInPhase.map(card => (
                        <div
                          key={card.id}
                          onClick={() => !isDisabledPhase && setSelectedCard(card)}
                        >
                          <NewCard card={card} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="h-full w-full p-4">
            <div className="bg-white rounded-lg shadow-md h-full overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Placa</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Driver</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Chofer</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Fase</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Data</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-600">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCards.map(card => {
                    const isDisabled = disabledPhases.includes(card.faseAtual)
                    const displayPhase = phaseDisplayNames[card.faseAtual] || card.faseAtual
                    const formattedDate = formatDate(card.dataCriacao)

                    return (
                      <tr
                        key={card.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          isDisabled ? 'opacity-50' : ''
                        }`}
                        onClick={() => !isDisabled && setSelectedCard(card)}
                      >
                        <td className="px-4 py-2">{card.placa}</td>
                        <td className="px-4 py-2">{formatPersonName(card.nomeDriver)}</td>
                        <td className="px-4 py-2">
                          {!card.chofer || card.chofer === 'N/A'
                            ? 'Não alocado'
                            : formatPersonName(card.chofer)}
                        </td>
                        <td className="px-4 py-2">{displayPhase}</td>
                        <td className="px-4 py-2">{formattedDate}</td>
                        <td className="px-4 py-2 text-center">{card.sla}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={calculatorRef}
            className="bg-white rounded-lg shadow-2xl"
            style={{
              position: 'absolute',
              left: `${calculatorPosition.x}px`,
              top: `${calculatorPosition.y}px`,
              width: '400px',
              height: '600px',
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="p-3 flex justify-between items-center cursor-move bg-gray-100 rounded-t-lg">
              <h3 className="font-semibold">Calculadora de KM</h3>
              <button
                onClick={handleCloseCalculator}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <iframe
              src="https://calculadorakm.vercel.app/"
              className="w-full h-full rounded-b-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}
