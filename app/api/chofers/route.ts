import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserData } from '@/utils/user-data-server'
import { extractCityFromOrigin } from '@/utils/helpers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const userData = await getUserData(supabase)

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { permissionType, empresa } = userData
    const { searchParams } = new URL(request.url)
    const empresaResponsavel = searchParams.get('empresaResponsavel')
    const origemLocacao = searchParams.get('origemLocacao')

    if (!empresaResponsavel || !origemLocacao) {
      return NextResponse.json({ error: 'Os parâmetros empresaResponsavel e origemLocacao são obrigatórios' }, { status: 400 })
    }

    // Admins podem ver todos os chofers da empresa do card
    // Outros usuários só podem ver chofers da sua própria empresa
    if (permissionType !== 'admin' && empresa.toLowerCase() !== empresaResponsavel.toLowerCase()) {
      return NextResponse.json({ error: 'Você não tem permissão para ver chofers desta empresa' }, { status: 403 })
    }

    const cardCity = extractCityFromOrigin(origemLocacao).toLowerCase();

    const { data: users, error } = await supabase
      .from('pre_approved_users')
      .select('nome, email, empresa, permission_type, status, area_atuacao')
      .eq('empresa', empresaResponsavel)
      .eq('permission_type', 'chofer')
      .eq('status', 'active')

    if (error) {
      console.error('Erro ao buscar chofers:', error)
      return NextResponse.json({ error: 'Erro ao buscar chofers' }, { status: 500 })
    }

    const filteredUsers = users.filter(user => {
      if (!user.area_atuacao || !Array.isArray(user.area_atuacao)) return false;
      return user.area_atuacao.some((area: string) => {
        const areaCity = area.toLowerCase();
        return cardCity.includes(areaCity) || areaCity.includes(cardCity) || cardCity === areaCity;
      });
    });

    return NextResponse.json(filteredUsers)
  } catch (error) {
    console.error('Erro na API de chofers:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
