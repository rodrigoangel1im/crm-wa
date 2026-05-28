-- ============================================================
--  MIGRAÇÃO: Função para admin redefinir senha de usuário
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_reset_password(p_usuario_id INT, p_new_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Verifica se o chamador é admin
  SELECT admin INTO v_is_admin FROM usuario WHERE auth_user_id = auth.uid();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem redefinir senhas';
  END IF;

  -- Busca o auth_user_id do usuario
  SELECT auth_user_id INTO v_auth_user_id FROM usuario WHERE id = p_usuario_id;
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado ou sem vinculo com autenticação';
  END IF;

  -- Atualiza a senha no auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_auth_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário de autenticação não encontrado';
  END IF;

  RETURN p_new_password;
END;
$$;

-- Permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION public.admin_reset_password TO authenticated;
