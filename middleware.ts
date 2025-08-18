// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

// Constantes inline para evitar imports
const MOBILE_KEYWORDS = [
  'Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'Windows Phone', 
  'BlackBerry', 'webOS', 'Opera Mini', 'Opera Mobi', 'IEMobile',
  'Mobile Safari', 'CriOS', 'FxiOS', 'EdgiOS'
]

const EXCLUDED_PATHS = ['/auth/callback', '/_next', '/api', '/favicon.ico']
const AUTH_ROUTES = ['/auth/signin', '/auth/signup']
const PROTECTED_ROUTES = ['/kanban', '/mobile', '/settings', '/']

// Função helper inline para detectar dispositivo móvel
function isMobileDevice(userAgent: string): boolean {
  return MOBILE_KEYWORDS.some(keyword => userAgent.includes(keyword))
}

// Função helper inline para verificar cookies de sessão
function hasSessionCookies(request: NextRequest): boolean {
  const cookies = request.cookies
  const cookieNames = Array.from(cookies.getAll()).map(c => c.name)
  return cookieNames.some(name => 
    name.includes('sb-') && (name.includes('auth-token') || name.includes('session'))
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Excluir rotas que não devem ser processadas
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const userAgent = request.headers.get('user-agent') || ''
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  )

  // Rate limiting para rotas de autenticação (chamada assíncrona apenas quando necessário)
  if (isAuthRoute && request.method === 'POST') {
    try {
      const response = await fetch(new URL('/api/rate-limit', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
          'x-real-ip': request.headers.get('x-real-ip') || '',
          'user-agent': userAgent
        },
        body: JSON.stringify({ route: pathname })
      })

      const rateLimitResult = await response.json()
      
      if (!rateLimitResult.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Você excedeu o limite de tentativas. Por favor, tente novamente mais tarde.',
            blockedUntil: rateLimitResult.blockedUntil,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.blockedUntil?.toString() || '',
              'Retry-After': rateLimitResult.blockedUntil 
                ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000).toString()
                : '1800',
            },
          }
        )
      }
    } catch (error) {
      // Em caso de erro na API, continuar sem rate limiting
      console.error('Rate limit API error:', error)
    }
  }

  // Verificação rápida de cookies para determinar se tem sessão
  const hasQuickSession = hasSessionCookies(request)

  // Redirecionar rota raiz
  if (pathname === '/') {
    if (!hasQuickSession) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    const redirectRoute = isMobileDevice(userAgent) ? '/mobile' : '/kanban'
    return NextResponse.redirect(new URL(redirectRoute, request.url))
  }

  // Para rotas protegidas, fazer verificação rápida primeiro
  if (isProtectedRoute && !hasQuickSession) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirecionar de rotas de auth se já tem cookies de sessão
  if (isAuthRoute && hasQuickSession) {
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