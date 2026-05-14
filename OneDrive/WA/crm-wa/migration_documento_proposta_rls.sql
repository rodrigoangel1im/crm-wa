-- ============================================================
--  RLS: Permissões na tabela documento_proposta
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Habilitar RLS (caso não esteja)
ALTER TABLE documento_proposta ENABLE ROW LEVEL SECURITY;

-- 2. Remover policies existentes
DROP POLICY IF EXISTS "Usuarios podem ver documentos das suas propostas" ON documento_proposta;
DROP POLICY IF EXISTS "Usuarios podem inserir documentos nas suas propostas" ON documento_proposta;
DROP POLICY IF EXISTS "Usuarios podem deletar documentos das suas propostas" ON documento_proposta;
DROP POLICY IF EXISTS "Admin pode gerenciar todos os documentos" ON documento_proposta;

-- 3. Policy para SELECT: qualquer um pode ver documentos de propostas
CREATE POLICY "Usuarios podem ver documentos das suas propostas" ON documento_proposta
  FOR SELECT TO authenticated
  USING (true);

-- 4. Policy para INSERT: permite inserir documentos
CREATE POLICY "Usuarios podem inserir documentos nas suas propostas" ON documento_proposta
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Policy para DELETE: usuário só deleta se for o digitador da proposta
CREATE POLICY "Usuarios podem deletar documentos das suas propostas" ON documento_proposta
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposta
      WHERE proposta.id = documento_proposta.proposta_id
        AND proposta.usuario_digitador_id = (
          SELECT id FROM usuario WHERE usuario.auth_user_id = auth.uid()
        )
    )
  );

-- 6. Policy para Admin: tudo
CREATE POLICY "Admin pode gerenciar todos os documentos" ON documento_proposta
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuario WHERE usuario.auth_user_id = auth.uid() AND usuario.admin = TRUE)
  );

-- 7. Garantir acesso à tabela
GRANT ALL ON documento_proposta TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
