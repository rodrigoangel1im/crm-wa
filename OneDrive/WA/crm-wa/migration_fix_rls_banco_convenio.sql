-- ============================================================
--  Fix: Permite que qualquer usuário autenticado gerencie
--  banco_convenio (o controle é feito pela interface)
--  Aplicar no SQL Editor do Supabase
-- ============================================================

DROP POLICY IF EXISTS "Todos podem ver banco_convenio" ON banco_convenio;
DROP POLICY IF EXISTS "Admin pode gerenciar banco_convenio" ON banco_convenio;

CREATE POLICY "Autenticados podem gerenciar banco_convenio" ON banco_convenio
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
