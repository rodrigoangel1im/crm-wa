-- ============================================================
--  MIGRAÇÃO: proposta_parcela + dados_simulacao JSONB
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de parcelas da proposta
CREATE TABLE proposta_parcela (
    id              SERIAL          PRIMARY KEY,
    proposta_id     INT             NOT NULL REFERENCES proposta(id) ON DELETE CASCADE,
    tipo            VARCHAR(30)     NOT NULL DEFAULT 'refin',  -- 'refin' | 'pre_portabilidade'
    indice          INT             NOT NULL DEFAULT 0,

    -- Comuns
    valor               NUMERIC(15,2),
    saldo_devedor       NUMERIC(15,2),
    prazo_restante      INT,

    -- Portabilidade
    banco_codigo        VARCHAR(10),
    banco_nome          VARCHAR(100),
    numero_contrato     VARCHAR(50),

    criado_em           TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE proposta_parcela IS 'Parcelas de refinanciamento ou pré-portabilidade da proposta';
COMMENT ON COLUMN proposta_parcela.tipo IS 'refin = parcela de refinanciamento, pre_portabilidade = parcela pré-portabilidade';

CREATE INDEX idx_proposta_parcela_proposta_id ON proposta_parcela(proposta_id);

-- 2. Adicionar coluna dados_simulacao (JSONB) na proposta
ALTER TABLE proposta ADD COLUMN dados_simulacao JSONB;

COMMENT ON COLUMN proposta.dados_simulacao IS 'Dados opcionais da simulação por tipo de operação (motivo, margem agregada, cartão, etc)';

-- 3. GRANTs para anon
GRANT ALL ON proposta_parcela TO anon;
GRANT USAGE ON SEQUENCE proposta_parcela_id_seq TO anon;
