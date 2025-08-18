import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

// Mock do NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({
      cookies: {
        set: jest.fn(),
      },
    })),
    redirect: jest.fn((url: URL) => ({
      url: url.toString(),
    })),
  },
  NextRequest: jest.requireActual('next/server').NextRequest,
}))

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (url: string, cookies: Record<string, string> = {}) => {
    const request = new NextRequest(new URL(url, 'http://localhost:3000'))
    
    // Adicionar cookies
    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value)
    })
    
    return request
  }

  describe('Rotas excluídas', () => {
    it('deve permitir acesso ao callback de autenticação', async () => {
      const request = createRequest('/auth/callback')
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('deve permitir acesso a recursos estáticos', async () => {
      const staticPaths = ['/_next/static/file.js', '/api/test', '/favicon.ico']
      
      for (const path of staticPaths) {
        jest.clearAllMocks()
        const request = createRequest(path)
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
      }
    })
  })

  describe('Rota raiz (/)', () => {
    it('deve redirecionar para /auth/signin quando não autenticado', async () => {
      const request = createRequest('/')
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/auth/signin', 'http://localhost:3000')
      )
    })

    it('deve redirecionar para /kanban quando autenticado (desktop)', async () => {
      const request = createRequest('/', { 'sb-auth-token': 'valid-token' })
      ;(request as any).headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0)')
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/kanban', 'http://localhost:3000')
      )
    })

    it('deve redirecionar para /mobile quando autenticado (mobile)', async () => {
      const request = createRequest('/', { 'sb-auth-token': 'valid-token' })
      ;(request as any).headers.set('user-agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)')
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/mobile', 'http://localhost:3000')
      )
    })
  })

  describe('Rotas protegidas', () => {
    const protectedRoutes = ['/kanban', '/mobile', '/settings']
    
    protectedRoutes.forEach(route => {
      it(`deve redirecionar ${route} para login quando não autenticado`, async () => {
        const request = createRequest(route)
        await middleware(request)
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          new URL('/auth/signin', 'http://localhost:3000')
        )
      })

      it(`deve permitir acesso a ${route} quando autenticado`, async () => {
        const request = createRequest(route, { 'sb-auth-token': 'valid-token' })
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
      })
    })
  })

  describe('Rotas de autenticação', () => {
    const authRoutes = ['/auth/signin', '/auth/signup']
    
    authRoutes.forEach(route => {
      it(`deve permitir acesso a ${route} quando não autenticado`, async () => {
        const request = createRequest(route)
        await middleware(request)
        
        expect(NextResponse.next).toHaveBeenCalled()
        expect(NextResponse.redirect).not.toHaveBeenCalled()
      })

      it(`deve redirecionar ${route} quando já autenticado (desktop)`, async () => {
        const request = createRequest(route, { 'sb-auth-token': 'valid-token' })
        ;(request as any).headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0)')
        
        await middleware(request)
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          new URL('/kanban', 'http://localhost:3000')
        )
      })

      it(`deve redirecionar ${route} quando já autenticado (mobile)`, async () => {
        const request = createRequest(route, { 'sb-auth-token': 'valid-token' })
        ;(request as any).headers.set('user-agent', 'Mozilla/5.0 (iPhone)')
        
        await middleware(request)
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          new URL('/mobile', 'http://localhost:3000')
        )
      })
    })
  })

  describe('Detecção de sessão', () => {
    it('deve detectar sessão com sb-auth-token', async () => {
      const request = createRequest('/kanban', { 'sb-auth-token': 'valid' })
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('deve detectar sessão com sb-access-token', async () => {
      const request = createRequest('/kanban', { 'sb-access-token': 'valid' })
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('deve detectar sessão com cookies de sessão do Supabase', async () => {
      const request = createRequest('/kanban', { 
        'sb-localhost-auth-token': 'valid',
        'sb-localhost-session': 'valid-session'
      })
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
    })
  })
})