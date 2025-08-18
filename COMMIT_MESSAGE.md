# Fix: Corrigir erro de configuração do Jest no CI

## Problema
O CI estava falhando com erro relacionado ao ts-node e configuração do Jest em formato TypeScript.

## Solução
- Convertido `jest.config.ts` para `jest.config.js` usando CommonJS
- Removida dependência desnecessária do `ts-node`
- Mantida funcionalidade completa dos testes
- Adicionado coverage e snapshots ao .gitignore

## Verificação
- ✅ Testes funcionando localmente
- ✅ Build funcionando sem erros
- ✅ Comando `test:ci` executando corretamente

Isso deve resolver o erro no GitHub Actions.