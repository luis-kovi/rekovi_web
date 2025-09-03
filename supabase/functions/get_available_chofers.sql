-- Função RPC para buscar choferes disponíveis respeitando permissões
-- Esta função deve ser criada no Supabase usando o SQL Editor

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