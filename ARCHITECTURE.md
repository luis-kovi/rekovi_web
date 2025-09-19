# 🏗️ Arquitetura e Estrutura de Componentes

## 📋 Visão Geral

Este projeto foi reorganizado seguindo a metodologia **Atomic Design** para criar um sistema de componentes escalável, reutilizável e bem estruturado.

## 🎯 Princípios da Arquitetura

### Atomic Design
A arquitetura segue os cinco níveis do Atomic Design:

1. **Atoms** (Átomos) - Componentes básicos e indivisíveis
2. **Molecules** (Moléculas) - Combinações simples de átomos
3. **Organisms** (Organismos) - Componentes complexos e funcionais
4. **Templates** (Templates) - Estruturas de página
5. **Pages** (Páginas) - Instâncias específicas dos templates

### Separação de Responsabilidades
- **Componentes de Apresentação**: Apenas renderização e UI
- **Hooks Customizados**: Lógica de negócio e estado
- **Utilitários**: Funções auxiliares reutilizáveis
- **Tipos**: Definições TypeScript organizadas

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                    # Atoms - Componentes básicos
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Icon/
│   │   └── index.ts
│   ├── molecules/             # Molecules - Componentes compostos
│   │   ├── SearchInput/
│   │   ├── StatusBadge/
│   │   ├── InfoField/
│   │   ├── LoadingSpinner/
│   │   └── index.ts
│   ├── organisms/             # Organisms - Componentes complexos
│   │   ├── TaskCard/
│   │   ├── KanbanColumn/
│   │   └── index.ts
│   ├── examples/              # Exemplos de uso
│   └── index.ts
├── hooks/                     # Custom hooks
│   ├── useCards.ts
│   ├── usePipefyActions.ts
│   └── index.ts
├── types/                     # Definições de tipos
│   ├── card.types.ts
│   ├── user.types.ts
│   ├── ui.types.ts
│   ├── api.types.ts
│   └── index.ts
├── styles/
│   ├── tokens/                # Design tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   └── globals.css
└── utils/
    ├── cn.ts                  # Utility para classes condicionais
    └── helpers.ts
```

## 🎨 Sistema de Design

### Design Tokens
Implementamos um sistema de design tokens consistente:

```typescript
// Cores
import { colors } from '@/styles/tokens';
const primaryColor = colors.primary[500]; // #FF355A

// Espaçamento
import { spacing } from '@/styles/tokens';
const padding = spacing[4]; // 16px

// Tipografia
import { fontSizes } from '@/styles/tokens';
const textSize = fontSizes.lg; // 18px
```

### Componentes UI (Atoms)

#### Button
```typescript
import { Button } from '@/components/ui/Button';

<Button 
  variant="primary" 
  size="md" 
  leftIcon={<Icon name="user" />}
  isLoading={loading}
>
  Alocar Chofer
</Button>
```

#### Input
```typescript
import { Input } from '@/components/ui/Input';

<Input
  label="Nome do Chofer"
  placeholder="Digite o nome..."
  error="Campo obrigatório"
  leftIcon={<Icon name="user" />}
/>
```

#### Badge
```typescript
import { Badge } from '@/components/ui/Badge';

<Badge variant="success" icon={<Icon name="check" />}>
  No Prazo
</Badge>
```

#### Icon
```typescript
import { Icon } from '@/components/ui/Icon';

<Icon name="user" size="md" className="text-blue-500" />
```

### Componentes Molecules

#### SearchInput
```typescript
import { SearchInput } from '@/components/molecules/SearchInput';

<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Pesquisar..."
  onClear={() => setSearchTerm('')}
/>
```

#### StatusBadge
```typescript
import { StatusBadge } from '@/components/molecules/StatusBadge';

<StatusBadge 
  status={card.slaText} 
  slaValue={card.sla}
  showIcon={true}
/>
```

#### InfoField
```typescript
import { InfoField } from '@/components/molecules/InfoField';

<InfoField
  label="Motorista"
  value={card.nomeDriver}
  icon="user"
  variant="compact"
/>
```

### Componentes Organisms

#### TaskCard
```typescript
import { TaskCard } from '@/components/organisms/TaskCard';

