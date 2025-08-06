# Task Manager - Aplicativo Android

Este é um aplicativo Android nativo desenvolvido em Kotlin usando Jetpack Compose, inspirado no sistema de gerenciamento de tarefas de recolhimento de veículos do projeto original.

## 🚀 Características

### Tecnologias Utilizadas
- **Kotlin** - Linguagem principal
- **Jetpack Compose** - UI moderna e declarativa
- **Material Design 3** - Design system moderno
- **MVVM Architecture** - Arquitetura limpa e escalável
- **Hilt** - Injeção de dependência
- **Retrofit + OkHttp** - Comunicação com APIs
- **Coroutines + Flow** - Programação assíncrona reativa
- **Navigation Compose** - Navegação entre telas

### Funcionalidades
- ✅ **Autenticação** - Login seguro com Supabase
- ✅ **Lista de Tarefas** - Visualização otimizada para mobile
- ✅ **Filtros e Busca** - Filtrar por fase e buscar por texto
- ✅ **Pull-to-Refresh** - Atualização manual das tarefas
- ✅ **Detalhes da Tarefa** - Modal completo com todas as informações
- ✅ **Suporte a Links** - Abrir mapas e URLs públicas
- ✅ **Interface Responsiva** - Adaptada para diferentes tamanhos de tela
- ✅ **Tema Personalizado** - Cores e tipografia consistentes

## 🏗️ Arquitetura

O projeto segue a arquitetura MVVM (Model-View-ViewModel) com separação clara de responsabilidades:

```
app/
├── src/main/java/com/taskmanager/
│   ├── data/
│   │   └── repository/          # Repositórios para acesso a dados
│   ├── domain/
│   │   └── model/              # Modelos de dados
│   ├── network/                # Configuração de rede
│   ├── ui/
│   │   ├── component/          # Componentes reutilizáveis
│   │   ├── screen/            # Telas do aplicativo
│   │   ├── theme/             # Tema e cores
│   │   └── viewmodel/         # ViewModels
│   ├── MainActivity.kt
│   └── TaskManagerApplication.kt
└── src/main/res/              # Recursos (strings, cores, etc.)
```

## ⚙️ Configuração

### Pré-requisitos
- Android Studio Giraffe+ (2023.2.1+)
- JDK 8+
- Android SDK API 24+ (Android 7.0)

### Configuração do Supabase
1. Edite o arquivo `SupabaseApiService.kt`
2. Substitua as constantes pelos seus valores:
```kotlin
companion object {
    const val BASE_URL = "https://sua-url-supabase.supabase.co/"
    const val ANON_KEY = "sua-chave-anonima-aqui"
}
```

### Build e Execução
1. Clone o projeto
2. Abra no Android Studio
3. Configure as credenciais do Supabase
4. Execute o projeto

## 📱 Telas e Funcionalidades

### Tela de Login
- Campo de email e senha
- Validação de entrada
- Feedback visual de loading
- Tratamento de erros

### Tela Principal (Lista de Tarefas)
- **Header Informativo**: Status de conexão, informações do usuário
- **Painel de Filtros**: Busca por texto e filtros por fase
- **Lista de Cards**: Cards otimizados com informações essenciais
- **Pull-to-Refresh**: Atualização manual dos dados

### Modal de Detalhes
- **Informações Completas**: Todos os dados da tarefa organizados por seções
- **Links Interativos**: Abrir mapas e URLs públicas
- **Design Responsivo**: Adaptado para diferentes tamanhos de tela

## 🎨 Design System

### Cores Principais
- **Primary**: `#667eea` (Azul)
- **Secondary**: `#764ba2` (Roxo)
- **Background**: `#f5f5f5` (Cinza claro)

### Tipografia
- Material Design 3 typography
- Fonte padrão do sistema
- Hierarquia clara de tamanhos

## 🔧 Customização

### Adicionando Novas Fases
Edite o arquivo `Card.kt` para adicionar novas fases válidas:
```kotlin
companion object {
    val validPhases = listOf(
        "Fila de Recolha",
        "Nova Fase Aqui", // Adicione aqui
        // ... outras fases
    )
}
```

### Personalizando Cores das Fases
Edite o método `getPhaseColor` no `TaskRepository.kt`:
```kotlin
fun getPhaseColor(phase: String): String {
    return when (phase) {
        "Nova Fase" -> "#FF5722" // Adicione cor personalizada
        // ... outras fases
    }
}
```

## 🔒 Segurança

- Armazenamento seguro de tokens
- Headers de autenticação automáticos
- Limpeza de dados no logout
- Validação de permissões por tipo de usuário

## 📦 Dependências Principais

```kotlin
// Core Android
implementation("androidx.core:core-ktx:1.12.0")
implementation("androidx.activity:activity-compose:1.8.2")

// Compose
implementation("androidx.compose.material3:material3")
implementation("androidx.navigation:navigation-compose:2.7.5")

// Dependency Injection
implementation("com.google.dagger:hilt-android:2.48")

// Networking
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.okhttp3:okhttp:4.12.0")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
```

## 🚀 Próximos Passos

### Funcionalidades Sugeridas
- [ ] **Notificações Push** - Alertas de novas tarefas
- [ ] **Modo Offline** - Cache local com sincronização
- [ ] **Real-time Updates** - WebSocket para atualizações automáticas
- [ ] **Filtros Avançados** - Mais opções de filtros
- [ ] **Exportação de Dados** - PDF ou Excel
- [ ] **Biometria** - Login com impressão digital
- [ ] **Modo Escuro** - Tema dark personalizado

### Melhorias Técnicas
- [ ] **Testes Unitários** - Cobertura completa
- [ ] **Testes de UI** - Testes automatizados
- [ ] **CI/CD Pipeline** - Deploy automatizado
- [ ] **Crash Analytics** - Monitoramento de erros
- [ ] **Performance Monitoring** - Métricas de desempenho

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub ou email.

---

**Desenvolvido com ❤️ usando Android + Kotlin + Jetpack Compose**