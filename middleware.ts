// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

// Função helper para detectar dispositivo móvel
function isMobileDevice(userAgent: string): boolean {
  const mobileKeywords = [
    'Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'Windows Phone', 
    'BlackBerry', 'webOS', 'Opera Mini', 'Opera Mobi', 'IEMobile',
    'Mobile Safari', 'CriOS', 'FxiOS', 'EdgiOS'
  ];
  
  return mobileKeywords.some(keyword => 
    userAgent.includes(keyword)
  );
}

// Função para determinar a rota de redirecionamento
function getRedirectRoute(userAgent: string): string {
  return isMobileDevice(userAgent) ? '/mobile' : '/kanban';
}

// Função para verificar se tem session cookie do Supabase
function hasSupabaseSession(request: NextRequest): boolean {
  // Verificar se existe algum cookie de sessão do Supabase
  const cookies = request.cookies
  const authToken = cookies.get('sb-auth-token')
  const accessToken = cookies.get('sb-access-token')
  
  // Verificar os novos padrões de cookie do Supabase
  const cookieNames = Array.from(cookies.getAll()).map(c => c.name)
  const hasSessionCookie = cookieNames.some(name => 
    name.includes('sb-') && (name.includes('auth-token') || name.includes('session'))
  )
  
  return !!(authToken || accessToken || hasSessionCookie)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Excluir rotas que não devem ser processadas pelo middleware
  const excludedPaths = ['/auth/callback', '/_next', '/api', '/favicon.ico']
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const hasSession = hasSupabaseSession(request)
  const userAgent = request.headers.get('user-agent') || ''

  // Redirecionar rota raiz (/) baseado na autenticação
  if (pathname === '/') {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    const redirectRoute = getRedirectRoute(userAgent)
    return NextResponse.redirect(new URL(redirectRoute, request.url))
  }

  // Rotas que requerem autenticação
  const protectedRoutes = ['/kanban', '/mobile', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Rotas de autenticação - redirecionar se já autenticado
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isAuthRoute && hasSession) {
    const redirectRoute = getRedirectRoute(userAgent)
    return NextResponse.redirect(new URL(redirectRoute, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}