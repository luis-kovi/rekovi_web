// utils/rate-limiter.ts
import { NextRequest } from 'next/server'

interface RateLimitStore {
  attempts: number
  firstAttempt: number
  blockedUntil?: number
}

// Armazenamento em memória para rate limiting
// Em produção, considere usar Redis ou similar
const rateLimitStore = new Map<string, RateLimitStore>()

// Configurações de rate limiting
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5, // Máximo de tentativas
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  blockDurationMs: 30 * 60 * 1000, // Bloquear por 30 minutos após exceder limite
  cleanupIntervalMs: 60 * 60 * 1000, // Limpar entradas antigas a cada hora
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

/**
 * Obtém um identificador único para o cliente
 */
function getClientIdentifier(request: NextRequest): string {
  // Tentar obter o IP real do cliente
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  // Adicionar user agent para melhor identificação
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = simpleHash(userAgent)
  
  return `${ip}-${userAgentHash}`
}

/**
 * Hash simples para user agent
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Verifica se o cliente está dentro do limite de rate
 */
export function checkRateLimit(request: NextRequest, route: string): {
  allowed: boolean
  remainingAttempts?: number
  resetTime?: number
  blockedUntil?: number
} {
  const clientId = getClientIdentifier(request)
  const key = `${clientId}:${route}`
  const now = Date.now()
  
  const data = rateLimitStore.get(key)
  
  // Se não há dados, primeira tentativa
  if (!data) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttempt: now,
    })
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    }
  }
  
  // Se está bloqueado
  if (data.blockedUntil && now < data.blockedUntil) {
    return {
      allowed: false,
      blockedUntil: data.blockedUntil,
      remainingAttempts: 0,
    }
  }
  
  // Se a janela de tempo expirou, resetar
  if (now - data.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttempt: now,
    })
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    }
  }
  
  // Incrementar tentativas
  data.attempts++
  
  // Se excedeu o limite, bloquear
  if (data.attempts > RATE_LIMIT_CONFIG.maxAttempts) {
    data.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs
    rateLimitStore.set(key, data)
    return {
      allowed: false,
      blockedUntil: data.blockedUntil,
      remainingAttempts: 0,
    }
  }
  
  // Atualizar dados
  rateLimitStore.set(key, data)
  
  return {
    allowed: true,
    remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - data.attempts,
    resetTime: data.firstAttempt + RATE_LIMIT_CONFIG.windowMs,
  }
}

/**
 * Reseta o rate limit para um cliente específico (útil após login bem-sucedido)
 */
export function resetRateLimit(request: NextRequest, route: string): void {
  const clientId = getClientIdentifier(request)
  const key = `${clientId}:${route}`
  rateLimitStore.delete(key)
}

// Declaração global para TypeScript
declare global {
  var rateLimitCleanupInterval: NodeJS.Timeout | undefined
}