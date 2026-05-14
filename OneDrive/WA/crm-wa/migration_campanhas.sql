-- ============================================================
--  MIGRAÇÃO: Campanhas - Tipos de Campanha
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de tipos de campanha
CREATE TABLE IF NOT EXISTS tipo_campanha (
    id          BIGSERIAL   PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   TEXT,
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE tipo_campanha ENABLE ROW LEVEL SECURITY;
GRANT ALL ON tipo_campanha TO anon;
GRANT ALL ON tipo_campanha TO authenticated;
GRANT USAGE ON SEQUENCE tipo_campanha_id_seq TO anon;
GRANT USAGE ON SEQUENCE tipo_campanha_id_seq TO authenticated;

-- 2. Seed dos tipos de campanha
INSERT INTO tipo_campanha (nome, descricao) VALUES
  ('Ativa', 'Campanha com abordagem ativa ao cliente'),
  ('Passiva', 'Campanha onde o cliente entra em contato'),
  ('Remarketing', 'Campanha de reengajamento de clientes'),
  ('Sazonal', 'Campanha para datas comemorativas ou sazonais')
ON CONFLICT DO NOTHING;
