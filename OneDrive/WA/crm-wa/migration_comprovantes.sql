-- ============================================================
--  MIGRAÇÃO: Comprovantes — colunas tps_pago e comprovante_path
--  Aplicar no SQL Editor do Supabase
-- ============================================================

ALTER TABLE proposta ADD COLUMN IF NOT EXISTS tps_pago DECIMAL(12,2);
ALTER TABLE proposta ADD COLUMN IF NOT EXISTS comprovante_path TEXT;
