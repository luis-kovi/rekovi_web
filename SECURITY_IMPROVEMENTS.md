# Implementações de Segurança Recomendadas

## 1. Migração do Token Pipefy para Server-Side

### Passo 1: Remover NEXT_PUBLIC_ do token
```env
# .env.local
PIPEFY_TOKEN=seu_token_aqui  # Sem NEXT_PUBLIC_
```

### Passo 2: Criar API Route Proxy

```typescript
// app/api/pipefy/graphql/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para queries GraphQL
const pipefyQuerySchema = z.object({
  query: z.string(),
  variables: z.record(z.any()).optional()
})

// Rate limiting específico para API Pipefy
const PIPEFY_RATE_LIMIT = {
  requests: 100,
  window: '1m'
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação do usuário
    const session = await validateSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validar body da requisição
    const body = await request.json()
    const validated = pipefyQuerySchema.parse(body)

    // Token seguro no servidor
    const PIPEFY_TOKEN = process.env.PIPEFY_TOKEN
    if (!PIPEFY_TOKEN) {
      console.error('PIPEFY_TOKEN not configured')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    // Fazer requisição para Pipefy
    const response = await fetch('https://api.pipefy.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PIPEFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validated),
    })

    const data = await response.json()

    // Log para auditoria (sem expor token)
    console.log(`Pipefy API called by user: ${session.user.email}`)

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }
    
    console.error('Pipefy API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Passo 3: Atualizar Cliente para Usar Proxy

```typescript
// utils/pipefy-client.ts
export async function pipefyQuery(query: string, variables?: Record<string, any>) {
  const response = await fetch('/api/pipefy/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`Pipefy API error: ${response.statusText}`)
  }

  return response.json()
}
```

## 2. Implementação de CSRF Protection

```typescript
// utils/csrf.ts
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

export async function generateCSRFToken(): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  
  cookieStore.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 horas
  })
  
  return token
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedToken = cookieStore.get('csrf-token')?.value
  
  if (!storedToken || !token) return false
  
  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(token)
  )
}
```

### Middleware CSRF

```typescript
// middleware/csrf.ts
export async function csrfMiddleware(request: NextRequest) {
  // Apenas verificar CSRF em métodos que modificam estado
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const token = request.headers.get('x-csrf-token')
    
    if (!token || !(await validateCSRFToken(token))) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
  }
  
  return NextResponse.next()
}
```

## 3. Validação de Input com Zod

```typescript
// schemas/auth.ts
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .max(255, 'Email muito longo'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha muito longa')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter número')
})

export const updateCardSchema = z.object({
  cardId: z.string().uuid('ID inválido'),
  phase: z.enum(['new', 'in_progress', 'completed', 'cancelled']),
  updates: z.object({
    chofer: z.string().optional(),
    observacoes: z.string().max(1000).optional(),
    prioridade: z.enum(['baixa', 'media', 'alta']).optional()
  })
})
```

### Uso em API Routes

```typescript
// app/api/auth/signin/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validação automática com mensagens de erro
    const validated = signInSchema.parse(body)
    
    // validated agora tem tipos TypeScript corretos
    const { email, password } = validated
    
    // ... lógica de autenticação
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        issues: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    // ... outros erros
  }
}
```

## 4. Rate Limiting com Redis (Upstash)

```typescript
// utils/rate-limit-redis.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Criar cliente Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Diferentes limitadores para diferentes endpoints
export const rateLimiters = {
  // Auth: 5 tentativas em 15 minutos
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
  }),
  
  // API geral: 100 requests por minuto
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
  }),
  
  // Endpoints pesados: 10 por hora
  heavy: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
  })
}

// Helper para usar no middleware
export async function checkRateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters = 'api'
) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success, limit, reset, remaining } = await rateLimiters[limiterType].limit(ip)
  
  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    }
  }
}
```

## 5. Segurança de Cookies Aprimorada

```typescript
// utils/secure-cookies.ts
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export const secureCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 dias
}

// Para cookies mais sensíveis
export const strictCookieOptions: Partial<ResponseCookie> = {
  ...secureCookieOptions,
  sameSite: 'strict',
  maxAge: 60 * 60, // 1 hora
}
```

## 6. Sanitização de Dados Aprimorada

```typescript
// utils/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeHTML(value) as any
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value)
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}
```

## 7. Monitoramento de Segurança

```typescript
// utils/security-monitor.ts
interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'csrf_failure'
  ip: string
  userAgent?: string
  details?: any
  timestamp: Date
}

export async function logSecurityEvent(event: SecurityEvent) {
  // Log localmente
  console.warn(`[SECURITY] ${event.type}`, {
    ip: event.ip,
    timestamp: event.timestamp,
    details: event.details
  })
  
  // Enviar para serviço de monitoramento (ex: Sentry)
  if (process.env.NODE_ENV === 'production') {
    // await sendToSentry(event)
  }
  
  // Salvar em banco para análise
  try {
    await supabase.from('security_logs').insert({
      event_type: event.type,
      ip_address: event.ip,
      user_agent: event.userAgent,
      details: event.details,
      created_at: event.timestamp
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}
```

## Checklist de Implementação

- [ ] Remover todos os tokens públicos do código cliente
- [ ] Implementar validação Zod em todas as rotas API
- [ ] Migrar rate limiting para Redis
- [ ] Adicionar CSRF tokens em todos os formulários
- [ ] Configurar CSP mais restritivo
- [ ] Implementar sanitização de dados
- [ ] Adicionar monitoramento de segurança
- [ ] Realizar teste de penetração
- [ ] Configurar alertas de segurança
- [ ] Documentar todas as medidas de segurança

## Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/security)