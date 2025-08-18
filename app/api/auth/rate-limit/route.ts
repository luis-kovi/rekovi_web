// app/api/auth/rate-limit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, resetRateLimit } from '@/utils/rate-limiter'

export async function POST(request: NextRequest) {
  const { pathname, action } = await request.json()
  
  if (action === 'reset') {
    resetRateLimit(request, pathname)
    return NextResponse.json({ success: true })
  }
  
  const result = checkRateLimit(request, pathname)
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Você excedeu o limite de tentativas. Por favor, tente novamente mais tarde.',
        blockedUntil: result.blockedUntil,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.blockedUntil?.toString() || '',
          'Retry-After': result.blockedUntil 
            ? Math.ceil((result.blockedUntil - Date.now()) / 1000).toString()
            : '1800',
        },
      }
    )
  }
  
  return NextResponse.json({
    allowed: true,
    remainingAttempts: result.remainingAttempts,
    resetTime: result.resetTime,
  })
}