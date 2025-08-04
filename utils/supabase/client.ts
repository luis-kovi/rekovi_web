// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Durante o build, retornar null sem verificar variáveis
  if (typeof window === 'undefined') {
    return null as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug para verificar as variáveis
  console.log('Debug - Supabase URL:', supabaseUrl)
  console.log('Debug - Supabase Key:', supabaseKey ? 'Presente' : 'Ausente')

  // Se as variáveis não estiverem disponíveis, tentar usar valores padrão
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    console.error('URL:', supabaseUrl)
    console.error('Key:', supabaseKey ? 'Presente' : 'Ausente')
    
    // Retornar null para evitar erros
    return null as any
  }

  try {
    const client = createBrowserClient(supabaseUrl, supabaseKey)
    console.log('Supabase client created successfully')
    return client
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    return null as any
  }
}