<TaskCard
  card={cardWithSLA}
  onClick={() => setSelectedCard(card)}
  variant="default"
/>
```

#### KanbanColumn
```typescript
import { KanbanColumn } from '@/components/organisms/KanbanColumn';

<KanbanColumn
  title="Fila de Recolha"
  cards={cardsInPhase}
  onCardClick={handleCardClick}
  colorScheme={phaseColorScheme}
/>
```

## 🔧 Hooks Customizados

### useCards
Gerencia estado e operações dos cards:

```typescript
import { useCards } from '@/hooks/useCards';

const {
  filteredCards,
  isLoading,
  filters,
  setFilters,
  refreshCards,
  statusCounts
} = useCards(initialCards, {
  permissionType,
  realTimeEnabled: true
});
```

### usePipefyActions
Operações de integração com Pipefy:

```typescript
import { usePipefyActions } from '@/hooks/usePipefyActions';

const {
  onUpdateChofer,
  onAllocateDriver,
  onRejectCollection,
  uploadImageToPipefy
} = usePipefyActions();
```

## 📊 Sistema de Tipos

### Tipos de Card
```typescript
import { Card, CardWithSLA, CardFilters } from '@/types/card.types';
```

### Tipos de UI
```typescript
import { ButtonVariant, IconName, ModalProps } from '@/types/ui.types';
```

### Tipos de Usuário
```typescript
import { User, PermissionType, UserPermissions } from '@/types/user.types';
```

## 🚀 Como Usar

### 1. Importação de Componentes
```typescript
// Importar componentes específicos
import { Button, Input } from '@/components/ui';
import { SearchInput, StatusBadge } from '@/components/molecules';
import { TaskCard, KanbanColumn } from '@/components/organisms';

// Ou importar tudo
import * as UI from '@/components/ui';
import * as Molecules from '@/components/molecules';
```

### 2. Uso com Hooks
```typescript
import React from 'react';
import { useCards, usePipefyActions } from '@/hooks';
import { KanbanColumn, TaskCard } from '@/components/organisms';

function MyKanbanBoard({ initialCards, permissionType }) {
  const { filteredCards, setFilters } = useCards(initialCards, { permissionType });
  const { onAllocateDriver } = usePipefyActions();

  return (
    <div className="flex gap-4">
      {phases.map(phase => (
        <KanbanColumn
          key={phase}
          title={phase}
          cards={filteredCards.filter(c => c.faseAtual === phase)}
          onCardClick={handleCardClick}
        />
      ))}
    </div>
  );
}
```

### 3. Personalização com Tokens
```typescript
import { colors, spacing } from '@/styles/tokens';
import { cn } from '@/utils/cn';

// Usar tokens diretamente
const customStyle = {
  backgroundColor: colors.primary[500],
  padding: spacing[4]
};

// Ou com classes Tailwind personalizadas
<div className={cn(
  'bg-primary-500 p-4',
  isActive && 'ring-2 ring-primary-200'
)}>
  Conteúdo
</div>
```

## 🔄 Migração dos Componentes Legados

Os componentes antigos ainda funcionam através de exports de compatibilidade, mas recomendamos migrar gradualmente:

```typescript
// ❌ Antigo
import CardComponent from '@/components/Card';

// ✅ Novo
import { TaskCard } from '@/components/organisms/TaskCard';
```

## 📝 Próximos Passos

1. **Templates**: Criar templates de página reutilizáveis
2. **Temas**: Implementar suporte a múltiplos temas
3. **Testes**: Adicionar testes unitários para componentes
4. **Storybook**: Documentação visual dos componentes
5. **Acessibilidade**: Melhorar suporte a ARIA e navegação por teclado

## 🤝 Contribuição

Ao adicionar novos componentes, siga esta estrutura:

1. **Atoms**: Componentes básicos e reutilizáveis
2. **Molecules**: Combinações lógicas de atoms
3. **Organisms**: Componentes funcionais complexos
4. **Hooks**: Lógica de negócio extraída
5. **Tipos**: Definições TypeScript apropriadas
6. **Testes**: Cobertura de teste adequada

---

Esta arquitetura garante escalabilidade, manutenibilidade e reutilização eficiente dos componentes em todo o projeto.
