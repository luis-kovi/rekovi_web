// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getRedirectRoute } from '@/utils/helpers'
import { validateUserAccessServer } from '@/utils/auth-validation-server'

export async function GET(request: NextRequest) {
  console.log('🔄 Callback iniciado - URL:', request.url)
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userAgent = request.headers.get('user-agent') || ''
  const defaultRoute = getRedirectRoute(userAgent)
  const next = searchParams.get('next') || defaultRoute
  const error_description = searchParams.get('error_description')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  console.log('📋 Parâmetros recebidos:', { code: !!code, error, next, state })

  // Se houve erro na autorização do OAuth
  if (error) {
    console.error('❌ Erro OAuth:', error, error_description)
    return NextResponse.redirect(`${origin}/auth/signin?error=oauth_error`)
  }

  if (!code) {
    console.error('❌ Código de autorização não encontrado')
    return NextResponse.redirect(`${origin}/auth/signin?error=no_code`)
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            try {
              // Melhorar configurações de cookies para resolver problemas de primeira tentativa
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
              }
              cookieStore.set({ name, value, ...cookieOptions })
            } catch (error) {
              console.error('⚠️ Erro ao definir cookie:', error)
            }
          },
          remove(name: string, options) {
            try {
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
              }
              cookieStore.set({ name, value: '', ...cookieOptions })
            } catch (error) {
              console.error('⚠️ Erro ao remover cookie:', error)
            }
          },
        },
      }
    )
    
    console.log('🔄 Iniciando troca de código por sessão...')
    const { data: session, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Erro ao trocar código por sessão:', exchangeError.message)
      console.error('❌ Detalhes do erro:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/signin?error=session_error`)
    }

    if (!session?.user) {
      console.error('❌ Sessão ou usuário não encontrados após troca')
      return NextResponse.redirect(`${origin}/auth/signin?error=session_error`)
    }

    console.log('✅ Login Google bem-sucedido para usuário:', session.user.email)
    
    // Validar se o usuário está autorizado na tabela pre_approved_users
    if (session.user.email) {
      console.log('🔄 Validando autorização do usuário...')
      const validation = await validateUserAccessServer(session.user.email)
      
      if (!validation.canAccess) {
        console.log('❌ Usuário Google não autorizado:', session.user.email, 'Motivo:', validation.message)
        // Fazer logout da sessão criada
        await supabase.auth.signOut()
        // Redirecionar com erro específico
        const errorMessage = validation.message === "Usuário não cadastrado, consulte o administrador do sistema" 
          ? 'user_not_registered' 
          : 'user_inactive'
        return NextResponse.redirect(`${origin}/auth/signin?error=${errorMessage}`)
      }
      
      console.log('✅ Usuário autorizado:', session.user.email)
    }
    
    // Se passou na validação, redirecionar para a página especificada
    console.log('🎯 Redirecionando para:', next)
    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error('❌ Erro inesperado no callback:', error)
    return NextResponse.redirect(`${origin}/auth/signin?error=session_error`)
  }
}