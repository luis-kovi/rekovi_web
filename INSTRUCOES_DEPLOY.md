# Instruções de Deploy - Ajuste de Permissões para Alocar Chofer

## Resumo das Mudanças

Foi implementado um sistema de permissões que permite que usuários com diferentes tipos de permissão (Admin, OnSystem, RVS, Ativa) possam alocar choferes respeitando as seguintes regras:

1. **Admin** - pode alocar chofer de todas as empresas
2. **OnSystem** - podem alocar apenas casos onde empresa responsável no card seja OnSystem
3. **RVS** - podem alocar apenas casos onde empresa responsável no card seja RVS
4. **Ativa** - podem alocar apenas casos onde empresa responsável no card seja Ativa

## Arquivos Modificados

1. `/app/api/chofers/route.ts` - Nova API para buscar choferes disponíveis
2. `/components/CardModal.tsx` - Atualizado para usar a nova API (versão desktop)
3. `/components/MobileTaskModal.tsx` - Atualizado para usar a nova API (versão mobile)
4. `/supabase/functions/get_available_chofers.sql` - Função RPC para o banco de dados

## Passos para Deploy

### 1. Aplicar a Função RPC no Supabase (RECOMENDADO)

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Função RPC para buscar choferes disponíveis respeitando permissões
CREATE OR REPLACE FUNCTION get_available_chofers(
  p_empresa_responsavel TEXT,
  p_origem_locacao TEXT,
  p_user_email TEXT
)
RETURNS TABLE (
  nome TEXT,
  email TEXT,
  empresa TEXT,
  area_atuacao TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões elevadas
AS $$
DECLARE
  v_user_permission TEXT;
  v_user_empresa TEXT;
  v_can_access BOOLEAN := FALSE;
BEGIN
  -- Buscar permissão e empresa do usuário solicitante
  SELECT permission_type, empresa 
  INTO v_user_permission, v_user_empresa
  FROM pre_approved_users
  WHERE email = p_user_email
  AND status = 'active'
  LIMIT 1;
  
  -- Se usuário não encontrado ou inativo, retornar vazio
  IF v_user_permission IS NULL THEN
    RETURN;
  END IF;
  
  -- Verificar permissões baseado no tipo de usuário
  CASE v_user_permission
    WHEN 'admin' THEN
      -- Admin pode ver choferes de todas as empresas
      v_can_access := TRUE;
    WHEN 'onsystem' THEN
      -- OnSystem pode ver apenas choferes da empresa OnSystem
      v_can_access := LOWER(p_empresa_responsavel) = 'onsystem';
    WHEN 'rvs' THEN
      -- RVS pode ver apenas choferes da empresa RVS
      v_can_access := LOWER(p_empresa_responsavel) = 'rvs';
    WHEN 'ativa' THEN
      -- Ativa pode ver apenas choferes da empresa Ativa
      v_can_access := LOWER(p_empresa_responsavel) = 'ativa';
    ELSE
      v_can_access := FALSE;
  END CASE;
  
  -- Se não tem permissão, retornar vazio
  IF NOT v_can_access THEN
    RETURN;
  END IF;
  
  -- Retornar choferes da empresa especificada
  RETURN QUERY
  SELECT 
    u.nome,
    u.email,
    u.empresa,
    u.area_atuacao
  FROM pre_approved_users u
  WHERE u.empresa = p_empresa_responsavel
    AND u.permission_type = 'chofer'
    AND u.status = 'active';
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION get_available_chofers TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION get_available_chofers IS 
'Retorna lista de choferes disponíveis respeitando as permissões do usuário solicitante. 
Admin pode ver todos, outros perfis só podem ver choferes de suas respectivas empresas.';
```

### 2. Alternativa - Ajustar RLS (Row Level Security)

Se preferir não usar a função RPC, você pode ajustar as políticas RLS da tabela `pre_approved_users`:

```sql
-- Criar política para permitir que usuários vejam choferes de suas empresas
CREATE POLICY "Usuários podem ver choferes de suas empresas"
ON pre_approved_users
FOR SELECT
TO authenticated
USING (
  -- Permitir ver choferes se:
  permission_type = 'chofer' AND (
    -- É admin
    EXISTS (
      SELECT 1 FROM pre_approved_users
      WHERE email = auth.email()
      AND permission_type = 'admin'
      AND status = 'active'
    )
    OR
    -- É da mesma empresa
    EXISTS (
      SELECT 1 FROM pre_approved_users u
      WHERE u.email = auth.email()
      AND u.empresa = pre_approved_users.empresa
      AND u.status = 'active'
      AND u.permission_type IN ('onsystem', 'rvs', 'ativa')
    )
  )
);
```

## Como Funciona

### Fluxo da Aplicação

1. Quando o usuário clica em "Alocar Chofer", o sistema faz uma requisição para `/api/chofers`
2. A API verifica as permissões do usuário logado
3. Se usar RPC: chama a função `get_available_chofers` que retorna apenas os choferes permitidos
4. Se usar fallback: verifica permissões manualmente e busca os choferes
5. Filtra os choferes pela área de atuação (cidade)
6. Retorna a lista filtrada para o frontend
7. O usuário vê apenas os choferes que tem permissão para alocar

### Segurança

- A verificação de permissões é feita no backend (server-side)
- A função RPC usa `SECURITY DEFINER` para executar com permissões elevadas
- O fallback mantém compatibilidade caso a função RPC não exista
- Todas as verificações respeitam o status "active" do usuário

## Testes Recomendados

1. **Teste com Admin**: Deve ver choferes de todas as empresas
2. **Teste com OnSystem**: Deve ver apenas choferes da empresa OnSystem
3. **Teste com RVS**: Deve ver apenas choferes da empresa RVS
4. **Teste com Ativa**: Deve ver apenas choferes da empresa Ativa
5. **Teste com usuário inativo**: Não deve conseguir acessar a lista

## Observações

- A API tem um fallback que funciona mesmo sem a função RPC criada
- Os componentes desktop e mobile foram atualizados para usar a mesma API
- A filtragem por área de atuação continua funcionando normalmente
- O chofer atual do card é sempre excluído da lista de opções