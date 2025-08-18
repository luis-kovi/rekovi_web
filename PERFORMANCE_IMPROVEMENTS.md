# Otimizações de Performance Recomendadas

## 1. Implementação de Code Splitting e Lazy Loading

### Componentes Pesados com Dynamic Import

```typescript
// app/kanban/page.tsx
import dynamic from 'next/dynamic'
import LoadingIndicator from '@/components/LoadingIndicator'

// Carregamento assíncrono do KanbanBoard
const KanbanBoard = dynamic(() => import('@/components/KanbanBoard'), {
  loading: () => <LoadingIndicator message="Carregando quadro Kanban..." />,
  ssr: false // Desabilitar SSR para componentes que dependem do browser
})

// Modal carregado sob demanda
const CardModal = dynamic(() => import('@/components/CardModal'), {
  loading: () => <div className="animate-pulse">Carregando...</div>
})

export default function KanbanPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <KanbanBoard />
    </div>
  )
}
```

### Route-based Code Splitting

```typescript
// app/settings/page.tsx
import { lazy, Suspense } from 'react'

// Lazy load de páginas inteiras
const SettingsContent = lazy(() => import('./SettingsContent'))

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <SettingsContent />
    </Suspense>
  )
}
```

## 2. Otimização de Imagens com next/image

### Migração de Tags img

```tsx
// Antes
<img 
  src="/images/logos/kovi-logo.webp" 
  alt="Logo Kovi" 
  className="h-40 w-auto object-contain" 
/>

// Depois
import Image from 'next/image'

<Image
  src="/images/logos/kovi-logo.webp"
  alt="Logo Kovi"
  width={406}
  height={130}
  priority // Para imagens above the fold
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Base64 pequena
  className="h-40 w-auto object-contain"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Componente de Imagem Otimizada

```tsx
// components/OptimizedImage.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = ''
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85} // Balanço entre qualidade e tamanho
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  )
}
```

## 3. Substituição de Polling por Supabase Realtime

### Configuração do Realtime

```typescript
// utils/supabase/realtime.ts
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private supabase = createClient()

  subscribeToCards(onUpdate: (payload: any) => void) {
    const channel = this.supabase
      .channel('cards-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'cards'
        },
        (payload) => {
          console.log('Card change received:', payload)
          onUpdate(payload)
        }
      )
      .subscribe()

    this.channels.set('cards', channel)
    return channel
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels.clear()
  }
}
```

### Hook para Realtime

```typescript
// hooks/useRealtimeCards.ts
import { useEffect, useState } from 'react'
import { RealtimeManager } from '@/utils/supabase/realtime'
import type { Card } from '@/types'

export function useRealtimeCards(initialCards: Card[]) {
  const [cards, setCards] = useState(initialCards)
  const [realtimeManager] = useState(() => new RealtimeManager())

  useEffect(() => {
    const channel = realtimeManager.subscribeToCards((payload) => {
      if (payload.eventType === 'INSERT') {
        setCards(prev => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE') {
        setCards(prev => prev.map(card => 
          card.id === payload.new.id ? payload.new : card
        ))
      } else if (payload.eventType === 'DELETE') {
        setCards(prev => prev.filter(card => card.id !== payload.old.id))
      }
    })

    return () => {
      realtimeManager.unsubscribe('cards')
    }
  }, [realtimeManager])

  return cards
}
```

## 4. Implementação de Cache com SWR

### Configuração Global do SWR

```typescript
// app/providers.tsx
import { SWRConfig } from 'swr'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 0, // Desabilitar refresh automático (usar realtime)
        fetcher: (url: string) => fetch(url).then(res => res.json()),
        onError: (error) => {
          console.error('SWR Error:', error)
        },
        shouldRetryOnError: true,
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        revalidateOnFocus: false, // Evitar refetch desnecessário
        revalidateOnReconnect: true,
        dedupingInterval: 10000, // Deduplicar requests em 10s
      }}
    >
      {children}
    </SWRConfig>
  )
}
```

### Hook de Dados com Cache

```typescript
// hooks/useCards.ts
import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'

interface UseCardsOptions {
  phase?: string
  search?: string
  revalidateOnMount?: boolean
}

