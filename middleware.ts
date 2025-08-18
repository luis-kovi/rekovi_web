// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/utils/rate-limiter'

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

// Função assíncrona para validar sessão com o servidor Supabase
async function validateSupabaseSession(request: NextRequest): Promise<boolean> {
  try {
    // Importar createServerClient dinamicamente para evitar problemas no Edge Runtime
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )
    
    const { data: { session }, error } = await supabase.auth.getSession()
    return !error && !!session
  } catch {
    // Em caso de erro, verificar apenas os cookies como fallback
    return hasSupabaseSession(request)
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Excluir rotas que não devem ser processadas pelo middleware
  const excludedPaths = ['/auth/callback', '/_next', '/api', '/favicon.ico']
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Aplicar rate limiting em rotas de autenticação
  const authRoutesForRateLimit = ['/auth/signin', '/auth/signup']
  const isAuthRouteForRateLimit = authRoutesForRateLimit.some(route => pathname.startsWith(route))
  
  if (isAuthRouteForRateLimit && request.method === 'POST') {
    const rateLimitResult = checkRateLimit(request, pathname)
    
    if (!rateLimitResult.allowed) {
      const response = new NextResponse(
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
      return response
    }
  }

  const userAgent = request.headers.get('user-agent') || ''
  
  // Para rotas protegidas, fazer validação completa da sessão
  const protectedRoutes = ['/kanban', '/mobile', '/settings', '/']
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)))
  
  // Para rotas de autenticação, verificar apenas cookies para melhor performance
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  let hasSession = false
  
  // Para rotas protegidas, validar sessão com o servidor
  if (isProtectedRoute || pathname === '/') {
    hasSession = await validateSupabaseSession(request)
  } else {
    // Para outras rotas, verificar apenas cookies
    hasSession = hasSupabaseSession(request)
  }

  // Redirecionar rota raiz (/) baseado na autenticação
  if (pathname === '/') {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    const redirectRoute = getRedirectRoute(userAgent)
    return NextResponse.redirect(new URL(redirectRoute, request.url))
  }

  // Proteger rotas que requerem autenticação
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirecionar de rotas de auth se já autenticado
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