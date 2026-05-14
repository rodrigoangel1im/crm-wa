-- ============================================================
--  MIGRAÇÃO: WhatsApp - Números por canal
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp (
    id                  BIGSERIAL   PRIMARY KEY,
    numero              VARCHAR(20) NOT NULL,
    tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('oficial', 'nao_oficial')),
    canal_recebimento_id BIGINT     NOT NULL REFERENCES canal_recebimento(id),
    ativo               BOOLEAN     NOT NULL DEFAULT TRUE,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE whatsapp ENABLE ROW LEVEL SECURITY;
GRANT ALL ON whatsapp TO anon;
GRANT ALL ON whatsapp TO authenticated;
GRANT USAGE ON SEQUENCE whatsapp_id_seq TO anon;
GRANT USAGE ON SEQUENCE whatsapp_id_seq TO authenticated;

INSERT INTO whatsapp (numero, tipo, canal_recebimento_id) VALUES
  ('11911111111', 'nao_oficial', 1),
  ('22922222222', 'oficial', 1)
ON CONFLICT DO NOTHING;
