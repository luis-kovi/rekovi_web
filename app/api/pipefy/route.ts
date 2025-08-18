import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/utils/logger'

// Schema simples para validação da query GraphQL
interface PipefyRequest {
  query: string
  variables?: Record<string, any>
}

// Validação básica da requisição
function validatePipefyRequest(body: any): body is PipefyRequest {
  return (
    body &&
    typeof body === 'object' &&
    typeof body.query === 'string' &&
    body.query.trim().length > 0
  )
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação do usuário
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.warn('Unauthorized Pipefy API access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validar body da requisição
    const body = await request.json()
    
    if (!validatePipefyRequest(body)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected { query: string, variables?: object }' },
        { status: 400 }
      )
    }

    // 3. Obter token do ambiente (servidor apenas)
    const PIPEFY_TOKEN = process.env.PIPEFY_TOKEN
    
    if (!PIPEFY_TOKEN) {
      logger.error('PIPEFY_TOKEN not configured in environment')
      return NextResponse.json(
        { error: 'Pipefy integration not configured' },
        { status: 503 }
      )
    }

    // 4. Fazer requisição para o Pipefy
    const pipefyResponse = await fetch('https://api.pipefy.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PIPEFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: body.query,
        variables: body.variables || {}
      }),
    })

    // 5. Verificar resposta do Pipefy
    if (!pipefyResponse.ok) {
      logger.error('Pipefy API error:', {
        status: pipefyResponse.status,
        statusText: pipefyResponse.statusText
      })
      
      // Não expor detalhes do erro ao cliente
      return NextResponse.json(
        { error: 'Failed to communicate with Pipefy' },
        { status: pipefyResponse.status }
      )
    }

    const data = await pipefyResponse.json()

    // 6. Log para auditoria (sem expor token)
    logger.log('Pipefy API called', {
      userId: user.id,
      userEmail: user.email,
      queryType: body.query.match(/mutation|query\s+(\w+)/)?.[1] || 'unknown'
    })

    // 7. Retornar resposta ao cliente
    return NextResponse.json(data)

  } catch (error) {
    logger.error('Pipefy proxy error:', error)
    
    // Retornar erro genérico para não expor detalhes internos
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificar se a integração está configurada
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se o token está configurado (sem expô-lo)
    const isConfigured = !!process.env.PIPEFY_TOKEN

    return NextResponse.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'Pipefy integration is configured' 
        : 'Pipefy integration is not configured'
    })
  } catch (error) {
    logger.error('Error checking Pipefy configuration:', error)
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    )
  }
}