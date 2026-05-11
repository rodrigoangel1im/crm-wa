-- ============================================================
--  MIGRAÇÃO: Separar tabela banco em banco_operacao + banco_recebimento
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Remover FK de dados_bancarios antes de renomear a coluna
ALTER TABLE dados_bancarios DROP CONSTRAINT IF EXISTS dados_bancarios_banco_id_fkey;

-- 2. Renomear banco → banco_operacao
--    (FKs de proposta.banco_credor_id e banco_tipo_operacao.banco_id acompanham automaticamente)
ALTER TABLE banco RENAME TO banco_operacao;

-- 3. Atualizar comentário da tabela
COMMENT ON TABLE banco_operacao IS 'Instituições financeiras que operam crédito consignado (banco credor da proposta)';

-- 4. Criar tabela banco_recebimento (mesma estrutura)
CREATE TABLE banco_recebimento (
    id          SERIAL          PRIMARY KEY,
    nome        VARCHAR(100)    NOT NULL,
    codigo      VARCHAR(10)     NOT NULL UNIQUE,
    ispb        VARCHAR(8)      UNIQUE,
    criado_em   TIMESTAMP       NOT NULL DEFAULT NOW(),
    ativo       BOOLEAN         NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE banco_recebimento IS 'Instituições financeiras para recebimento do cliente';

-- 5. Copiar todos os bancos existentes para banco_recebimento
INSERT INTO banco_recebimento (nome, codigo, ispb, criado_em, ativo)
SELECT nome, codigo, ispb, criado_em, ativo FROM banco_operacao;

-- 6. Renomear a coluna em dados_bancarios
ALTER TABLE dados_bancarios RENAME COLUMN banco_id TO banco_recebimento_id;

-- 7. Recriar FK apontando para banco_recebimento
ALTER TABLE dados_bancarios ADD CONSTRAINT dados_bancarios_banco_recebimento_id_fkey
    FOREIGN KEY (banco_recebimento_id) REFERENCES banco_recebimento(id);
