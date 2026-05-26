-- ============================================================
--  MIGRAÇÃO: Base de Conhecimento (RAG)
--  Habilita pgvector, cria tabelas, storage e permissões
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabela de documentos
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id          BIGSERIAL    PRIMARY KEY,
    name        TEXT         NOT NULL,
    file_path   TEXT,
    created_by  INT          REFERENCES usuario(id),
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- 3. Tabela de chunks com embedding vetorial
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id           BIGSERIAL    PRIMARY KEY,
    document_id  INT          NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_text   TEXT         NOT NULL,
    embedding    vector(3072),
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_id ON knowledge_chunks(document_id);

-- 4. Função de busca por similaridade (query embedding)
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding vector(3072),
    match_count INT DEFAULT 5,
    min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE(
    chunk_id    BIGINT,
    doc_id      INT,
    doc_name    TEXT,
    chunk_text  TEXT,
    similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kd.id,
        kd.name,
        kc.chunk_text,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kd.id = kc.document_id
    WHERE 1 - (kc.embedding <=> query_embedding) > min_similarity
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. Permissões (permitir acesso via anon key para authenticated)
ALTER TABLE knowledge_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks DISABLE ROW LEVEL SECURITY;

GRANT ALL ON knowledge_documents TO anon;
GRANT ALL ON knowledge_chunks TO anon;
GRANT ALL ON knowledge_documents TO authenticated;
GRANT ALL ON knowledge_chunks TO authenticated;

GRANT USAGE ON SEQUENCE knowledge_documents_id_seq TO anon;
GRANT USAGE ON SEQUENCE knowledge_documents_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE knowledge_chunks_id_seq TO anon;
GRANT USAGE ON SEQUENCE knowledge_chunks_id_seq TO authenticated;

GRANT EXECUTE ON FUNCTION search_knowledge TO anon;
GRANT EXECUTE ON FUNCTION search_knowledge TO authenticated;

-- 6. Bucket Storage para PDFs da base de conhecimento
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('base-conhecimento', 'base-conhecimento', true, false)
ON CONFLICT (id) DO NOTHING;

-- 7. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Upload base conhecimento" ON storage.objects;
DROP POLICY IF EXISTS "Leitura base conhecimento" ON storage.objects;
DROP POLICY IF EXISTS "Remocao base conhecimento" ON storage.objects;

-- 8. Policies do Storage
CREATE POLICY "Upload base conhecimento" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'base-conhecimento');

CREATE POLICY "Leitura base conhecimento" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'base-conhecimento');

CREATE POLICY "Remocao base conhecimento" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'base-conhecimento');
