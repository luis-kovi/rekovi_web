import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserDataServer } from '@/utils/user-data-server'
import { logger } from '@/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user and get their permissions
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const userData = await getUserDataServer(user.email)
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autorizado' }, { status: 403 })
    }

    // 2. Get query params
    const { permission_type: permissionType, empresa } = userData
    const { searchParams } = new URL(request.url)
    const empresaResponsavel = searchParams.get('empresaResponsavel')
    const origemLocacao = searchParams.get('origemLocacao')

    if (!empresaResponsavel || !origemLocacao) {
      return NextResponse.json({ error: 'Os parâmetros empresaResponsavel e origemLocacao são obrigatórios' }, { status: 400 })
    }

    // 3. Enforce security rule: non-admins can only query for their own company
    if (permissionType !== 'admin' && empresa.toLowerCase() !== empresaResponsavel.toLowerCase()) {
      return NextResponse.json({ error: 'Você não tem permissão para ver chofers desta empresa' }, { status: 403 })
    }

    // 4. Securely call the Edge Function to get data
    const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke('get-available-chofers', {
      body: { empresaResponsavel, origemLocacao },
    })

    if (edgeError) {
      logger.error('Erro ao invocar a Edge Function "get-available-chofers":', { error: edgeError.message })
      return NextResponse.json({ error: 'Erro ao buscar chofers na Edge Function.' }, { status: 500 })
    }

    return NextResponse.json(edgeResponse)

  } catch (error) {
    logger.error('Erro inesperado na API de chofers:', { error: (error as Error).message })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
