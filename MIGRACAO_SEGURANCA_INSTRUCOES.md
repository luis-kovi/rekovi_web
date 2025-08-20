# 🔐 Instruções de Migração de Segurança - FASE 1 CRÍTICA

## ✅ O que foi implementado:

### 1. **Sistema Seguro Criado**
- ✅ `lib/config/pipefy.ts` - Configuração segura server-side
- ✅ `lib/services/pipefy.ts` - Service class para operações Pipefy
- ✅ `app/api/pipefy/update-card/route.ts` - API segura para updates
- ✅ `app/api/pipefy/upload-file/route.ts` - API segura para uploads
- ✅ `app/api/pipefy/add-comment/route.ts` - API segura para comentários
- ✅ `hooks/usePipefyOperations.ts` - Hook client-side seguro

### 2. **Correções de Segurança Aplicadas**
- ✅ **Tokens movidos para server-side** (sem NEXT_PUBLIC_)
- ✅ **Organization IDs** em variáveis de ambiente
- ✅ **URLs centralizadas** em configuração
- ✅ **Validação e sanitização** de inputs
- ✅ **Rate limiting** nas APIs
- ✅ **Autenticação** obrigatória em todas as rotas

## 🎯 **AÇÃO NECESSÁRIA NO SUPABASE:**

### Configure estas variáveis de ambiente no Supabase/Vercel:

```env
# ⚠️ CRÍTICO: Remover a variável antiga insegura
# REMOVER: NEXT_PUBLIC_PIPEFY_TOKEN

# ✅ Adicionar estas novas variáveis SEGURAS:
PIPEFY_TOKEN=seu_token_pipefy_aqui
PIPEFY_ORGANIZATION_ID=281428
PIPEFY_ORG_UUID=870bddf7-6ce7-4b9d-81d8-9087f1c10ae2
PIPEFY_API_URL=https://api.pipefy.com/graphql
```

### Como configurar na Vercel:
1. Acesse o dashboard do seu projeto na Vercel
2. Vá em **Settings > Environment Variables**
3. **REMOVA** a variável `NEXT_PUBLIC_PIPEFY_TOKEN`
4. **ADICIONE** as novas variáveis acima
5. Faça um novo deploy

## 🚨 **Status de Migração dos Componentes:**

### ✅ **MIGRADO PARA API SEGURA:**
- `handleUpdateChofer` no KanbanBoard
- `handleAllocateDriver` no KanbanBoard

### ⏳ **PENDENTES DE MIGRAÇÃO:**
- `handleRejectCollection`
- `handleUnlockVehicle` 
- `handleRequestTowing`
- `handleReportProblem`
- `handleConfirmPatioDelivery`
- `handleConfirmCarTowed`
- `handleRequestTowMechanical`
- `uploadImageToPipefy`
- Todas as funções do `MobileTaskManager.tsx`

## 🔄 **Próximos Passos:**

### 1. Configurar Ambiente (URGENTE)
```bash
# Configure as variáveis de ambiente conforme mostrado acima
```

### 2. Testar Funcionalidades Migradas
- Teste atualização de chofer
- Teste alocação de driver
- Verifique logs de erro

### 3. Migrar Funções Restantes
```typescript
// Exemplo de como migrar uma função:
const handleRejectCollection = async (cardId: string, reason: string, observations: string) => {
  try {
    const result = await updateCard(cardId, [
      { fieldId: "ve_culo_ser_recolhido", value: "Não" }
    ], `rejeitou a recolha. Motivo: ${reason}. Comentário: ${observations}`);
    
    if (!result.success) {
      throw new Error(result.error || 'Falha ao rejeitar recolha');
    }
    
    // Sucesso
  } catch (error) {
    logger.error('Erro ao rejeitar recolha:', error);
    throw error;
  }
};
```

### 4. Migrar Uploads de Arquivo
```typescript
// Para uploads, usar:
const result = await uploadFile(file, fieldId, cardId);
```

## ⚠️ **IMPORTANTE - Remoção de Código Inseguro:**

### APIs antigas que devem ser removidas:
1. `app/api/auth/reset-rate-limit/route.ts` (se não usada)
2. Todas as chamadas diretas para `https://api.pipefy.com/graphql`
3. Qualquer uso de `NEXT_PUBLIC_PIPEFY_TOKEN`
4. Edge Functions antigas do Supabase (`update-chofer-pipefy`, `upload-image-pipefy`)

### Buscar e substituir no código:
```bash
# Buscar por estas strings inseguras:
- "NEXT_PUBLIC_PIPEFY_TOKEN"
- "https://api.pipefy.com/graphql"
- "281428"
- "870bddf7-6ce7-4b9d-81d8-9087f1c10ae2"
- "/functions/v1/"
```

## 🧪 **Como Testar:**

### 1. Teste Local
```bash
# Criar .env.local com as novas variáveis
PIPEFY_TOKEN=seu_token
PIPEFY_ORGANIZATION_ID=281428
PIPEFY_ORG_UUID=870bddf7-6ce7-4b9d-81d8-9087f1c10ae2

npm run dev
```

### 2. Teste das APIs
```bash
# Teste direto da API
curl -X POST http://localhost:3000/api/pipefy/update-card \
  -H "Content-Type: application/json" \
  -d '{"cardId":"test","fields":[{"fieldId":"test","value":"test"}]}'
```

## 📊 **Benefícios Alcançados:**

### 🔐 Segurança:
- ❌ **Zero exposição** de tokens client-side
- ✅ **Autenticação** obrigatória
- ✅ **Validação** completa de inputs
- ✅ **Rate limiting** implementado

### ⚡ Performance:
- ✅ **Requests reduzidas** (batching)
- ✅ **Error handling** melhorado
- ✅ **Timeouts** configurados
- ✅ **Retry logic** implementado

### 🛠 Manutenibilidade:
- ✅ **Código centralizado**
- ✅ **Tipagem TypeScript**
- ✅ **Logging padronizado**
- ✅ **Configuração unificada**

---

**Status Atual: 🟡 PARCIALMENTE IMPLEMENTADO**
**Próximo: 🔴 CONFIGURAR AMBIENTE + MIGRAR FUNÇÕES RESTANTES**
