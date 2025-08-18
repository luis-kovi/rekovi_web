# Guia de Testes - Rekovi Web

## 🧪 Configuração de Testes

Este projeto utiliza Jest e React Testing Library para testes automatizados.

### Instalação

As dependências de teste já estão instaladas. Para reinstalar:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest ts-jest ts-node
```

### Executando Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm test:watch

# Executar testes com coverage
npm test:coverage

# Executar testes no CI
npm test:ci
```

## 📁 Estrutura de Testes

```
__tests__/
├── components/      # Testes de componentes React
├── utils/          # Testes de funções utilitárias
├── integration/    # Testes de integração
└── sample.test.ts  # Exemplo básico de teste
```

## ✅ Testes Implementados

### Testes Básicos (Funcionando)
- `__tests__/sample.test.ts` - Exemplos básicos de testes Jest

### Testes de Utilidades
- `__tests__/utils/helpers.simple.test.ts` - Testes para funções auxiliares
  - ✅ calcularSLA
  - ✅ formatPersonName (parcial)
  - ✅ keepOriginalFormat
  - ✅ formatDate (parcial)
  - ✅ isMobileDevice
  - ✅ getRedirectRoute

### Testes de Componentes
- `__tests__/components/LoadingIndicator.simple.test.tsx` - Testes do indicador de carregamento
  - ✅ Renderização sem erros
  - ⚠️ Verificação de elementos (necessita ajustes)

## 🔧 Configuração

### jest.config.ts
Configuração principal do Jest com suporte para TypeScript e path aliases.

### jest.setup.ts
- Configuração do ambiente de testes
- Mocks para Next.js router
- Mocks para Supabase client
- Configuração do window.matchMedia

## 📝 Escrevendo Novos Testes

### Teste de Componente Básico

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('deve renderizar corretamente', () => {
    render(<MyComponent />)
    
    expect(screen.getByText('Texto esperado')).toBeInTheDocument()
  })
})
```

### Teste de Função Utilitária

```typescript
import { myFunction } from '@/utils/myUtils'

describe('myFunction', () => {
  it('deve retornar o valor esperado', () => {
    const result = myFunction('input')
    expect(result).toBe('output')
  })
})
```

### Teste com Interação de Usuário

```typescript
import userEvent from '@testing-library/user-event'

it('deve lidar com clique', async () => {
  const user = userEvent.setup()
  render(<Button onClick={mockFn}>Click me</Button>)
  
  await user.click(screen.getByRole('button'))
  
  expect(mockFn).toHaveBeenCalledTimes(1)
})
```

## 🚨 Problemas Conhecidos

1. **Testes de Componentes com Role**
   - Alguns componentes não têm roles ARIA apropriados
   - Solução: Usar queries alternativas como `getByTestId` ou adicionar roles

2. **Mocks do Edge Runtime**
   - NextRequest/Response não estão disponíveis no ambiente de teste
   - Solução: Criar mocks específicos ou usar testes E2E

3. **Caracteres Especiais**
   - Problemas com encoding de caracteres em alguns testes
   - Solução: Usar strings ASCII nos testes ou configurar encoding

## 🎯 Próximos Passos

1. **Aumentar Cobertura**
   - Adicionar testes para componentes principais (KanbanBoard, Card, etc.)
   - Testar fluxos de autenticação
   - Testar integração com Supabase

2. **Testes E2E**
   - Configurar Cypress ou Playwright
   - Testar fluxos completos de usuário

3. **Testes de Performance**
   - Adicionar testes de renderização
   - Medir performance de componentes grandes

4. **CI/CD**
   - Integrar testes no GitHub Actions ✅
   - Adicionar badges de cobertura
   - Configurar relatórios automáticos

## 🔗 Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Next.js Apps](https://nextjs.org/docs/app/building-your-application/testing)