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

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

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
              // O `set` pode falhar em Server Actions
            }
          },
          remove(name: string, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // O `delete` pode falhar em Server Actions
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Redirecionar para a página especificada ou /kanban
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  console.error('Erro no callback de autenticação ou código não encontrado.')
  return NextResponse.redirect(`${origin}/auth/signin`)
}