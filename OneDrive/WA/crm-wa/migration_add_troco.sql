-- Adiciona coluna troco (numeric) na tabela proposta_parcela
ALTER TABLE proposta_parcela ADD COLUMN IF NOT EXISTS troco numeric;
