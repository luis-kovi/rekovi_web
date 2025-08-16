// utils/auth-validation.ts
import { createClient } from '@/utils/supabase/client'

export interface PreApprovedUser {
  email: string
  permission_type: string
  status: 'active' | 'inactive'
  empresa: string
  area_atuacao: string[] // JSONB format
}

/**
 * Valida se o usuário pode acessar o sistema usando a função RPC segura (client-side)
 */
export async function validateUserAccess(email: string): Promise<{
  canAccess: boolean
  message?: string
  userData?: PreApprovedUser
}> {
  const supabase = createClient()
  if (!supabase || !email) {
    return { canAccess: false, message: 'Erro de configuração do cliente.' }
  }

  // Chamando a função SQL segura via RPC em vez de um SELECT direto
  const { data, error } = await supabase.rpc('is_user_preapproved', {
    email_to_check: email
  });

  if (error) {
    console.error('Erro na validação de acesso via RPC:', error)
    return { canAccess: false, message: 'Erro ao verificar permissão. Tente novamente.' }
  }

  const userDataFromRPC = {
    email: email, // O e-mail que passamos
    permission_type: data.permission_type,
    status: data.status,
    empresa: data.empresa,
    area_atuacao: data.area_atuacao
  }

  if (data.status === 'not_found') {
    return {
      canAccess: false,
      message: "Usuário não cadastrado, consulte o administrador do sistema"
    }
  }

  if (data.status !== 'active') {
    return {
      canAccess: false,
      message: "Usuário desativado, consulte o administrador do sistema"
    }
  }

  return {
    canAccess: true,
    userData: userDataFromRPC as PreApprovedUser
  }
}


// As funções abaixo podem ser mantidas como estão, pois operam em dados já carregados
// e não fazem novas chamadas diretas que o RLS bloquearia.

/**
 * Filtra cards baseado nas permissões do usuário
 */
export function filterCardsByPermissions(
  cards: any[], 
  userData: PreApprovedUser
): any[] {
  const { permission_type, empresa, area_atuacao } = userData

  let filteredCards = cards

  // Filtrar por empresa (exceto para Kovi que pode ver todos)
  if (permission_type.toLowerCase() !== 'kovi' && permission_type.toLowerCase() !== 'admin') {
    filteredCards = filteredCards.filter(card => 
      card.empresaResponsavel?.toLowerCase() === empresa.toLowerCase()
    )
  }

  // Filtrar por área de atuação (cidade de origem)
  if (area_atuacao && area_atuacao.length > 0) {
    filteredCards = filteredCards.filter(card => {
      if (!card.origemLocacao) return false
      
      const cardCity = extractCityFromOrigin(card.origemLocacao).toLowerCase()
      
      return area_atuacao.some(area => {
        const areaCity = area.toLowerCase()
        return cardCity.includes(areaCity) || 
               areaCity.includes(cardCity) ||
               cardCity === areaCity
      })
    })
  }

  return filteredCards
}

/**
 * Extrai a cidade do endereço de origem
 */
export function extractCityFromOrigin(origem: string): string {
  if (!origem) return ''
  
  const patterns = [
    /^([^-]+)\s*-\s*[A-Z]{2}$/i,
    /^([^/]+)\s*\/\s*[A-Z]{2}$/i,
    /^([^,]+)\s*,\s*[A-Z]{2}$/i,
    /^([^-,/]+)/i
  ]
  
  for (const pattern of patterns) {
    const match = origem.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }
  
  return origem.trim()
}
