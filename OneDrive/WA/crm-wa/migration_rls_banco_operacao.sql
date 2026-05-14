-- Habilita RLS na tabela (caso não esteja)
ALTER TABLE banco_operacao ENABLE ROW LEVEL SECURITY;

-- Permite SELECT para todos os usuários autenticados
DROP POLICY IF EXISTS "Todos podem SELECT" ON banco_operacao;
CREATE POLICY "Todos podem SELECT" ON banco_operacao
  FOR SELECT TO authenticated
  USING (true);

-- Permite INSERT apenas para administradores
DROP POLICY IF EXISTS "Admin pode INSERT" ON banco_operacao;
CREATE POLICY "Admin pode INSERT" ON banco_operacao
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE auth_user_id = auth.uid()
      AND admin = true
    )
  );

-- Permite UPDATE apenas para administradores
DROP POLICY IF EXISTS "Admin pode UPDATE" ON banco_operacao;
CREATE POLICY "Admin pode UPDATE" ON banco_operacao
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE auth_user_id = auth.uid()
      AND admin = true
    )
  );

-- Permite DELETE apenas para administradores
DROP POLICY IF EXISTS "Admin pode DELETE" ON banco_operacao;
CREATE POLICY "Admin pode DELETE" ON banco_operacao
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuario
      WHERE auth_user_id = auth.uid()
      AND admin = true
    )
  );
