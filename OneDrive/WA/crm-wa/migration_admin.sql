-- ============================================================
--  MIGRAÇÃO: Admin - Usuários, Permissões e Logs
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- 1. Vincular usuario à autenticação do Supabase
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS nome        VARCHAR(100);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS email       VARCHAR(150);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS login       VARCHAR(50)  UNIQUE;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS ativo       BOOLEAN      NOT NULL DEFAULT TRUE;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS criado_em   TIMESTAMPTZ  DEFAULT NOW();
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS admin       BOOLEAN      NOT NULL DEFAULT FALSE;

-- 2. Trigger: criar registro em usuario quando um usuário do auth for criado
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuario (auth_user_id, nome, email, login, ativo, admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email,
    split_part(NEW.email, '@', 1),
    TRUE,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Tabela de logs de atividade do usuário
CREATE TABLE IF NOT EXISTS usuario_log (
    id          BIGSERIAL   PRIMARY KEY,
    usuario_id  INT         NOT NULL REFERENCES usuario(id),
    acao        VARCHAR(50) NOT NULL,
    descricao   TEXT,
    dados       JSONB,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuario_log_usuario_id ON usuario_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_log_criado_em  ON usuario_log(criado_em DESC);
ALTER TABLE usuario_log DISABLE ROW LEVEL SECURITY;
GRANT ALL ON usuario_log TO anon;
GRANT ALL ON usuario_log TO authenticated;
GRANT USAGE ON SEQUENCE usuario_log_id_seq TO anon;
GRANT USAGE ON SEQUENCE usuario_log_id_seq TO authenticated;

-- 4. Tabela de permissões por usuário
CREATE TABLE IF NOT EXISTS usuario_permissao (
    id              BIGSERIAL   PRIMARY KEY,
    usuario_id      INT         NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    recurso         VARCHAR(50) NOT NULL,
    permissao       VARCHAR(20) NOT NULL DEFAULT 'visualizar',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(usuario_id, recurso)
);

CREATE INDEX IF NOT EXISTS idx_usuario_permissao_usuario_id ON usuario_permissao(usuario_id);
ALTER TABLE usuario_permissao DISABLE ROW LEVEL SECURITY;
GRANT ALL ON usuario_permissao TO anon;
GRANT ALL ON usuario_permissao TO authenticated;
GRANT USAGE ON SEQUENCE usuario_permissao_id_seq TO anon;
GRANT USAGE ON SEQUENCE usuario_permissao_id_seq TO authenticated;

-- 5. Seed dos recursos disponíveis
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'propostas', 'gerenciar' FROM usuario WHERE admin = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'simulacoes', 'gerenciar' FROM usuario WHERE admin = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'contratos', 'gerenciar' FROM usuario WHERE admin = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'usuarios', 'gerenciar' FROM usuario WHERE admin = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'relatorios', 'visualizar' FROM usuario WHERE admin = TRUE
ON CONFLICT DO NOTHING;
