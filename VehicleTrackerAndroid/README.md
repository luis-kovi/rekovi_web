# Vehicle Tracker Android

Um aplicativo Android nativo para rastreamento de veículos, inspirado no design mobile do projeto Next.js original.

## 🚀 Tecnologias Utilizadas

- **Kotlin** - Linguagem de programação moderna para Android
- **Jetpack Compose** - Framework moderno de UI declarativa
- **Material Design 3** - Sistema de design do Google
- **Hilt** - Injeção de dependência
- **Coroutines & Flow** - Programação assíncrona
- **ViewModel & StateFlow** - Arquitetura MVVM
- **Navigation Compose** - Navegação entre telas

## 📱 Funcionalidades

- **Autenticação**: Tela de login (demo aceita qualquer email/senha)
- **Lista de Veículos**: 
  - Visualização de todos os veículos
  - Filtro por fase
  - Busca por placa, motorista ou chofer
  - Pull-to-refresh
  - Cards modernos com informações resumidas
- **Detalhes do Veículo**:
  - Informações completas do veículo
  - Ações de telefone, email e mapa
  - Atualização de fase
  - Design moderno com cards organizados
- **Design Responsivo**: Interface adaptada para diferentes tamanhos de tela

## 🎨 Design

O design foi inspirado nas telas mobile do projeto Next.js original, com:
- Gradientes suaves
- Cards com sombras e bordas arredondadas
- Cores específicas para cada fase do processo
- Ícones intuitivos
- Animações suaves

## 🏗️ Arquitetura

O projeto segue a arquitetura MVVM (Model-View-ViewModel) com:
- **Model**: Classes de dados em `data/model`
- **View**: Telas Compose em `ui/screens`
- **ViewModel**: Lógica de negócio em `viewmodel`
- **Repository**: Camada de dados em `data/repository`

## 📦 Estrutura do Projeto

```
VehicleTrackerAndroid/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/vehicletracker/
│   │       │   ├── data/
│   │       │   │   ├── model/       # Modelos de dados
│   │       │   │   └── repository/  # Repositórios
│   │       │   ├── ui/
│   │       │   │   ├── components/  # Componentes reutilizáveis
│   │       │   │   ├── navigation/  # Configuração de navegação
│   │       │   │   ├── screens/     # Telas do app
│   │       │   │   └── theme/       # Tema e estilos
│   │       │   ├── viewmodel/       # ViewModels
│   │       │   └── MainActivity.kt  # Activity principal
│   │       ├── res/                 # Recursos (strings, cores, etc)
│   │       └── AndroidManifest.xml  # Manifest do app
│   └── build.gradle                 # Configurações do módulo
├── build.gradle                     # Configurações do projeto
└── settings.gradle                  # Configurações do Gradle
```

## 🚀 Como Executar

1. **Pré-requisitos**:
   - Android Studio (versão mais recente)
   - JDK 17 ou superior
   - Android SDK

2. **Clonar o projeto**:
   ```bash
   cd VehicleTrackerAndroid
   ```

3. **Abrir no Android Studio**:
   - Abra o Android Studio
   - Selecione "Open" e navegue até a pasta do projeto
   - Aguarde a sincronização do Gradle

4. **Executar o app**:
   - Conecte um dispositivo Android ou inicie um emulador
   - Clique no botão "Run" ou use Shift+F10

## 📱 Telas do Aplicativo

### Tela de Login
- Email e senha (aceita qualquer combinação para demo)
- Validação de campos vazios
- Loading durante autenticação

### Tela de Lista
- Cards de veículos com informações principais
- Estatísticas no topo (Total, Em Recolha, Concluídos)
- Busca por texto
- Filtro por fase
- Pull-to-refresh

### Tela de Detalhes
- Informações completas do veículo
- Ações diretas (ligar, enviar email, abrir mapa)
- Organização por seções (Veículo, Motorista, Chofer, etc)

## 🔮 Próximos Passos

- Integração com API real
- Persistência local com Room
- Notificações push
- Modo offline
- Testes unitários e instrumentados
- Animações de transição entre telas
- Suporte a múltiplos idiomas

## 📄 Licença

Este projeto é apenas para fins de demonstração.