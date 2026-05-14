-- ============================================================
--  MIGRAÇÃO: Tabela de Avisos
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS aviso (
    id              BIGSERIAL   PRIMARY KEY,
    titulo          VARCHAR(200) NOT NULL,
    mensagem        TEXT        NOT NULL,
    responsavel_id  INT         NOT NULL REFERENCES usuario(id),
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo            VARCHAR(20) NOT NULL DEFAULT 'todos',
    usuarios_alvo   JSONB,
    perfis_alvo     JSONB,
    imagem_url      TEXT
);

ALTER TABLE aviso DISABLE ROW LEVEL SECURITY;
GRANT ALL ON aviso TO anon;
GRANT ALL ON aviso TO authenticated;
GRANT USAGE ON SEQUENCE aviso_id_seq TO anon;
GRANT USAGE ON SEQUENCE aviso_id_seq TO authenticated;
