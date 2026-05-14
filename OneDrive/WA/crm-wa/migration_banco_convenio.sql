-- ============================================================
--  Migration: Vincular bancos a convênios
--  Cria a tabela banco_convenio para permitir que cada banco
--  tenha apenas os convênios com os quais trabalha
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de junção banco_convenio
CREATE TABLE IF NOT EXISTS banco_convenio (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  banco_id BIGINT NOT NULL REFERENCES banco_operacao(id) ON DELETE CASCADE,
  convenio_id BIGINT NOT NULL REFERENCES convenio(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(banco_id, convenio_id)
);

-- 2. Habilitar RLS
ALTER TABLE banco_convenio ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Todos podem ver banco_convenio" ON banco_convenio;
CREATE POLICY "Todos podem ver banco_convenio" ON banco_convenio
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin pode gerenciar banco_convenio" ON banco_convenio;
CREATE POLICY "Admin pode gerenciar banco_convenio" ON banco_convenio
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuario WHERE usuario.auth_user_id = auth.uid() AND usuario.admin = TRUE)
  );

-- 4. Garantir acesso à tabela e sequence para os roles do Supabase
GRANT SELECT, INSERT, UPDATE, DELETE ON banco_convenio TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 5. (Opcional) Vincular todos os convênios ativos a todos os bancos ativos
--    para não quebrar o funcionamento atual. Execute apenas se quiser
--    manter o comportamento atual como padrão.
-- INSERT INTO banco_convenio (banco_id, convenio_id)
-- SELECT b.id, c.id
-- FROM banco_operacao b, convenio c
-- WHERE b.ativo = true AND c.ativo = true
-- ON CONFLICT (banco_id, convenio_id) DO NOTHING;
