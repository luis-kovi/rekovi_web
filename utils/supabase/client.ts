// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { logger } from '@/utils/logger'

export function createClient() {
  // Durante o build, retornar null sem verificar variáveis
  if (typeof window === 'undefined') {
    return null as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Se as variáveis não estiverem disponíveis, lançar erro
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase environment variables are missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  try {
    const client = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce'
      }
    })
    return client
  } catch (error) {
    logger.error('Error creating Supabase client:', error)
    throw new Error('Failed to create Supabase client. Please check your configuration.')
  }
}