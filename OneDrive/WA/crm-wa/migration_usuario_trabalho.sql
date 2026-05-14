-- ============================================================
--  MIGRAÇÃO: Ajustes nos dados de trabalho do usuario
--  Remove empresa/renda, adiciona posicao, salario,
--  vale_transporte, email_corporativo
--  Aplicar no SQL Editor do Supabase
-- ============================================================

ALTER TABLE usuario DROP COLUMN IF EXISTS empresa;
ALTER TABLE usuario DROP COLUMN IF EXISTS renda;

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS posicao VARCHAR(50);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS salario DECIMAL(10,2);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS vale_transporte DECIMAL(10,2);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS email_corporativo VARCHAR(255);
