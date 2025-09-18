# 🚀 Rekovi Web - Gestão de Recolhas

Uma aplicação moderna e profissional para gestão de recolhas Kovi, construída com Next.js 14+ e as mais recentes tecnologias web.

## ✨ Características

### 🎨 Design System Moderno
- **Atomic Design**: Arquitetura organizada em atoms, molecules, organisms, templates e pages
- **Shadcn/UI**: Componentes acessíveis e customizáveis
- **Tailwind CSS**: Estilização utilitária com design tokens
- **Tema Escuro/Claro**: Suporte completo a temas com transições suaves
- **Tipografia Moderna**: Inter font com otimizações de performance

### ⚡ Performance de Alto Nível
- **Next.js 14+**: App Router com Server Components
- **TypeScript Strict**: Tipagem rigorosa para maior confiabilidade
- **Code Splitting**: Carregamento otimizado por rotas e features
- **Lazy Loading**: Componentes carregados sob demanda
- **Bundle Optimization**: Análise e otimização automática do bundle
- **Core Web Vitals**: Otimizado para excelentes métricas de performance

### 🎭 Animações e Interações
- **Framer Motion**: Animações fluidas e micro-interações
- **Transições Suaves**: Feedback visual imediato para todas as ações
- **Loading States**: Skeleton loaders e estados de carregamento elegantes
- **Hover Effects**: Interações tátis e responsivas

### 📱 Responsividade e Acessibilidade
- **Mobile-First**: Design otimizado para dispositivos móveis
- **Acessibilidade Completa**: ARIA labels, navegação por teclado, semantic HTML
- **PWA Ready**: Suporte a Progressive Web App
- **Touch-Friendly**: Interface otimizada para toque

### 🛠️ Developer Experience
- **ESLint + Prettier**: Código consistente e bem formatado
- **Husky**: Pre-commit hooks para qualidade de código
- **Jest + Testing Library**: Testes unitários e de integração
- **Storybook**: Documentação interativa de componentes
- **Bundle Analyzer**: Análise detalhada do bundle

## 🏗️ Arquitetura

### Estrutura de Pastas
```
src/
├── components/
│   ├── ui/                 # Componentes base (atoms)
│   ├── forms/              # Componentes de formulário
│   ├── layout/             # Componentes de layout
│   ├── features/           # Componentes por funcionalidade
│   │   ├── auth/           # Autenticação
│   │   ├── kanban/         # Quadro Kanban
│   │   ├── mobile/         # Interface móvel
│   │   └── settings/       # Configurações
│   └── providers/          # Context providers
├── hooks/                  # Custom hooks
├── lib/                    # Configurações e helpers
├── utils/                  # Funções utilitárias
├── types/                  # Definições TypeScript
└── styles/                 # Estilos globais
```

### Stack Tecnológica
- **Framework**: Next.js 14+ com App Router
- **Linguagem**: TypeScript (strict mode)
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Animações**: Framer Motion
- **Estado**: React Query + Context API
- **Formulários**: React Hook Form + Zod
- **Testes**: Jest + React Testing Library
- **Documentação**: Storybook
- **Backend**: Supabase

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm 8+

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd rekovi-web

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Execute em modo de desenvolvimento
npm run dev
```

### Scripts Disponíveis
```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção
npm run lint             # Verificação de código
npm run lint:fix         # Correção automática
npm run format           # Formatação de código
npm run format:check     # Verificação de formatação
npm run type-check       # Verificação de tipos

# Testes
npm run test             # Executar testes
npm run test:watch       # Testes em modo watch
npm run test:coverage    # Cobertura de testes

# Documentação
npm run storybook        # Storybook
npm run build-storybook  # Build do Storybook

# Análise
npm run analyze          # Análise do bundle
```

## 🎯 Funcionalidades

### 📋 Kanban Board
- Quadro visual para gestão de tarefas
- Drag & drop entre colunas
- Filtros e busca avançada
- Atribuição de responsáveis
- Prazos e prioridades
- Tags e categorização

### 📱 Interface Móvel
- Design responsivo otimizado
- Gestos touch-friendly
- Modais nativos
- Navegação intuitiva
- Performance otimizada

### 🔐 Autenticação
- Login com Google OAuth
- Controle de permissões
- Sessões seguras
- Logout automático

### ⚙️ Configurações
- Tema personalizável
- Preferências de usuário
- Configurações de notificação
- Gerenciamento de dados

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm run test

# Testes específicos
npm run test -- --testNamePattern="Button"

# Cobertura
npm run test:coverage
```

### Estrutura de Testes
- **Unitários**: Componentes individuais
- **Integração**: Fluxos completos
- **E2E**: Cenários end-to-end
- **Acessibilidade**: Validação de a11y

## 📚 Documentação

### Storybook
```bash
npm run storybook
```
Acesse `http://localhost:6006` para visualizar a documentação interativa dos componentes.

### Componentes Documentados
- Button, Input, Card, Modal
- KanbanCard, KanbanColumn, KanbanBoard
- Header, LoadingSpinner, Toast
- E muitos outros...

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel --prod
```

### Outras Plataformas
- **Netlify**: Suporte nativo ao Next.js
- **Railway**: Deploy simples e rápido
- **Docker**: Containerização disponível

## 📊 Performance

### Métricas Alvo
- **Lighthouse Score**: 90+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Otimizações Implementadas
- Code splitting automático
- Lazy loading de componentes
- Otimização de imagens
- Compressão gzip/brotli
- Cache estratégico
- Bundle analysis

## 🤝 Contribuição

### Padrões de Código
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Testes obrigatórios
- Documentação atualizada

### Processo
1. Fork do repositório
2. Crie uma branch para sua feature
3. Implemente com testes
4. Execute `npm run pre-commit`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação**: [Storybook](http://localhost:6006)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussões**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

Desenvolvido com ❤️ pela equipe Kovi