import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/utils/logger'

// Interfaces
interface UploadResponse {
  uploadUrl?: string
  downloadUrl?: string
  filePath?: string
  error?: string
}

interface GraphQLResponse {
  data?: {
    updateCardField?: {
      card: {
        id: string
        title: string
      }
      clientMutationId?: string
    }
  }
  errors?: Array<{
    message: string
  }>
}

export async function POST(request: NextRequest) {
  logger.warn('🚀 [API] upload-file iniciado')
  
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    logger.warn('✅ [API] Supabase client criado')

    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    logger.warn('🔐 [API] Session check:', { hasSession: !!session, error: sessionError })

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const cardId = formData.get('cardId') as string
    const fieldId = formData.get('fieldId') as string

    logger.warn('📥 [API] FormData recebido:', {
      cardId,
      fieldId,
      fileName: file?.name,
      fileSize: file?.size,
      contentType: file?.type
    })

    if (!file || !cardId || !fieldId) {
      return NextResponse.json(
        { error: 'Arquivo, ID do card e ID do campo são obrigatórios' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${cardId}_${fieldId}_${timestamp}.${file.name.split('.').pop()}`
    
    logger.warn('🔄 [API] Criando presigned URL:', {
      fileName,
      contentType: file.type
    })

    // Create presigned URL for upload
    const response = await fetch(`${process.env.NEXT_PUBLIC_PIPEFY_API_URL}/upload_url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PIPEFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: process.env.PIPEFY_ORGANIZATION_ID,
        fileName,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar URL de upload: ${response.statusText}`)
    }

    const uploadData: UploadResponse = await response.json()
    logger.warn('📝 [API] Presigned URL criado:', { 
      hasUrl: !!uploadData.uploadUrl, 
      hasDownloadUrl: !!uploadData.downloadUrl 
    })

    if (!uploadData.uploadUrl) {
      throw new Error('URL de upload não recebida')
    }

    // Upload file to presigned URL
    const fileBuffer = await file.arrayBuffer()
    const uploadResponse = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!uploadResponse.ok) {
      throw new Error(`Erro ao fazer upload do arquivo: ${uploadResponse.statusText}`)
    }

    logger.warn('🔧 [API] Preparando update campo:', {
      downloadUrl: uploadData.downloadUrl,
      cardId,
      fieldId
    })

    // Update card field with file reference using downloadUrl
    const updateResult = await updateFileField(cardId, fieldId, uploadData.downloadUrl || '')
    
    if (!updateResult.success) {
      throw new Error(updateResult.error || 'Erro ao atualizar campo')
    }

    return NextResponse.json({
      success: true,
      downloadUrl: uploadData.downloadUrl,
    })

  } catch (error) {
    logger.warn('❌ [API] Erro no upload:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}

async function updateFileField(cardId: string, fieldId: string, downloadUrl: string) {
  logger.warn('📝 [API] Iniciando updateFileField:', {
    cardId,
    fieldId,
    downloadUrl
  })

  try {
    const mutation = `
      mutation {
        updateCardField(
          input: {
            card_id: "${cardId}"
            field_id: "${fieldId}"
            value: "${downloadUrl}"
          }
        ) {
          card {
            id
            title
          }
          clientMutationId
        }
      }
    `

    logger.warn('🔍 [SERVICE] Query GraphQL:', mutation)

    const response = await fetch(`${process.env.NEXT_PUBLIC_PIPEFY_API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PIPEFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation }),
    })

    const result: GraphQLResponse = await response.json()
    
    logger.warn('🔍 [SERVICE] Resultado GraphQL:', {
      hasData: !!result.data,
      hasErrors: !!result.errors,
      errors: result.errors?.map(e => e.message)
    })

    if (result.errors && result.errors.length > 0) {
      throw new Error(`Erro ao atualizar campo de arquivo: ${result.errors[0].message}`)
    }

    return {
      success: true,
      data: result.data?.updateCardField,
    }

  } catch (error) {
    logger.warn('❌ [SERVICE] Erro no executeGraphQL:', error)
    logger.warn('❌ [API] Erro no updateFileField:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}