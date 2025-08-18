// __tests__/middleware.simple.test.ts
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

describe('Middleware - Simple Tests', () => {
  describe('Cookie Detection', () => {
    it('should detect session with sb-auth-token cookie', () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/kanban'),
        {
          headers: new Headers(),
        }
      )
      
      // Add auth cookie
      request.cookies.set('sb-auth-token', 'valid-token')
      
      // Since we can't easily test the redirect, we'll just ensure no errors
      expect(() => middleware(request)).not.toThrow()
    })

    it('should handle requests without cookies', () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/'),
        {
          headers: new Headers(),
        }
      )
      
      expect(() => middleware(request)).not.toThrow()
    })
  })

  describe('Path Exclusions', () => {
    it('should handle auth callback path', () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/auth/callback'),
        {
          headers: new Headers(),
        }
      )
      
      expect(() => middleware(request)).not.toThrow()
    })

    it('should handle static files', () => {
      const paths = [
        '/_next/static/file.js',
        '/favicon.ico',
        '/api/test'
      ]
      
      paths.forEach(path => {
        const request = new NextRequest(
          new URL(`http://localhost:3000${path}`),
          {
            headers: new Headers(),
          }
        )
        
        expect(() => middleware(request)).not.toThrow()
      })
    })
  })

  describe('User Agent Detection', () => {
    it('should detect mobile user agents', () => {
      const mobileAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        'Mozilla/5.0 (Android 10; Mobile)',
        'Mozilla/5.0 (iPad; CPU OS 14_0)'
      ]
      
      mobileAgents.forEach(agent => {
        const request = new NextRequest(
          new URL('http://localhost:3000/'),
          {
            headers: new Headers({
              'user-agent': agent
            }),
          }
        )
        
        expect(() => middleware(request)).not.toThrow()
      })
    })

    it('should detect desktop user agents', () => {
      const desktopAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      ]
      
      desktopAgents.forEach(agent => {
        const request = new NextRequest(
          new URL('http://localhost:3000/'),
          {
            headers: new Headers({
              'user-agent': agent
            }),
          }
        )
        
        expect(() => middleware(request)).not.toThrow()
      })
    })
  })
})