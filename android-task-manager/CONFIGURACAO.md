# Guia de Configuração - Task Manager Android

## 🔧 Configuração Inicial

### 1. Configurar Credenciais do Supabase

Antes de executar o aplicativo, você precisa configurar as credenciais do Supabase:

**Arquivo:** `app/src/main/java/com/taskmanager/network/SupabaseApiService.kt`

```kotlin
companion object {
    const val BASE_URL = "https://SEU_PROJETO.supabase.co/"
    const val ANON_KEY = "SUA_CHAVE_ANONIMA_AQUI"
}
```

### 2. Estrutura do Banco de Dados

O aplicativo espera uma view chamada `v_pipefy_cards_detalhada` com os seguintes campos:

```sql
-- Campos obrigatórios
card_id: string
placa_veiculo: string
nome_driver: string
nome_chofer_recolha: string
phase_name: string
created_at: timestamp
email_chofer: string
empresa_recolha: string

-- Campos opcionais
modelo_veiculo: string
telefone_contato: string
telefone_opcional: string
email_cliente: string
endereco_cadastro: string
endereco_recolha: string
link_mapa: string
origem_locacao: string
valor_recolha: string
custo_km_adicional: string
public_url: string
```

### 3. Configuração de Autenticação

O sistema de autenticação está configurado para usar o endpoint padrão do Supabase:
- Login: `POST /auth/v1/token?grant_type=password`
- Logout: `POST /auth/v1/logout`
- User Info: `GET /auth/v1/user`

### 4. Tipos de Permissão

O aplicativo suporta os seguintes tipos de usuário (campo `permissionType` no `app_metadata`):

- **admin**: Acesso completo a todas as tarefas
- **kovi**: Acesso completo (mesmo que admin)
- **ativa**: Acesso apenas a tarefas da empresa "ativa"
- **onsystem**: Acesso apenas a tarefas da empresa "onsystem"
- **chofer**: Acesso apenas a tarefas onde `email_chofer` = email do usuário
- **default**: Sem acesso (será redirecionado)

## 🚀 Executando o Projeto

### Pré-requisitos
- Android Studio Giraffe+ (2023.2.1 ou superior)
- JDK 8 ou superior
- Android SDK API 24+ (Android 7.0)
- Dispositivo Android ou emulador

### Passos para Execução

1. **Clone o repositório**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd android-task-manager
   ```

2. **Abra no Android Studio**
   - File > Open
   - Selecione a pasta `android-task-manager`
   - Aguarde o sync do Gradle

3. **Configure as credenciais do Supabase**
   - Edite `SupabaseApiService.kt` com suas credenciais

4. **Execute o projeto**
   - Conecte um dispositivo Android ou inicie um emulador
   - Clique em Run (▶️) ou pressione Shift+F10

## 🔍 Testando o Aplicativo

### Dados de Teste
Para testar o aplicativo, você pode criar alguns dados de exemplo no Supabase:

```sql
-- Exemplo de usuário para teste (no Authentication)
Email: admin@teste.com
Password: 123456
app_metadata: {"permissionType": "admin"}

-- Exemplo de tarefa/card na view
INSERT INTO sua_tabela_de_cards (
    card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
    phase_name, email_chofer, empresa_recolha, created_at
) VALUES (
    '12345', 'ABC1234', 'João Silva', 'Pedro Santos',
    'Fila de Recolha', 'pedro@email.com', 'ATIVA', NOW()
);
```

### Fluxo de Teste
1. Abra o aplicativo
2. Faça login com as credenciais configuradas
3. Verifique se as tarefas são carregadas corretamente
4. Teste os filtros e busca
5. Toque em uma tarefa para ver os detalhes

## 🐛 Problemas Comuns

### 1. Erro de Conexão
**Sintoma**: Não consegue fazer login ou carregar tarefas
**Solução**: 
- Verifique se a URL do Supabase está correta
- Confirme se a chave API está válida
- Teste a conectividade com a internet

### 2. Tela Vazia de Tarefas
**Sintoma**: Login funciona mas não aparecem tarefas
**Solução**:
- Verifique se a view `v_pipefy_cards_detalhada` existe
- Confirme se há dados na view
- Verifique se o `permissionType` do usuário está correto

### 3. Erro de Build
**Sintoma**: Projeto não compila
**Solução**:
- Execute "Clean Project" no Android Studio
- Verifique se todas as dependências estão atualizadas
- Confirme que está usando JDK 8+

### 4. Aplicativo Lento
**Sintoma**: Interface travando ou lenta
**Solução**:
- Teste em um dispositivo físico (emuladores podem ser lentos)
- Verifique se há muitos dados sendo carregados
- Considere implementar paginação se houver muitas tarefas

## 📦 Build para Produção

### Preparação
1. Configure as credenciais de produção no `SupabaseApiService.kt`
2. Atualize o versionCode e versionName no `build.gradle.kts`
3. Configure o arquivo de chave de assinatura (se necessário)

### Gerar APK
```bash
./gradlew assembleRelease
```

### Gerar AAB (para Google Play)
```bash
./gradlew bundleRelease
```

Os arquivos gerados estarão em:
- APK: `app/build/outputs/apk/release/`
- AAB: `app/build/outputs/bundle/release/`

## 🔒 Configurações de Segurança

### Para Produção
1. **Remova logs de debug**: Configure `HttpLoggingInterceptor.Level.NONE`
2. **Habilite ProGuard**: Configure minificação no `build.gradle.kts`
3. **Valide certificados SSL**: Remova `usesCleartextTraffic="true"`
4. **Chaves seguras**: Use Android Keystore para armazenar tokens

### Configuração Recomendada para Produção
```kotlin
// NetworkModule.kt - Para produção
@Provides
@Singleton
fun provideLoggingInterceptor(): HttpLoggingInterceptor {
    return HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.NONE // Desabilitar logs em produção
    }
}
```

## 📞 Suporte

Se encontrar problemas durante a configuração:

1. Verifique se seguiu todos os passos deste guia
2. Consulte os logs do Android Studio (Logcat)
3. Verifique a documentação do Supabase
4. Abra uma issue no repositório com detalhes do problema

---

**✅ Configuração concluída com sucesso!** 

Agora você deve ter o aplicativo funcionando corretamente. Para mais informações sobre uso e funcionalidades, consulte o [README.md](README.md).