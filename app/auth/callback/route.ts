// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers' // Importamos diretamente de 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/kanban'

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  if (code) {
    // A forma correta de criar o cookie store para a rota
    const cookieStore = cookies() 
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Passamos a referência da função diretamente
          get: async (name) => (await cookieStore).get(name)?.value,
          set: async (name, value, options) => (await cookieStore).set({ name, value, ...options }),
          remove: async (name, options) => (await cookieStore).delete({ name, ...options }),
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  console.error('Erro no callback de autenticação ou código não encontrado.');
  return NextResponse.redirect(`${origin}/`)
}