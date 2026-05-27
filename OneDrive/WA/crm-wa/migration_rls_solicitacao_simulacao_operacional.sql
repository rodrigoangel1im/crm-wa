-- ============================================================
--  MIGRAÇÃO: Permite Operacional gerenciar solicitações
--  Adiciona políticas de SELECT e UPDATE para perfil Operacional
--  em todas as tabelas de simulação
--  Aplicar no SQL Editor do Supabase
-- ============================================================

-- solicitacao_simulacao
DROP POLICY IF EXISTS "Operacional pode ver todas solicitacoes" ON solicitacao_simulacao;
CREATE POLICY "Operacional pode ver todas solicitacoes" ON solicitacao_simulacao
    FOR SELECT TO authenticated
    USING ((SELECT perfil FROM usuario WHERE auth_user_id = auth.uid()) = 'Operacional');

DROP POLICY IF EXISTS "Operacional pode atualizar solicitacoes" ON solicitacao_simulacao;
CREATE POLICY "Operacional pode atualizar solicitacoes" ON solicitacao_simulacao
    FOR UPDATE TO authenticated
    USING ((SELECT perfil FROM usuario WHERE auth_user_id = auth.uid()) = 'Operacional');

-- informacoes_pessoais_simulacao
DROP POLICY IF EXISTS "Operacional ve dados de todas solicitacoes" ON informacoes_pessoais_simulacao;
CREATE POLICY "Operacional ve dados de todas solicitacoes" ON informacoes_pessoais_simulacao
    FOR SELECT TO authenticated
    USING ((SELECT perfil FROM usuario WHERE auth_user_id = auth.uid()) = 'Operacional');

-- matricula_simulacao
DROP POLICY IF EXISTS "Operacional ve matriculas de todas solicitacoes" ON matricula_simulacao;
CREATE POLICY "Operacional ve matriculas de todas solicitacoes" ON matricula_simulacao
    FOR SELECT TO authenticated
    USING ((SELECT perfil FROM usuario WHERE auth_user_id = auth.uid()) = 'Operacional');

-- contratos_simulacao
DROP POLICY IF EXISTS "Operacional ve contratos de todas solicitacoes" ON contratos_simulacao;
CREATE POLICY "Operacional ve contratos de todas solicitacoes" ON contratos_simulacao
    FOR SELECT TO authenticated
    USING ((SELECT perfil FROM usuario WHERE auth_user_id = auth.uid()) = 'Operacional');

-- solicitacao_simulacao_arquivo
DROP POLICY IF EXISTS "Operacional ve arquivos de todas solicitacoes" ON solicitacao_simulacao_arquivo;
CREATE POLICY "Operacional ve arquivos de todas solicitacoes" ON solicitacao_simulacao_arquivo
    FOR SELECT TO authenticated
    USING ((SELECT perfil FROM usuario WHERE auth_user_id = auth.uid()) = 'Operacional');
