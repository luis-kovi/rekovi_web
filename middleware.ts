// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

// Função helper para detectar dispositivo móvel
function isMobileDevice(userAgent: string): boolean {
  return /Mobile|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|webOS|Opera Mini|IEMobile/i.test(userAgent)
}

// Função para verificar se tem session cookie do Supabase
function hasSupabaseSession(request: NextRequest): boolean {
  const cookies = request.cookies
  
  // Verificar os padrões de cookie do Supabase
  const cookieNames = Array.from(cookies.getAll()).map(c => c.name)
  return cookieNames.some(name => 
    name.includes('sb-') && (name.includes('auth-token') || name.includes('session'))
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Excluir rotas que não devem ser processadas pelo middleware
  if (pathname.startsWith('/auth/callback') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const userAgent = request.headers.get('user-agent') || ''
  const hasSession = hasSupabaseSession(request)
  
  // Rotas que requerem autenticação
  const protectedRoutes = ['/kanban', '/mobile', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Rotas de autenticação
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Redirecionar rota raiz (/) baseado na autenticação
  if (pathname === '/') {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    const redirectRoute = isMobileDevice(userAgent) ? '/mobile' : '/kanban'
    return NextResponse.redirect(new URL(redirectRoute, request.url))
  }

  // Proteger rotas que requerem autenticação
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirecionar de rotas de auth se já autenticado
  if (isAuthRoute && hasSession) {
    const redirectRoute = isMobileDevice(userAgent) ? '/mobile' : '/kanban'
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