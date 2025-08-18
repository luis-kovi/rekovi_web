# Instruções para Atualizar o MobileTaskManager.tsx

## Mudanças Necessárias

### 1. Adicionar Import no Topo do Arquivo

Após a linha:
```typescript
import { logger } from '@/utils/logger'
```

Adicionar:
```typescript
import { pipefyClient } from '@/utils/pipefy-client'
```

### 2. Substituir Chamadas ao Pipefy

Localizar todas as ocorrências de:

```typescript
const response = await fetch('https://api.pipefy.com/graphql', {
  method: 'POST',
  headers: {
    ...(process.env.NEXT_PUBLIC_PIPEFY_TOKEN && { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIPEFY_TOKEN}` }),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: updateQuery }),
});

if (!response.ok) {
  throw new Error('Erro na requisição ao Pipefy');
}

const result = await response.json();
if (result.errors) {
  throw new Error(`Erro do Pipefy: ${result.errors[0].message}`);
}
```

E substituir por:

```typescript
const result = await pipefyClient.query(updateQuery);

if (!result.data || !result.data.updateNodeV2) {
  throw new Error('Falha ao atualizar card no Pipefy');
}
```

### 3. Substituir Chamadas em Promise.all

Localizar:
```typescript
fetch('https://api.pipefy.com/graphql', {
  method: 'POST',
  headers: {
    ...(process.env.NEXT_PUBLIC_PIPEFY_TOKEN && { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIPEFY_TOKEN}` }),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: updateQuery }),
}),
```

Substituir por:
```typescript
pipefyClient.query(updateQuery),
```

E também:
```typescript
fetch('https://api.pipefy.com/graphql', {
  method: 'POST',
  headers: {
    ...(process.env.NEXT_PUBLIC_PIPEFY_TOKEN && { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIPEFY_TOKEN}` }),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: commentQuery }),
})
```

Substituir por:
```typescript
pipefyClient.query(commentQuery)
```

## Localizações no Arquivo

As chamadas estão aproximadamente nas linhas:
- Linha ~1156: Primeira chamada (handleConfirmPatioDelivery)
- Linha ~1268: Segunda chamada (handleConfirmCarTowed)
- Linha ~1350: Terceira chamada em Promise.all (handleRequestTowMechanical)
- Linha ~1358: Quarta chamada em Promise.all (handleRequestTowMechanical)

## Verificação

Após as mudanças, verificar que:
1. O import do pipefyClient foi adicionado
2. Não há mais referências a `process.env.NEXT_PUBLIC_PIPEFY_TOKEN`
3. Todas as chamadas diretas ao Pipefy foram substituídas
4. O código compila sem erros