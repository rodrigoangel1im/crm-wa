-- ============================================================
--  MIGRAÇÃO: Campanhas - Completa
--  Criar tabelas, colunas, RLS e seeds
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 0. Desabilitar RLS para permitir consultas
ALTER TABLE IF EXISTS tipo_campanha DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS canal_recebimento DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campanha DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp DISABLE ROW LEVEL SECURITY;

-- 1. Tipo de Campanha
CREATE TABLE IF NOT EXISTS tipo_campanha (
    id          BIGSERIAL   PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   TEXT,
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

GRANT ALL ON tipo_campanha TO anon;
GRANT ALL ON tipo_campanha TO authenticated;
GRANT USAGE ON SEQUENCE tipo_campanha_id_seq TO anon;
GRANT USAGE ON SEQUENCE tipo_campanha_id_seq TO authenticated;

INSERT INTO tipo_campanha (nome, descricao) VALUES
  ('Discadora', 'Campanha com discagem automática'),
  ('Disparo de SMS', 'Campanha de disparo de SMS'),
  ('E-mail Marketing', 'Campanha de e-mail marketing'),
  ('WhatsApp', 'Campanha via WhatsApp'),
  ('URA', 'Campanha de URA')
ON CONFLICT DO NOTHING;

-- 2. Canal de Recebimento
CREATE TABLE IF NOT EXISTS canal_recebimento (
    id          BIGSERIAL   PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

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

-- 3. Campanha (principal)
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
    nome_base           VARCHAR(255),
    ativo               BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_por          INT         REFERENCES usuario(id)
);

GRANT ALL ON campanha TO anon;
GRANT ALL ON campanha TO authenticated;
GRANT USAGE ON SEQUENCE campanha_id_seq TO anon;
GRANT USAGE ON SEQUENCE campanha_id_seq TO authenticated;

CREATE INDEX IF NOT EXISTS idx_campanha_tipo_campanha_id ON campanha(tipo_campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanha_convenio_id       ON campanha(convenio_id);
CREATE INDEX IF NOT EXISTS idx_campanha_criado_em         ON campanha(criado_em DESC);

-- 4. WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp (
    id                  BIGSERIAL   PRIMARY KEY,
    numero              VARCHAR(20) NOT NULL,
    tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('oficial', 'nao_oficial')),
    canal_recebimento_id BIGINT     NOT NULL REFERENCES canal_recebimento(id),
    ativo               BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE whatsapp ADD COLUMN IF NOT EXISTS usuario_id INT REFERENCES usuario(id) ON DELETE SET NULL;

GRANT ALL ON whatsapp TO anon;
GRANT ALL ON whatsapp TO authenticated;
GRANT USAGE ON SEQUENCE whatsapp_id_seq TO anon;
GRANT USAGE ON SEQUENCE whatsapp_id_seq TO authenticated;

INSERT INTO whatsapp (numero, tipo, canal_recebimento_id) VALUES
  ('11911111111', 'nao_oficial', 1),
  ('22922222222', 'oficial', 1)
ON CONFLICT DO NOTHING;

-- 5. Tabela de relacionamento campanha x whatsapp
CREATE TABLE IF NOT EXISTS campanha_whatsapp (
    id          BIGSERIAL   PRIMARY KEY,
    campanha_id BIGINT      NOT NULL REFERENCES campanha(id) ON DELETE CASCADE,
    whatsapp_id BIGINT      NOT NULL REFERENCES whatsapp(id) ON DELETE CASCADE,
    UNIQUE(campanha_id, whatsapp_id)
);

GRANT ALL ON campanha_whatsapp TO anon;
GRANT ALL ON campanha_whatsapp TO authenticated;
GRANT USAGE ON SEQUENCE campanha_whatsapp_id_seq TO anon;
GRANT USAGE ON SEQUENCE campanha_whatsapp_id_seq TO authenticated;

-- 6. Adicionar colunas que possam estar faltando (caso tabela já exista)
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS nome_base_drive VARCHAR(255);
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS origem_base     VARCHAR(255);
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS telefonia       VARCHAR(255);
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS nome_campanha   VARCHAR(255);
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS mensagem        TEXT;
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS origem          VARCHAR(255);
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS nome_base       VARCHAR(255);
