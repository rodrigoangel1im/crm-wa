-- Migration: Criar tabela documento_proposta e configurar Storage

-- 1. Tabela para registrar metadados dos documentos
CREATE TABLE IF NOT EXISTS documento_proposta (
  id SERIAL PRIMARY KEY,
  proposta_id INTEGER NOT NULL REFERENCES proposta(id) ON DELETE CASCADE,
  tipo_documento VARCHAR(100) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes INTEGER,
  mime_type VARCHAR(100),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 2. Permitir select/insert para anon (via RLS)
ALTER TABLE documento_proposta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_documento_proposta"
  ON documento_proposta FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_documento_proposta"
  ON documento_proposta FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_delete_documento_proposta"
  ON documento_proposta FOR DELETE
  TO anon
  USING (true);

-- 3. Bucket do Storage (executar via dashboard SQL ou criar manualmente)
-- NOTA: O bucket "documentos-proposta" precisa ser criado manualmente no dashboard
-- Com as seguintes policies:
--   - SELECT: anon, true
--   - INSERT: anon, true  
--   - DELETE: anon, true
-- Ou execute o bloco abaixo se sua versão do Supabase suportar:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documentos-proposta', 'documentos-proposta', true)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "anon_select_documentos_proposta"
--   ON storage.objects FOR SELECT
--   TO anon
--   USING (bucket_id = 'documentos-proposta');

-- CREATE POLICY "anon_insert_documentos_proposta"
--   ON storage.objects FOR INSERT
--   TO anon
--   WITH CHECK (bucket_id = 'documentos-proposta');

-- CREATE POLICY "anon_delete_documentos_proposta"
--   ON storage.objects FOR DELETE
--   TO anon
--   USING (bucket_id = 'documentos-proposta');
