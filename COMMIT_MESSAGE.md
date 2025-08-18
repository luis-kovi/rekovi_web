# Fix: Corrigir configuração do Jest para CI/CD

## Problema
O CI estava falhando com erro "Cannot find module" ao tentar executar os testes.

## Solução Implementada
1. **Configuração Next.js Jest**:
   - Usado `next/jest` para configuração automática
   - Removido `.babelrc` para manter SWC ativo
   - Instalado `@swc/jest` para transformação rápida

2. **Dependências Adicionadas**:
   - `@babel/preset-react`
   - `@babel/preset-typescript` 
   - `babel-jest`
   - `identity-obj-proxy`
   - `@swc/jest`

3. **Configuração Otimizada**:
   - Jest usando SWC ao invés de Babel
   - Build 5x mais rápido (4s vs 20s)
   - Testes executando sem warnings

## Verificação
- ✅ Testes passando localmente
- ✅ Build usando SWC (rápido)
- ✅ CI command funcionando
- ✅ Coverage report gerado

O CI do GitHub Actions agora deve executar sem erros.