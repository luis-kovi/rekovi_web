// app/auth/callback-v2/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getRedirectRoute } from '@/utils/helpers'
import { validateUserAccessServer } from '@/utils/auth-validation-server'

export async function GET(request: NextRequest) {
  console.log('🔄 Callback V2 iniciado - URL:', request.url)
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const userAgent = request.headers.get('user-agent') || ''
  const defaultRoute = getRedirectRoute(userAgent)
  const next = searchParams.get('next') || defaultRoute
  const error = searchParams.get('error')

  console.log('📋 Parâmetros recebidos V2:', { code: !!code, error, next })

  // Se houve erro na autorização do OAuth
  if (error) {
    console.error('❌ Erro OAuth V2:', error)
    return NextResponse.redirect(`${origin}/auth/signin?error=oauth_error`)
  }

  if (!code) {
    console.error('❌ Código de autorização não encontrado V2')
    return NextResponse.redirect(`${origin}/auth/signin?error=no_code`)
  }

  try {
    const cookieStore = await cookies()
    
    // Criar cliente Supabase com configurações mais específicas
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value
            console.log(`📦 Cookie get: ${name} = ${value ? 'exists' : 'missing'}`)
            return value
          },
          set(name: string, value: string, options) {
            console.log(`📦 Cookie set: ${name}`)
            try {
              cookieStore.set({ 
                name, 
                value, 
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 dias
              })
            } catch (error) {
              console.error('⚠️ Erro ao definir cookie V2:', error)
            }
          },
          remove(name: string, options) {
            console.log(`📦 Cookie remove: ${name}`)
            try {
              cookieStore.set({ 
                name, 
                value: '', 
                ...options,
                maxAge: 0
              })
            } catch (error) {
              console.error('⚠️ Erro ao remover cookie V2:', error)
            }
          },
        },
      }
    )
    
    console.log('🔄 Iniciando troca de código por sessão V2...')
    
    // Trocar código por sessão
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Erro ao trocar código por sessão V2:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/signin?error=session_error`)
    }

    if (!data?.session) {
      console.error('❌ Sessão não criada V2')
      return NextResponse.redirect(`${origin}/auth/signin?error=session_error`)
    }

    console.log('✅ Sessão criada V2:', data.session.user.email)
    
    // Validar acesso do usuário
    if (data.session.user.email) {
      const validation = await validateUserAccessServer(data.session.user.email)
      
      if (!validation.canAccess) {
        console.log('❌ Usuário não autorizado V2:', validation.message)
        await supabase.auth.signOut()
        const errorType = validation.message?.includes("não cadastrado") 
          ? 'user_not_registered' 
          : 'user_inactive'
        return NextResponse.redirect(`${origin}/auth/signin?error=${errorType}`)
      }
    }
    
    // Criar resposta de redirecionamento
    const response = NextResponse.redirect(`${origin}${next}`)
    
    // Garantir que os cookies sejam configurados corretamente
    const sessionCookies = cookieStore.getAll()
    console.log('🍪 Total de cookies após login:', sessionCookies.length)
    
    // Adicionar delay pequeno para garantir que os cookies sejam salvos
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return response
    
  } catch (error) {
    console.error('❌ Erro inesperado no callback V2:', error)
    return NextResponse.redirect(`${origin}/auth/signin?error=session_error`)
  }
}