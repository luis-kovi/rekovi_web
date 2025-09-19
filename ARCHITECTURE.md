# 🏗️ Arquitetura e Estrutura do Projeto Rekovi Web

## 📋 Visão Geral

Este projeto é uma aplicação Next.js para gestão de recolhas da Kovi, seguindo uma arquitetura simples e funcional com componentes organizados por funcionalidade.

## 🎯 Princípios da Arquitetura

### Estrutura Pragmática
A arquitetura atual prioriza:

1. **Simplicidade** - Componentes diretos e funcionais
2. **Manutenibilidade** - Código fácil de entender e modificar  
3. **Reutilização** - Componentes modulares e bem definidos
4. **Performance** - Otimizações específicas para o domínio

### Separação de Responsabilidades
- **Páginas (app/)**: Lógica de rota e dados do servidor
- **Componentes (components/)**: UI e interações do usuário
- **Utilitários (utils/)**: Funções auxiliares e configurações
- **Tipos (types/)**: Definições TypeScript centralizadas

## 📁 Estrutura de Pastas

```
rekovi_web/
├── app/                       # App Router do Next.js 15
│   ├── api/                   # API routes
│   ├── auth/                  # Páginas de autenticação
│   ├── kanban/                # Dashboard Kanban
│   ├── mobile/                # Interface mobile
│   ├── settings/              # Configurações admin
│   └── layout.tsx             # Layout global
├── components/                # Componentes React
│   ├── Header.tsx             # Cabeçalho da aplicação
│   ├── KanbanBoard.tsx        # Board principal
│   ├── KanbanWrapper.tsx      # Wrapper do Kanban
│   ├── MobileWrapper.tsx      # Wrapper mobile
│   ├── MobileTaskManager.tsx  # Gerenciador mobile
│   ├── CardModal.tsx          # Modal de detalhes
│   └── ...                    # Outros componentes
├── types/                     # Definições TypeScript
│   ├── card.types.ts          # Tipos dos cards
│   ├── database.types.ts      # Tipos do Supabase
│   └── supabase.ts            # Tipos específicos
├── utils/                     # Utilitários
│   ├── supabase/              # Configuração Supabase
│   ├── auth-validation.ts     # Validação de permissões
│   ├── rate-limiter.ts        # Controle de taxa
│   └── logger.ts              # Sistema de logs
└── middleware.ts              # Middleware de autenticação
```

## 🎨 Componentes Principais

### Header.tsx
Cabeçalho comum com:
- Logo da Kovi
- Informações do usuário logado
- Indicadores de conexão
- Menu de navegação

### KanbanBoard.tsx  
Dashboard principal com:
- Colunas de fases do processo
- Cards de recolha drag & drop
- Filtros e busca
- Modais de ação

### MobileTaskManager.tsx
Interface otimizada para mobile:
- Lista de cards responsiva
- Filtros simplificados
- Ações touch-friendly

### CardModal.tsx
Modal de detalhes e ações:
- Informações completas do card
- Formulários de ação
- Upload de fotos/documentos
- Integração com Pipefy

## 🔧 Padrões de Desenvolvimento

### 1. Importações
```typescript
// Componentes locais
import Header from '@/components/Header'
import KanbanBoard from '@/components/KanbanBoard'

// Utilitários
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/utils/logger'

// Tipos
import type { Card } from '@/types'
```

### 2. Props e TypeScript
```typescript
interface ComponentProps {
  initialCards: Card[]
  permissionType: string
  user: any
}

export default function Component({ initialCards, permissionType, user }: ComponentProps) {
  // Implementação
}
```

### 3. Estado e Hooks
```typescript
'use client'

import { useState, useEffect } from 'react'

export default function Component() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Card[]>([])
  
  // useEffect para carregamento inicial
  useEffect(() => {
    loadData()
  }, [])
}
```

## 🔄 Fluxo de Dados

### 1. Server-Side (páginas app/)
```typescript
// Busca dados no servidor
export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('cards').select()
  
  return <Component initialData={data} />
}
```

### 2. Client-Side (componentes)
```typescript
// Atualiza dados no cliente
const handleUpdate = async (cardId: string) => {
  setLoading(true)
  try {
    await supabase.from('cards').update(data).eq('id', cardId)
    // Atualizar estado local
  } catch (error) {
    logger.error('Erro:', error)
  } finally {
    setLoading(false)
  }
}
```

## 🚀 Funcionalidades Principais

### Autenticação
- Login com Google OAuth
- Validação de permissões por tabela `pre_approved_users`
- Rate limiting para segurança
- Redirecionamento baseado em device

### Gestão de Recolhas
- Visualização em Kanban (desktop)
- Lista responsiva (mobile)
- Filtros por SLA, fase, empresa
- Ações específicas por fase do processo

### Integrações
- **Supabase**: Banco de dados e autenticação
- **Pipefy**: Sincronização de cards e ações
- **Google OAuth**: Autenticação social

## 📱 Responsividade

### Desktop (>= 1024px)
- Interface Kanban completa
- Múltiplas colunas visíveis
- Drag & drop funcional

### Mobile (< 768px)  
- Interface lista simplificada
- Filtros em modal
- Navegação touch-friendly

### Tablet (768px - 1023px)
- Híbrido entre mobile e desktop
- Colunas colapsáveis

## 🔒 Segurança

### Rate Limiting
- Controle de tentativas de login
- Reset automático após sucesso
- Proteção contra ataques

### Validação de Permissões
- Verificação em tabela `pre_approved_users`
- Filtros baseados em empresa/área
- Middleware de autenticação

### Sanitização
- Validação de inputs
- Escape de dados do usuário
- Headers de segurança

## 📝 Próximos Passos

1. **Performance**: Implementar lazy loading
2. **PWA**: Adicionar service worker
3. **Testes**: Cobertura de testes unitários
4. **Monitoramento**: Métricas de performance
5. **Acessibilidade**: Melhorar ARIA labels

## 🛠️ Desenvolvimento

### Comandos
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção  
npm run lint         # Verificar código
npm run type-check   # Verificar tipos
```

### Estrutura de Commits
```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração
docs: documentação
style: formatação
```

Esta arquitetura foca na simplicidade e manutenibilidade, priorizando código funcional e bem estruturado sobre abstrações complexas.