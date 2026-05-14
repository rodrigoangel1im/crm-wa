-- ============================================================
--  RLS: Controle de acesso por perfil na tabela proposta
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Habilitar RLS na tabela proposta
ALTER TABLE proposta ENABLE ROW LEVEL SECURITY;

-- 2. Remover policies existentes para evitar duplicatas
DROP POLICY IF EXISTS "Vendedor ve apenas suas propostas" ON proposta;
DROP POLICY IF EXISTS "Vendedor pode inserir propostas" ON proposta;
DROP POLICY IF EXISTS "Operacional ve todas as propostas" ON proposta;
DROP POLICY IF EXISTS "Admin ve todas as propostas" ON proposta;

-- 3. Policy para Vendedor: só vê propostas onde é o digitador
CREATE POLICY "Vendedor ve apenas suas propostas" ON proposta
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE usuario.auth_user_id = auth.uid()
        AND usuario.perfil = 'Vendedor'
        AND proposta.usuario_digitador_id = usuario.id
    )
  );

-- 3b. Policy para Vendedor: pode inserir novas propostas
CREATE POLICY "Vendedor pode inserir propostas" ON proposta
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE usuario.auth_user_id = auth.uid()
        AND usuario.perfil = 'Vendedor'
        AND proposta.usuario_digitador_id = usuario.id
    )
  );

-- 4. Policy para Operacional: vê, insere e edita todas as propostas
CREATE POLICY "Operacional ve todas as propostas" ON proposta
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE usuario.auth_user_id = auth.uid()
        AND usuario.perfil IN ('Operacional', 'Administrador', 'RH', 'Marketing')
    )
  );

-- 4b. Policy para Operacional: pode inserir novas propostas
CREATE POLICY "Operacional pode inserir propostas" ON proposta
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE usuario.auth_user_id = auth.uid()
        AND usuario.perfil IN ('Operacional', 'Administrador', 'RH', 'Marketing')
    )
  );

-- 5. Policy para Admin: vê e edita todas as propostas
CREATE POLICY "Admin ve todas as propostas" ON proposta
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE usuario.auth_user_id = auth.uid()
        AND usuario.admin = TRUE
    )
  );

-- 6. Garantir que as sequences também tenham permissão
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
