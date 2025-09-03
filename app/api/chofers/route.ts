import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getUserDataServer } from '@/utils/user-data-server'
import { extractCityFromOrigin } from '@/utils/helpers'
import { PreApprovedUser } from '@/utils/auth-validation'

import { logger } from '@/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Get user's own data/permissions
    const userData = await getUserDataServer(user.email)
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autorizado' }, { status: 403 })
    }

    // Get query params
    const { permission_type: permissionType, empresa } = userData
    const { searchParams } = new URL(request.url)
    const empresaResponsavel = searchParams.get('empresaResponsavel')
    const origemLocacao = searchParams.get('origemLocacao')

    if (!empresaResponsavel || !origemLocacao) {
      return NextResponse.json({ error: 'Os parâmetros empresaResponsavel e origemLocacao são obrigatórios' }, { status: 400 })
    }

    // Enforce security rule: non-admins can only query for their own company
    if (permissionType !== 'admin' && empresa.toLowerCase() !== empresaResponsavel.toLowerCase()) {
      return NextResponse.json({ error: 'Você não tem permissão para ver chofers desta empresa' }, { status: 403 })
    }

    // Use the service role client to bypass RLS for the driver query
    const serviceSupabase = createServiceRoleClient();
    const { data: users, error } = await serviceSupabase
      .from('pre_approved_users')
      .select('nome, email, empresa, permission_type, status, area_atuacao')
      .eq('empresa', empresaResponsavel)
      .eq('permission_type', 'chofer')
      .eq('status', 'active')

    if (error) {
      logger.error('Erro na consulta de chofers (service role):', { error: error.message })
      return NextResponse.json({ error: 'Erro ao buscar chofers' }, { status: 500 })
    }

    if (!users) {
      return NextResponse.json([])
    }

    // Filter by area of operation
    const cardCity = extractCityFromOrigin(origemLocacao).toLowerCase();
    const filteredUsers = users.filter((user: PreApprovedUser) => {
      if (!user.area_atuacao || !Array.isArray(user.area_atuacao)) return false;
      return user.area_atuacao.some((area: string) => {
        const areaCity = area.toLowerCase();
        return cardCity.includes(areaCity) || areaCity.includes(cardCity) || cardCity === areaCity;
      });
    });

    return NextResponse.json(filteredUsers)
  } catch (error) {
    logger.error('Erro inesperado na API de chofers:', { error: (error as Error).message })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
