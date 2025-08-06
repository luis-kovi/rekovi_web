// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getRedirectRoute } from '@/utils/helpers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userAgent = request.headers.get('user-agent') || ''
  const defaultRoute = getRedirectRoute(userAgent)
  const next = searchParams.get('next') || defaultRoute
  const error_description = searchParams.get('error_description')
  const error = searchParams.get('error')

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  // Se houve erro na autorização do OAuth
  if (error) {
    console.error('Erro OAuth:', error, error_description)
    return NextResponse.redirect(`${origin}/auth/signin?error=oauth_error`)
  }

  if (code) {
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
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Erro ao definir cookie:', error)
            }
          },
          remove(name: string, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Erro ao remover cookie:', error)
            }
          },
        },
      }
    )
    
    const { data: session, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError && session?.user) {
      console.log('Login Google bem-sucedido para usuário:', session.user.email)
      // Redirecionar para a página especificada baseado no dispositivo
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Erro ao trocar código por sessão:', exchangeError?.message)
      // Em caso de erro na troca, redirecionar com erro específico
      return NextResponse.redirect(`${origin}/auth/signin?error=session_error`)
    }
  }

  console.error('Código de autorização não encontrado.')
  return NextResponse.redirect(`${origin}/auth/signin?error=no_code`)
}