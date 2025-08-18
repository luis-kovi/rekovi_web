// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { getRedirectRoute } from '@/utils/helpers'

export async function middleware(request: NextRequest) {
  // Excluir explicitamente o callback de autenticação para evitar interferências
  if (request.nextUrl.pathname === '/auth/callback') {
    return NextResponse.next()
  }

  // Simplificar o middleware para Edge Runtime - verificar apenas cookies de autenticação
  const authCookie = request.cookies.get('sb-vfawknsthphhqfsvafzz-auth-token')
  const hasAuth = !!authCookie?.value

  // Redirecionar rota raiz (/) para /auth/signin se não autenticado
  if (request.nextUrl.pathname === '/' && !hasAuth) {
    const redirectUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Se o usuário estiver autenticado e acessar a rota raiz, redirecionar baseado no dispositivo
  if (request.nextUrl.pathname === '/' && hasAuth) {
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
  if (isProtectedRoute && !hasAuth) {
    const redirectUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Se o usuário estiver autenticado e tentar acessar páginas de auth (exceto callback)
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && hasAuth) {
    const userAgent = request.headers.get('user-agent') || ''
    const redirectRoute = getRedirectRoute(userAgent)
    const redirectUrl = new URL(redirectRoute, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
    * Corresponde a todas as rotas, exceto as de ficheiros estáticos e de otimização de imagem.
    */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}