# Configuração de Variáveis de Ambiente

## Variáveis Obrigatórias

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

Estas variáveis são **obrigatórias** para o funcionamento da aplicação. Você pode obtê-las no dashboard do Supabase em:
- Settings > API

## Variáveis Opcionais

### Pipefy
```env
NEXT_PUBLIC_PIPEFY_TOKEN=seu_token_pipefy
```

Esta variável é opcional. Se não fornecida, algumas funcionalidades relacionadas ao Pipefy podem não funcionar completamente.

## Configuração na Vercel

1. Acesse o dashboard do seu projeto na Vercel
2. Vá em Settings > Environment Variables
3. Adicione cada variável com seu respectivo valor
4. Certifique-se de que estão disponíveis para todos os ambientes (Production, Preview, Development)

## Verificação Local

Para testar localmente, crie um arquivo `.env.local` na raiz do projeto com as variáveis necessárias.

**Importante**: Nunca commite o arquivo `.env.local` no repositório!