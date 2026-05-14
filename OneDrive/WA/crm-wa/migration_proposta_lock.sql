-- ============================================================
--  MIGRAÇÃO: Lock de Propostas (edição exclusiva)
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS proposta_lock (
    id          BIGSERIAL   PRIMARY KEY,
    proposta_id BIGINT      NOT NULL REFERENCES proposta(id) ON DELETE CASCADE,
    usuario_id  INT         NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    locked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(proposta_id)
);

CREATE INDEX IF NOT EXISTS idx_proposta_lock_proposta_id ON proposta_lock(proposta_id);
CREATE INDEX IF NOT EXISTS idx_proposta_lock_locked_at ON proposta_lock(locked_at);

ALTER TABLE proposta_lock DISABLE ROW LEVEL SECURITY;
GRANT ALL ON proposta_lock TO anon;
GRANT ALL ON proposta_lock TO authenticated;
GRANT USAGE ON SEQUENCE proposta_lock_id_seq TO anon;
GRANT USAGE ON SEQUENCE proposta_lock_id_seq TO authenticated;
