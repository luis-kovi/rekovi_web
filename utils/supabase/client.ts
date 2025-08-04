// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Durante o build, as variáveis podem não estar disponíveis
  if (typeof window === 'undefined') {
    // Server-side: retornar um cliente mock ou null
    return null as any
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables')
    return null as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
