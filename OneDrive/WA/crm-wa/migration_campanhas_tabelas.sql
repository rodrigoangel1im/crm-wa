-- ============================================================
--  MIGRAÇÃO: Campanhas - Tabelas do sistema
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de canais de recebimento
CREATE TABLE IF NOT EXISTS canal_recebimento (
    id          BIGSERIAL   PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE canal_recebimento ENABLE ROW LEVEL SECURITY;
GRANT ALL ON canal_recebimento TO anon;
GRANT ALL ON canal_recebimento TO authenticated;
GRANT USAGE ON SEQUENCE canal_recebimento_id_seq TO anon;
GRANT USAGE ON SEQUENCE canal_recebimento_id_seq TO authenticated;

INSERT INTO canal_recebimento (nome) VALUES
  ('WhatsApp'),
  ('E-mail'),
  ('SMS'),
  ('Telefone')
ON CONFLICT DO NOTHING;

-- 2. Tabela principal de campanhas
CREATE TABLE IF NOT EXISTS campanha (
    id                  BIGSERIAL   PRIMARY KEY,
    tipo_campanha_id    BIGINT      NOT NULL REFERENCES tipo_campanha(id),
    convenio_id         BIGINT      NOT NULL REFERENCES convenio(id),
    canal_recebimento_id BIGINT     NOT NULL REFERENCES canal_recebimento(id),
    nome_base_drive     VARCHAR(255),
    origem_base         VARCHAR(255),
    telefonia           VARCHAR(255),
    nome_campanha       VARCHAR(255),
    mensagem            TEXT,
    origem              VARCHAR(255),
    ativo               BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_por          INT         REFERENCES usuario(id)
);

ALTER TABLE campanha ENABLE ROW LEVEL SECURITY;
GRANT ALL ON campanha TO anon;
GRANT ALL ON campanha TO authenticated;
GRANT USAGE ON SEQUENCE campanha_id_seq TO anon;
GRANT USAGE ON SEQUENCE campanha_id_seq TO authenticated;

CREATE INDEX IF NOT EXISTS idx_campanha_tipo_campanha_id ON campanha(tipo_campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanha_convenio_id       ON campanha(convenio_id);
CREATE INDEX IF NOT EXISTS idx_campanha_criado_em         ON campanha(criado_em DESC);
