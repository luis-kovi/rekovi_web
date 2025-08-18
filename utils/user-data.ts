// utils/user-data.ts
import { createClient } from '@/utils/supabase/client'
import { PreApprovedUser } from '@/utils/auth-validation'
import { logger } from '@/utils/logger'

/**
 * Obtém os dados completos do usuário da tabela pre_approved_users
 * Para usar nas páginas após o login (client-side)
 */
export async function getUserData(email: string): Promise<PreApprovedUser | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('pre_approved_users')
    .select('email, permission_type, status, empresa, area_atuacao')
    .eq('email', email)
    .single()

  if (error || !data) {
    logger.error('Erro ao buscar dados do usuário:', error)
    return null
  }

  return data
}



/**
 * Obtém os dados do usuário logado com fallback para metadata
 */
export async function getCurrentUserData(): Promise<{
  user: any
  userData: PreApprovedUser | null
}> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    return { user: null, userData: null }
  }

  const userData = await getUserData(user.email)
  
  return { user, userData }
}