export function useCards(options: UseCardsOptions = {}) {
  const { phase, search, revalidateOnMount = true } = options
  
  // Criar chave única para o cache
  const key = `/api/cards?phase=${phase || ''}&search=${search || ''}`
  
  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const supabase = createClient()
      let query = supabase.from('cards').select('*')
      
      if (phase) query = query.eq('phase', phase)
      if (search) query = query.ilike('placa', `%${search}%`)
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    {
      revalidateOnMount,
      // Cache por 5 minutos
      dedupingInterval: 5 * 60 * 1000,
    }
  )

  return {
    cards: data || [],
    isLoading,
    error,
    mutate, // Para invalidar cache manualmente
  }
}
```

## 5. Otimização de Bundle com Análise

### Configuração do Bundle Analyzer

```typescript
// next.config.ts
import { withBundleAnalyzer } from '@next/bundle-analyzer'

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // ... configurações existentes
  
  // Otimizar chunks
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk para bibliotecas
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Commons chunk para código compartilhado
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            },
            // Chunk separado para Supabase
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              chunks: 'all',
              priority: 30
            }
          }
        }
      }
    }
    return config
  }
}

export default withAnalyzer(nextConfig)
```

### Script para Análise

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "analyze:server": "BUNDLE_ANALYZE=server npm run build",
    "analyze:browser": "BUNDLE_ANALYZE=browser npm run build"
  }
}
```

## 6. Memoização e Otimização de Re-renders

### Componente Otimizado com Memo

```tsx
// components/CardItem.tsx
import { memo, useMemo, useCallback } from 'react'
import type { Card } from '@/types'

interface CardItemProps {
  card: Card
  onUpdate: (id: string, updates: Partial<Card>) => void
  onDelete: (id: string) => void
}

// Memoizar componente para evitar re-renders desnecessários
export const CardItem = memo(function CardItem({ 
  card, 
  onUpdate, 
  onDelete 
}: CardItemProps) {
  // Memoizar cálculos pesados
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(card.created_at))
  }, [card.created_at])

  // Memoizar callbacks
  const handleStatusChange = useCallback((newStatus: string) => {
    onUpdate(card.id, { status: newStatus })
  }, [card.id, onUpdate])

  const handleDelete = useCallback(() => {
    onDelete(card.id)
  }, [card.id, onDelete])

  return (
    <div className="card-item">
      <h3>{card.placa}</h3>
      <p>{formattedDate}</p>
      <button onClick={() => handleStatusChange('completed')}>
        Marcar como Completo
      </button>
      <button onClick={handleDelete}>
        Deletar
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.status === nextProps.card.status &&
    prevProps.card.updated_at === nextProps.card.updated_at
  )
})
```

## 7. Prefetching e Preloading

### Prefetch de Rotas

```tsx
// components/Navigation.tsx
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function Navigation() {
  const router = useRouter()

  useEffect(() => {
    // Prefetch rotas comuns
    router.prefetch('/kanban')
    router.prefetch('/mobile')
    router.prefetch('/settings')
  }, [router])

  return (
    <nav>
      <Link href="/kanban" prefetch={true}>
        Kanban
      </Link>
      <Link href="/mobile" prefetch={true}>
        Mobile
      </Link>
      <Link href="/settings" prefetch={false}> {/* Não prefetch rotas menos usadas */}
        Configurações
      </Link>
    </nav>
  )
}
```

### Preload de Recursos Críticos

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preload de fontes críticas */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Preconnect para APIs externas */}
        <link rel="preconnect" href="https://api.pipefy.com" />
        <link rel="dns-prefetch" href="https://api.pipefy.com" />
        
        {/* Prefetch de imagens importantes */}
        <link rel="prefetch" href="/images/logos/kovi-logo.webp" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## 8. Service Worker para Cache Offline

```typescript
// public/sw.js
const CACHE_NAME = 'kovi-v1'
const urlsToCache = [
  '/',
  '/offline',
  '/images/logos/kovi-logo.webp',
  '/_next/static/css/',
  '/_next/static/js/'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }
        return fetch(event.request)
      })
      .catch(() => {
        // Offline fallback
        return caches.match('/offline')
      })
  )
})
```

## Métricas de Performance Alvo

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.8s
- **Total Bundle Size**: < 200KB (gzipped)

## Checklist de Implementação

- [ ] Implementar code splitting em todos os componentes pesados
- [ ] Migrar todas as imagens para next/image
- [ ] Configurar Supabase Realtime
- [ ] Implementar SWR para cache de dados
- [ ] Configurar bundle analyzer
- [ ] Otimizar componentes com React.memo
- [ ] Implementar prefetching de rotas
- [ ] Adicionar service worker
- [ ] Configurar CDN para assets estáticos
- [ ] Implementar compressão Brotli