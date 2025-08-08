// utils/auth-validation-server.ts
import { createClient } from '@/utils/supabase/server'
import { PreApprovedUser } from './auth-validation'

/**
 * Versão server-side para buscar informações do usuário
 */
export async function getPreApprovedUserServer(email: string): Promise<PreApprovedUser | null> {
  const supabase = await createClient()
  
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
