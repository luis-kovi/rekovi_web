// utils/supabase/client-auth.ts
import { createBrowserClient } from '@supabase/ssr'

export function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Detectar Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  
  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      storage: {
        // Usar localStorage como fallback para Safari
        getItem: (key: string) => {
          if (isSafari) {
            // Tentar localStorage primeiro no Safari
            const localStorageValue = localStorage.getItem(key)
            if (localStorageValue) return localStorageValue
          }
          
          // Tentar cookies para outros navegadores
          const cookies = document.cookie.split('; ')
          const cookie = cookies.find(row => row.startsWith(`${key}=`))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
        },
        setItem: (key: string, value: string) => {
          if (isSafari) {
            // Usar localStorage no Safari
            localStorage.setItem(key, value)
          }
          
          // Também definir como cookie
          const maxAge = 60 * 60 * 24 * 7 // 7 dias
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${
            window.location.protocol === 'https:' ? '; Secure' : ''
          }`
        },
        removeItem: (key: string) => {
          if (isSafari) {
            localStorage.removeItem(key)
          }
          
          // Remover cookie
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
        }
      }
    },
    cookies: {
      // Configurações de cookies para melhor compatibilidade
      get(name: string) {
        const cookies = document.cookie.split('; ')
        const cookie = cookies.find(row => row.startsWith(`${name}=`))
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
      },
      set(name: string, value: string, options?: any) {
        let cookieString = `${name}=${encodeURIComponent(value)}`
        
        if (options?.maxAge) {
          cookieString += `; max-age=${options.maxAge}`
        }
        if (options?.path) {
          cookieString += `; path=${options.path}`
        }
        
        // Configurações importantes para Safari
        cookieString += '; SameSite=Lax'
        
        if (window.location.protocol === 'https:') {
          cookieString += '; Secure'
        }
        
        document.cookie = cookieString
      },
      remove(name: string, options?: any) {
        document.cookie = `${name}=; path=${options?.path || '/'}; expires=Thu, 01 Jan 1970 00:00:01 GMT`
      }
    }
  })
}