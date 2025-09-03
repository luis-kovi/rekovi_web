import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserDataServer } from '@/utils/user-data-server'
import { extractCityFromOrigin } from '@/utils/helpers'
import { PreApprovedUser } from '@/utils/auth-validation'

export async function GET(request: NextRequest) {
  console.log("--- [API /api/chofers] Iniciando requisição ---");
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      console.log("[API /api/chofers] Erro: Usuário não autenticado.");
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    console.log(`[API /api/chofers] Usuário autenticado: ${user.email}`);

    const userData = await getUserDataServer(user.email)

    if (!userData) {
      console.log(`[API /api/chofers] Erro: Usuário ${user.email} não encontrado na tabela de pré-aprovados.`);
      return NextResponse.json({ error: 'Usuário não autorizado' }, { status: 403 })
    }
    console.log(`[API /api/chofers] Dados do usuário: permission_type=${userData.permission_type}, empresa=${userData.empresa}`);

    const { permission_type: permissionType, empresa } = userData
    const { searchParams } = new URL(request.url)
    const empresaResponsavel = searchParams.get('empresaResponsavel')
    const origemLocacao = searchParams.get('origemLocacao')
    console.log(`[API /api/chofers] Parâmetros recebidos: empresaResponsavel=${empresaResponsavel}, origemLocacao=${origemLocacao}`);

    if (!empresaResponsavel || !origemLocacao) {
      console.log("[API /api/chofers] Erro: Parâmetros obrigatórios ausentes.");
      return NextResponse.json({ error: 'Os parâmetros empresaResponsavel e origemLocacao são obrigatórios' }, { status: 400 })
    }

    // Admins podem ver todos os chofers da empresa do card
    // Outros usuários só podem ver chofers da sua própria empresa
    if (permissionType !== 'admin' && empresa.toLowerCase() !== empresaResponsavel.toLowerCase()) {
      console.log(`[API /api/chofers] Bloqueio de permissão: Usuário da empresa '${empresa}' tentando acessar chofers da empresa '${empresaResponsavel}'.`);
      return NextResponse.json({ error: 'Você não tem permissão para ver chofers desta empresa' }, { status: 403 })
    }
    console.log("[API /api/chofers] Verificação de permissão bem-sucedida.");

    const cardCity = extractCityFromOrigin(origemLocacao).toLowerCase();
    console.log(`[API /api/chofers] Cidade extraída da origem: ${cardCity}`);

    console.log(`[API /api/chofers] Buscando chofers no DB para empresa: ${empresaResponsavel}`);
    const { data: users, error } = await supabase
      .from('pre_approved_users')
      .select('nome, email, empresa, permission_type, status, area_atuacao')
      .eq('empresa', empresaResponsavel)
      .eq('permission_type', 'chofer')
      .eq('status', 'active')

    if (error) {
      console.error('[API /api/chofers] Erro na consulta ao Supabase:', error)
      return NextResponse.json({ error: 'Erro ao buscar chofers' }, { status: 500 })
    }
    console.log(`[API /api/chofers] Encontrados ${users?.length || 0} chofers no DB antes do filtro de área.`);
    if (users && users.length > 0) {
      console.log('[API /api/chofers] Detalhes dos chofers encontrados:', users.map(u => ({ nome: u.nome, area: u.area_atuacao })));
    }


    const filteredUsers = users.filter((user: PreApprovedUser) => {
      if (!user.area_atuacao || !Array.isArray(user.area_atuacao)) return false;
      const hasMatchingArea = user.area_atuacao.some((area: string) => {
        const areaCity = area.toLowerCase();
        return cardCity.includes(areaCity) || areaCity.includes(cardCity) || cardCity === areaCity;
      });
      return hasMatchingArea;
    });
    console.log(`[API /api/chofers] Após filtro de área, restaram ${filteredUsers.length} chofers.`);

    console.log("--- [API /api/chofers] Requisição finalizada ---");
    return NextResponse.json(filteredUsers)
  } catch (error) {
    console.error('[API /api/chofers] Erro inesperado no bloco catch:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
