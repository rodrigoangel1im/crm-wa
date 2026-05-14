-- ============================================================
--  MIGRAÇÃO: Campanha Lote
--  Tabela para armazenar lotes de cada esteira de campanha
--  Aplicar no SQL Editor do Supabase
-- ============================================================

ALTER TABLE IF EXISTS campanha_lote DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS campanha_lote (
    id                  BIGSERIAL   PRIMARY KEY,
    id_lote_wa          VARCHAR(255),
    id_lote             VARCHAR(255),
    convenio_lote       VARCHAR(255),
    origem_lote         VARCHAR(255),
    telefonia_lote      VARCHAR(255),
    status              VARCHAR(100),
    eficiencia          DECIMAL(5,2),
    data_criacao        TIMESTAMPTZ,
    tipo_campanha_id    BIGINT      REFERENCES tipo_campanha(id),
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON campanha_lote TO anon;
GRANT ALL ON campanha_lote TO authenticated;
GRANT USAGE ON SEQUENCE campanha_lote_id_seq TO anon;
GRANT USAGE ON SEQUENCE campanha_lote_id_seq TO authenticated;

CREATE INDEX IF NOT EXISTS idx_campanha_lote_tipo_campanha_id ON campanha_lote(tipo_campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanha_lote_status ON campanha_lote(status);
CREATE INDEX IF NOT EXISTS idx_campanha_lote_data_criacao ON campanha_lote(data_criacao DESC);
