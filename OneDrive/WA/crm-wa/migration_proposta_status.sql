-- ============================================================
--  MIGRAÇÃO: Normalizar status da proposta em tabela separada
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de status
CREATE TABLE proposta_status (
    id      SERIAL          PRIMARY KEY,
    nome    VARCHAR(30)     NOT NULL UNIQUE
);

COMMENT ON TABLE proposta_status IS 'Possíveis status de uma proposta';

-- 2. Seed dos status
INSERT INTO proposta_status (nome) VALUES
    ('Em Análise'),
    ('Aprovado'),
    ('Reprovado'),
    ('Cancelado'),
    ('Pendente');

-- 3. Adicionar coluna de FK na proposta
ALTER TABLE proposta ADD COLUMN proposta_status_id INT REFERENCES proposta_status(id);

-- 4. Migrar dados existentes
UPDATE proposta p SET proposta_status_id = s.id
FROM proposta_status s
WHERE s.nome = p.status;

-- 5. Índice
CREATE INDEX idx_proposta_proposta_status ON proposta(proposta_status_id);

-- 6. Permissões para o Supabase anon
GRANT ALL ON proposta_status TO anon;
GRANT USAGE ON SEQUENCE proposta_status_id_seq TO anon;
ALTER TABLE proposta_status DISABLE ROW LEVEL SECURITY;
