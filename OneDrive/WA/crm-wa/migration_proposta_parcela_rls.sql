-- Desabilitar RLS na tabela proposta_parcela (solução simples)
ALTER TABLE proposta_parcela DISABLE ROW LEVEL SECURITY;

-- Ou, se quiser manter RLS, criar policy:
-- CREATE POLICY "anon_all_proposta_parcela" ON proposta_parcela
--   FOR ALL TO anon
--   USING (true)
--   WITH CHECK (true);
