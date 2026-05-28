-- ============================================================
--  RPC: Contar propostas pelo último histórico (AND / PEN)
--  Aplicar no SQL Editor do Supabase
-- ============================================================

CREATE OR REPLACE FUNCTION public.contar_propostas_por_historico(p_historico TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM proposta_historico ph
  WHERE ph.id = (
    SELECT ph2.id
    FROM proposta_historico ph2
    WHERE ph2.proposta_id = ph.proposta_id
    ORDER BY ph2.criado_em DESC
    LIMIT 1
  )
  AND ph.dados->>'proposta_status_id' IN (
    SELECT ps.id::text
    FROM proposta_status ps
    WHERE ps.historico = p_historico
  );
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.contar_propostas_por_historico TO authenticated;
