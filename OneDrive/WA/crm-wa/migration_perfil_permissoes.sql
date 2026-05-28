-- ============================================================
--  MIGRAÇÃO: Permissões por Perfil (Menu/Sidebar)
--  Define quais itens do menu cada perfil pode ver
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS perfil_permissao (
    id          BIGSERIAL    PRIMARY KEY,
    perfil      VARCHAR(50)  NOT NULL,
    recurso     VARCHAR(50)  NOT NULL,
    permissao   VARCHAR(20)  NOT NULL DEFAULT 'visualizar',
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(perfil, recurso)
);

CREATE INDEX IF NOT EXISTS idx_perfil_permissao_perfil ON perfil_permissao(perfil);
ALTER TABLE perfil_permissao DISABLE ROW LEVEL SECURITY;
GRANT ALL ON perfil_permissao TO anon;
GRANT ALL ON perfil_permissao TO authenticated;
GRANT USAGE ON SEQUENCE perfil_permissao_id_seq TO anon;
GRANT USAGE ON SEQUENCE perfil_permissao_id_seq TO authenticated;

-- Seed: Administrador vê tudo
INSERT INTO perfil_permissao (perfil, recurso, permissao) VALUES
  ('Administrador', 'inicio',              'visualizar'),
  ('Administrador', 'contratos',           'visualizar'),
  ('Administrador', 'simulacoes',          'visualizar'),
  ('Administrador', 'esteira-simulacoes',  'visualizar'),
  ('Administrador', 'propostas',           'visualizar'),
  ('Administrador', 'pagas-canceladas',    'visualizar'),
  ('Administrador', 'financeiro',          'visualizar'),
  ('Administrador', 'base-conhecimento',   'visualizar'),
  ('Administrador', 'higienizacao',        'visualizar'),
  ('Administrador', 'configuracoes',       'visualizar'),
  ('Administrador', 'perfil',              'visualizar'),
  ('Administrador', 'usuarios',            'visualizar'),
  ('Administrador', 'relatorios',          'visualizar')
ON CONFLICT (perfil, recurso) DO NOTHING;

-- Seed: Vendedor (padrão restrito)
INSERT INTO perfil_permissao (perfil, recurso, permissao) VALUES
  ('Vendedor',  'inicio',              'visualizar'),
  ('Vendedor',  'contratos',           'visualizar'),
  ('Vendedor',  'simulacoes',          'nenhum'),
  ('Vendedor',  'esteira-simulacoes',  'visualizar'),
  ('Vendedor',  'propostas',           'visualizar'),
  ('Vendedor',  'pagas-canceladas',    'visualizar'),
  ('Vendedor',  'financeiro',          'nenhum'),
  ('Vendedor',  'base-conhecimento',   'nenhum'),
  ('Vendedor',  'higienizacao',        'nenhum'),
  ('Vendedor',  'configuracoes',       'nenhum'),
  ('Vendedor',  'perfil',              'visualizar'),
  ('Vendedor',  'usuarios',            'nenhum'),
  ('Vendedor',  'relatorios',          'nenhum')
ON CONFLICT (perfil, recurso) DO NOTHING;

-- Seed: Operacional
INSERT INTO perfil_permissao (perfil, recurso, permissao) VALUES
  ('Operacional', 'inicio',              'visualizar'),
  ('Operacional', 'contratos',           'visualizar'),
  ('Operacional', 'simulacoes',          'visualizar'),
  ('Operacional', 'esteira-simulacoes',  'visualizar'),
  ('Operacional', 'propostas',           'visualizar'),
  ('Operacional', 'pagas-canceladas',    'visualizar'),
  ('Operacional', 'financeiro',          'visualizar'),
  ('Operacional', 'base-conhecimento',   'visualizar'),
  ('Operacional', 'higienizacao',        'visualizar'),
  ('Operacional', 'configuracoes',       'nenhum'),
  ('Operacional', 'perfil',              'visualizar'),
  ('Operacional', 'usuarios',            'nenhum'),
  ('Operacional', 'relatorios',          'visualizar')
ON CONFLICT (perfil, recurso) DO NOTHING;

-- Seed: RH
INSERT INTO perfil_permissao (perfil, recurso, permissao) VALUES
  ('RH',        'inicio',              'visualizar'),
  ('RH',        'contratos',           'nenhum'),
  ('RH',        'simulacoes',          'nenhum'),
  ('RH',        'esteira-simulacoes',  'nenhum'),
  ('RH',        'propostas',           'nenhum'),
  ('RH',        'pagas-canceladas',    'nenhum'),
  ('RH',        'financeiro',          'nenhum'),
  ('RH',        'base-conhecimento',   'visualizar'),
  ('RH',        'higienizacao',        'nenhum'),
  ('RH',        'configuracoes',       'nenhum'),
  ('RH',        'perfil',              'visualizar'),
  ('RH',        'usuarios',            'nenhum'),
  ('RH',        'relatorios',          'nenhum')
ON CONFLICT (perfil, recurso) DO NOTHING;

-- Seed: Marketing
INSERT INTO perfil_permissao (perfil, recurso, permissao) VALUES
  ('Marketing', 'inicio',              'visualizar'),
  ('Marketing', 'contratos',           'nenhum'),
  ('Marketing', 'simulacoes',          'nenhum'),
  ('Marketing', 'esteira-simulacoes',  'nenhum'),
  ('Marketing', 'propostas',           'visualizar'),
  ('Marketing', 'pagas-canceladas',    'nenhum'),
  ('Marketing', 'financeiro',          'nenhum'),
  ('Marketing', 'base-conhecimento',   'visualizar'),
  ('Marketing', 'higienizacao',        'nenhum'),
  ('Marketing', 'configuracoes',       'nenhum'),
  ('Marketing', 'perfil',              'visualizar'),
  ('Marketing', 'usuarios',            'nenhum'),
  ('Marketing', 'relatorios',          'visualizar')
ON CONFLICT (perfil, recurso) DO NOTHING;
