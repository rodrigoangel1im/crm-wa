-- ============================================================
--  MIGRAÇÃO: Dados complementares do usuario
--  Adiciona colunas de dados pessoais, endereço, contato
--  de emergência, dados financeiros e dados de trabalho
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Dados Pessoais
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS telefone2 VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS perfil VARCHAR(50);

-- 2. Endereço
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

-- 3. Contato de Emergência
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS contato_emergencia_nome VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS contato_emergencia_telefone VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS contato_emergencia_parentesco VARCHAR(50);

-- 4. Dados Financeiros
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS banco VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS agencia VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS conta VARCHAR(20);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS tipo_conta VARCHAR(20);

-- 5. Dados de Trabalho
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS empresa VARCHAR(255);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS renda DECIMAL(10,2);
