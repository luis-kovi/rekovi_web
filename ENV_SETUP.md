# Configuração de Variáveis de Ambiente

## Variáveis Obrigatórias

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

Estas variáveis são **obrigatórias** para o funcionamento da aplicação. Você pode obtê-las no dashboard do Supabase em:
- Settings > API

## Variáveis Obrigatórias (Pipefy)

### Pipefy - SEGURANÇA CRÍTICA
```env
# Token de autorização (NUNCA usar NEXT_PUBLIC_)
PIPEFY_TOKEN=seu_token_pipefy

# IDs da organização (obrigatórios)
PIPEFY_ORGANIZATION_ID=281428
PIPEFY_ORG_UUID=870bddf7-6ce7-4b9d-81d8-9087f1c10ae2

# URL da API (opcional - usa padrão se não definida)
PIPEFY_API_URL=https://api.pipefy.com/graphql
```

**⚠️ IMPORTANTE**: Estas variáveis são **OBRIGATÓRIAS** e devem estar **SEM** o prefixo `NEXT_PUBLIC_` para manter a segurança.

## Variáveis Opcionais

## Configuração na Vercel

1. Acesse o dashboard do seu projeto na Vercel
2. Vá em Settings > Environment Variables
3. Adicione cada variável com seu respectivo valor
4. Certifique-se de que estão disponíveis para todos os ambientes (Production, Preview, Development)

## Verificação Local

Para testar localmente, crie um arquivo `.env.local` na raiz do projeto com as variáveis necessárias.

**Importante**: Nunca commite o arquivo `.env.local` no repositório!