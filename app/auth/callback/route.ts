// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

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
      // Verificar se o usuário está cadastrado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Verificar se o usuário tem permissão cadastrada
        const permissionType = user.app_metadata?.permissionType?.toLowerCase()
        
        if (!permissionType || permissionType === 'default') {
          // Usuário não cadastrado - redirecionar para login com mensagem
          return NextResponse.redirect(`${origin}/?error=unauthorized`)
        }
        
        // Usuário válido - verificar dispositivo e redirecionar adequadamente
        const userAgent = request.headers.get('user-agent') || ''
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
        
        if (isMobile) {
          return NextResponse.redirect(`${origin}/mobile`)
        } else {
          return NextResponse.redirect(`${origin}/kanban`)
        }
      }
    }
  }

  console.error('Erro no callback de autenticação ou código não encontrado.');
  return NextResponse.redirect(`${origin}/`)
}