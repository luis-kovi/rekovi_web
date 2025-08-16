// utils/auth-validation-server.ts
import { createClient } from '@/utils/supabase/server'
import { PreApprovedUser } from './auth-validation'

/**
 * Valida se o usuário pode acessar o sistema usando a função RPC segura (server-side)
 */
export async function validateUserAccessServer(email: string): Promise<{
  canAccess: boolean
  message?: string
  userData?: PreApprovedUser
}> {
  const supabase = await createClient()
  if (!supabase || !email) {
    return { canAccess: false, message: 'Erro de configuração do cliente.' };
  }
  
  // A chamada é idêntica à do cliente, usando RPC
  const { data, error } = await supabase.rpc('is_user_preapproved', {
    email_to_check: email
  });

  if (error) {
    console.error('Erro na validação de acesso via RPC (server):', error)
    return { canAccess: false, message: 'Erro ao verificar permissão. Tente novamente.' }
  }

  const userDataFromRPC = {
    email: email,
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
