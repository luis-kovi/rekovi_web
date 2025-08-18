import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  attempts: number
  firstAttempt: number
  blockedUntil?: number
}

// Armazenamento em memória para rate limiting
const rateLimitStore = new Map<string, RateLimitStore>()

// Configurações de rate limiting
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
  cleanupIntervalMs: 60 * 60 * 1000,
}

// Limpar entradas antigas periodicamente
if (typeof globalThis.rateLimitCleanupInterval === 'undefined') {
  globalThis.rateLimitCleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, data] of rateLimitStore.entries()) {
      if (
        now - data.firstAttempt > RATE_LIMIT_CONFIG.windowMs &&
        (!data.blockedUntil || now > data.blockedUntil)
      ) {
        rateLimitStore.delete(key)
      }
    }
  }, RATE_LIMIT_CONFIG.cleanupIntervalMs)
}

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = simpleHash(userAgent)
  
  return `${ip}-${userAgentHash}`
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export async function POST(request: NextRequest) {
  try {
    const { route } = await request.json()
    
    const clientId = getClientIdentifier(request)
    const key = `${clientId}:${route}`
    const now = Date.now()
    
    const data = rateLimitStore.get(key)
    
    // Primeira tentativa
    if (!data) {
      rateLimitStore.set(key, {
        attempts: 1,
        firstAttempt: now,
      })
      return NextResponse.json({
        allowed: true,
        remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - 1,
        resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      })
    }
    
    // Se está bloqueado
    if (data.blockedUntil && now < data.blockedUntil) {
      return NextResponse.json({
        allowed: false,
        blockedUntil: data.blockedUntil,
        remainingAttempts: 0,
      })
    }
    
    // Se a janela de tempo expirou
    if (now - data.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
      rateLimitStore.set(key, {
        attempts: 1,
        firstAttempt: now,
      })
      return NextResponse.json({
        allowed: true,
        remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - 1,
        resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      })
    }
    
    // Incrementar tentativas
    data.attempts++
    
    // Se excedeu o limite
    if (data.attempts > RATE_LIMIT_CONFIG.maxAttempts) {
      data.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs
      rateLimitStore.set(key, data)
      return NextResponse.json({
        allowed: false,
        blockedUntil: data.blockedUntil,
        remainingAttempts: 0,
      })
    }
    
    // Atualizar dados
    rateLimitStore.set(key, data)
    
    return NextResponse.json({
      allowed: true,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - data.attempts,
      resetTime: data.firstAttempt + RATE_LIMIT_CONFIG.windowMs,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Declaração global para TypeScript
declare global {
  var rateLimitCleanupInterval: NodeJS.Timeout | undefined
}