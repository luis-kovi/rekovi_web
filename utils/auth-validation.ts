// utils/auth-validation.ts
import { createClient } from '@/utils/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'

export interface PreApprovedUser {
  email: string
  permission_type: string
  status: 'active' | 'inactive'
  empresa: string
  area_atuacao: string[] // JSONB format
}

/**
 * Busca informações do usuário na tabela pre_approved_users (client-side)
 */
export async function getPreApprovedUser(email: string): Promise<PreApprovedUser | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('pre_approved_users')
    .select('email, permission_type, status, empresa, area_atuacao')
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Versão server-side para buscar informações do usuário
 */
export async function getPreApprovedUserServer(email: string): Promise<PreApprovedUser | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('pre_approved_users')
    .select('email, permission_type, status, empresa, area_atuacao')
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Valida se o usuário pode acessar o sistema (client-side)
 */
export async function validateUserAccess(email: string): Promise<{
  canAccess: boolean
  message?: string
  userData?: PreApprovedUser
}> {
  const userData = await getPreApprovedUser(email)

  if (!userData) {
    return {
      canAccess: false,
      message: "Usuário não cadastrado, consulte o administrador do sistema"
    }
  }

  if (userData.status !== 'active') {
    return {
      canAccess: false,
      message: "Usuário desativado, consulte o administrador do sistema"
    }
  }

  return {
    canAccess: true,
    userData
  }
}

/**
 * Valida se o usuário pode acessar o sistema (server-side)
 */
export async function validateUserAccessServer(email: string): Promise<{
  canAccess: boolean
  message?: string
  userData?: PreApprovedUser
}> {
  const userData = await getPreApprovedUserServer(email)

  if (!userData) {
    return {
      canAccess: false,
      message: "Usuário não cadastrado, consulte o administrador do sistema"
    }
  }

  if (userData.status !== 'active') {
    return {
      canAccess: false,
      message: "Usuário desativado, consulte o administrador do sistema"
    }
  }

  return {
    canAccess: true,
    userData
  }
}

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
  if (permission_type.toLowerCase() !== 'kovi') {
    filteredCards = filteredCards.filter(card => 
      card.empresaResponsavel?.toLowerCase() === empresa.toLowerCase()
    )
  }

  // Filtrar por área de atuação (cidade de origem)
  // Usar origemLocacao como cidade de origem do card
  if (area_atuacao && area_atuacao.length > 0) {
    filteredCards = filteredCards.filter(card => {
      if (!card.origemLocacao) return false
      
      // Verificar se a cidade de origem do card está na área de atuação
      const cardOrigem = card.origemLocacao.toLowerCase()
      return area_atuacao.some(area => 
        cardOrigem.includes(area.toLowerCase()) || 
        area.toLowerCase().includes(cardOrigem)
      )
    })
  }

  return filteredCards
}

/**
 * Extrai a cidade do endereço de origem
 * Função auxiliar para melhorar matching entre área de atuação e origem
 */
export function extractCityFromOrigin(origem: string): string {
  if (!origem) return ''
  
  // Padrões comuns: "Cidade - Estado", "Cidade/Estado", "Cidade, Estado"
  const patterns = [
    /^([^-]+)\s*-\s*[A-Z]{2}$/i,  // "São Paulo - SP"
    /^([^/]+)\s*\/\s*[A-Z]{2}$/i, // "São Paulo/SP"
    /^([^,]+)\s*,\s*[A-Z]{2}$/i,  // "São Paulo, SP"
    /^([^-,/]+)/i                 // Primeira parte antes de separadores
  ]
  
  for (const pattern of patterns) {
    const match = origem.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }
  
  return origem.trim()
}

/**
 * Versão melhorada do filtro de cards com extração de cidade
 */
export function filterCardsByPermissionsImproved(
  cards: any[], 
  userData: PreApprovedUser
): any[] {
  const { permission_type, empresa, area_atuacao } = userData

  let filteredCards = cards

  // Filtrar por empresa (exceto para Kovi que pode ver todos)
  if (permission_type.toLowerCase() !== 'kovi') {
    filteredCards = filteredCards.filter(card => 
      card.empresaResponsavel?.toLowerCase() === empresa.toLowerCase()
    )
  }

  // Filtrar por área de atuação com extração melhorada de cidade
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
