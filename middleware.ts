// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getRedirectRoute } from '@/utils/helpers'

export async function middleware(request: NextRequest) {
  // Excluir explicitamente o callback de autenticação para evitar interferências
  if (request.nextUrl.pathname === '/auth/callback') {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificar se o usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser()

  // Redirecionar rota raiz (/) para /auth/signin se não autenticado
  if (request.nextUrl.pathname === '/' && !user) {
    const redirectUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Se o usuário estiver autenticado e acessar a rota raiz, redirecionar baseado no dispositivo
  if (request.nextUrl.pathname === '/' && user) {
    const userAgent = request.headers.get('user-agent') || ''
    const redirectRoute = getRedirectRoute(userAgent)
    const redirectUrl = new URL(redirectRoute, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Rotas que requerem autenticação
  const protectedRoutes = ['/kanban', '/mobile', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Se for uma rota protegida e o usuário não estiver autenticado
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Se o usuário estiver autenticado e tentar acessar páginas de auth (exceto callback)
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && user) {
    const userAgent = request.headers.get('user-agent') || ''
    const redirectRoute = getRedirectRoute(userAgent)
    const redirectUrl = new URL(redirectRoute, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
    * Corresponde a todas as rotas, exceto as de ficheiros estáticos e de otimização de imagem.
    */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}