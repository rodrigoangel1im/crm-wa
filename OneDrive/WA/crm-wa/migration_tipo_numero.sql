-- ============================================================
--  MIGRAÇÃO: Tipo de Número
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS tipo_numero (
    id          BIGSERIAL   PRIMARY KEY,
    nome        VARCHAR(50) NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tipo_numero (nome) VALUES
  ('oficial'),
  ('nao_oficial')
ON CONFLICT DO NOTHING;

ALTER TABLE whatsapp ADD COLUMN IF NOT EXISTS tipo_numero_id BIGINT REFERENCES tipo_numero(id);

UPDATE whatsapp SET tipo_numero_id = (SELECT id FROM tipo_numero WHERE nome = 'oficial') WHERE tipo = 'oficial';
UPDATE whatsapp SET tipo_numero_id = (SELECT id FROM tipo_numero WHERE nome = 'nao_oficial') WHERE tipo = 'nao_oficial' OR tipo_numero_id IS NULL;

ALTER TABLE whatsapp DROP COLUMN IF EXISTS tipo;
