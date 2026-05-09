-- ================================================================
-- MXM Cimentos — Migration 004: Pagamentos Parciais
-- Execute no Supabase: Dashboard → SQL Editor → New query
-- ================================================================

-- 1. Coluna de controle na tabela principal
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS valor_recebido NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- 2. Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMPTZ   DEFAULT now() NOT NULL,
  transacao_id     UUID          NOT NULL REFERENCES transacoes(id) ON DELETE CASCADE,
  valor            NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  data_pagamento   DATE          NOT NULL,
  observacoes      TEXT          NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_transacao
  ON pagamentos (transacao_id, data_pagamento DESC);

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- 3. Trigger: sincroniza valor_recebido e data_retorno automaticamente
--    Disparado após INSERT ou DELETE em pagamentos.
--    Regra: quando soma de pagamentos >= valor_total → data_retorno = hoje
--           quando soma < valor_total → data_retorno = NULL
CREATE OR REPLACE FUNCTION sync_transacao_recebimento()
RETURNS TRIGGER AS $$
DECLARE
  v_id    UUID;
  v_soma  NUMERIC;
  v_total NUMERIC;
BEGIN
  v_id := COALESCE(NEW.transacao_id, OLD.transacao_id);

  SELECT COALESCE(SUM(valor), 0)
    INTO v_soma
    FROM pagamentos
   WHERE transacao_id = v_id;

  SELECT (valor_transferido + lucro_esperado)
    INTO v_total
    FROM transacoes
   WHERE id = v_id;

  UPDATE transacoes
     SET valor_recebido = v_soma,
         data_retorno   = CASE
                            WHEN v_soma >= v_total THEN CURRENT_DATE
                            ELSE NULL
                          END,
         updated_at     = now()
   WHERE id = v_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pagamentos_sync ON pagamentos;
CREATE TRIGGER trg_pagamentos_sync
  AFTER INSERT OR DELETE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION sync_transacao_recebimento();

-- ================================================================
-- Verificação: deve retornar estrutura da tabela pagamentos
-- ================================================================
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'pagamentos'
 ORDER BY ordinal_position;
