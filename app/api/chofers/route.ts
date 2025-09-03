// app/api/chofers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Pegar parâmetros da query
    const searchParams = request.nextUrl.searchParams
    const empresaResponsavel = searchParams.get('empresa')
    const origemLocacao = searchParams.get('origem')
    
    if (!empresaResponsavel || !origemLocacao) {
      return NextResponse.json(
        { error: 'Parâmetros empresa e origem são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar a função RPC para buscar choferes
    // A função já verifica as permissões internamente
    const { data: chofers, error: fetchError } = await supabase
      .rpc('get_available_chofers', {
        p_empresa_responsavel: empresaResponsavel,
        p_origem_locacao: origemLocacao,
        p_user_email: user.email
      })

    if (fetchError) {
      logger.error('Erro ao buscar choferes via RPC:', fetchError)
      
      // Se a função RPC não existir, tentar método alternativo
      if (fetchError.message?.includes('function') || fetchError.message?.includes('does not exist')) {
        // Fallback: buscar diretamente da tabela (mantém compatibilidade)
        const { data: userData } = await supabase
          .from('pre_approved_users')
          .select('permission_type, empresa')
          .eq('email', user.email!)
          .single()
        
        if (!userData) {
          return NextResponse.json(
            { error: 'Dados do usuário não encontrados' },
            { status: 403 }
          )
        }

        // Verificar permissões
        let canAccess = false
        switch (userData.permission_type) {
          case 'admin':
            canAccess = true
            break
          case 'onsystem':
            canAccess = empresaResponsavel.toLowerCase() === 'onsystem'
            break
          case 'rvs':
            canAccess = empresaResponsavel.toLowerCase() === 'rvs'
            break
          case 'ativa':
            canAccess = empresaResponsavel.toLowerCase() === 'ativa'
            break
        }

        if (!canAccess) {
          return NextResponse.json(
            { error: 'Sem permissão para visualizar choferes desta empresa' },
            { status: 403 }
          )
        }

        // Buscar choferes diretamente
        const { data: chofersData, error: directError } = await supabase
          .from('pre_approved_users')
          .select('nome, email, empresa, area_atuacao')
          .eq('empresa', empresaResponsavel)
          .eq('permission_type', 'chofer')
          .eq('status', 'active')

        if (directError) {
          logger.error('Erro ao buscar choferes diretamente:', directError)
          return NextResponse.json(
            { error: 'Erro ao buscar choferes' },
            { status: 500 }
          )
        }

        chofers = chofersData
      } else {
        return NextResponse.json(
          { error: 'Erro ao buscar choferes' },
          { status: 500 }
        )
      }
    }

    // Filtrar por área de atuação
    const filteredChofers = (chofers || []).filter((chofer: any) => {
      if (!chofer.area_atuacao || !Array.isArray(chofer.area_atuacao)) {
        return false
      }
      
      // Extrair cidade da origem
      const cityMatch = origemLocacao.match(/^([^-]+)/)
      const cardCity = cityMatch ? cityMatch[1].trim().toLowerCase() : origemLocacao.toLowerCase()
      
      return chofer.area_atuacao.some((area: string) => {
        const areaCity = area.toLowerCase()
        return cardCity.includes(areaCity) || 
               areaCity.includes(cardCity) ||
               cardCity === areaCity
      })
    })

    return NextResponse.json({
      chofers: filteredChofers.map((chofer: any) => ({
        name: chofer.nome || chofer.email.split('@')[0],
        email: chofer.email
      }))
    })

  } catch (error) {
    logger.error('Erro na API de choferes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}