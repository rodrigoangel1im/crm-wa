-- ============================================================
--  MIGRAÇÃO: Permissões do Menu (Sidebar)
--  Adiciona recursos de navegação para controle de menu
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- Adiciona permissoes para cada item do menu
-- Admin: gerenciar tudo
-- Demais usuarios: visualizar por padrao

-- Início
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'inicio',        CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Contratos
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'contratos',     CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Simulações (standalone)
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'simulacoes',    CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Esteira - Simulações
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'esteira-simulacoes', CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Esteira - Propostas
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'propostas',     CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Esteira - Pagas/Canceladas
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'pagas-canceladas', CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Financeiro
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'financeiro',    CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Base de Conhecimento
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'base-conhecimento', CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Configurações (só admin)
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'configuracoes', 'gerenciar' FROM usuario WHERE admin = TRUE
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Perfil
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'perfil',        CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Usuários (só admin)
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'usuarios',      CASE WHEN admin THEN 'gerenciar' ELSE 'nenhum' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;

-- Relatórios
INSERT INTO usuario_permissao (usuario_id, recurso, permissao)
SELECT id, 'relatorios',    CASE WHEN admin THEN 'gerenciar' ELSE 'visualizar' END FROM usuario
ON CONFLICT (usuario_id, recurso) DO NOTHING;
