-- ============================================================
--  MIGRAÇÃO: Documentos do usuario
--  Cria tabela para armazenar documentos de cada usuario
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS usuario_documento (
    id          BIGSERIAL    PRIMARY KEY,
    usuario_id  INT          NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nome        VARCHAR(255) NOT NULL,
    tipo        VARCHAR(50),
    arquivo_url TEXT,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    criado_por  INT          REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_documento_usuario_id ON usuario_documento(usuario_id);

ALTER TABLE usuario_documento DISABLE ROW LEVEL SECURITY;
GRANT ALL ON usuario_documento TO anon;
GRANT ALL ON usuario_documento TO authenticated;
GRANT USAGE ON SEQUENCE usuario_documento_id_seq TO anon;
GRANT USAGE ON SEQUENCE usuario_documento_id_seq TO authenticated;
