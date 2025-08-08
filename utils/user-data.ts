// utils/user-data.ts
import { createClient } from '@/utils/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { PreApprovedUser } from '@/utils/auth-validation'

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
    console.error('Erro ao buscar dados do usuário:', error)
    return null
  }

  return data
}

/**
 * Versão server-side para obter dados do usuário
 */
export async function getUserDataServer(email: string): Promise<PreApprovedUser | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('pre_approved_users')
    .select('email, permission_type, status, empresa, area_atuacao')
    .eq('email', email)
    .single()

  if (error || !data) {
    console.error('Erro ao buscar dados do usuário (server):', error)
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
