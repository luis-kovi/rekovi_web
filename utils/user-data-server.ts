// utils/user-data-server.ts
import { createClient } from '@/utils/supabase/server'
import { PreApprovedUser } from '@/utils/auth-validation'
import { logger } from '@/utils/logger'

/**
 * Versão server-side para obter dados do usuário
 */
export async function getUserDataServer(email: string): Promise<PreApprovedUser | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pre_approved_users')
    .select('email, permission_type, status, empresa, area_atuacao')
    .eq('email', email)
    .single()

  if (error || !data) {
    logger.error('Erro ao buscar dados do usuário (server):', error)
    return null
  }

  return data
}
