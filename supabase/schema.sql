-- ================================================================
-- MXM Cimentos — Schema inicial
-- Execute este SQL no painel do Supabase:
--   Dashboard → SQL Editor → New query → Cole e Execute
-- ================================================================

-- Tabela principal
CREATE TABLE IF NOT EXISTS transacoes (
  id                 UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         TIMESTAMPTZ  DEFAULT now()             NOT NULL,
  updated_at         TIMESTAMPTZ  DEFAULT now()             NOT NULL,

  cliente            TEXT         NOT NULL,
  marca_cimento      TEXT         NOT NULL,
  quantidade_sacos   INTEGER      NOT NULL CHECK (quantidade_sacos > 0),
  valor_por_saco     NUMERIC(10, 2) NOT NULL CHECK (valor_por_saco > 0),
  valor_transferido  NUMERIC(10, 2) NOT NULL,
  lucro_esperado     NUMERIC(10, 2) NOT NULL CHECK (lucro_esperado >= 0),

  data_transferencia DATE         NOT NULL,
  data_retorno       DATE,                    -- NULL = ainda não retornou

  observacoes        TEXT         NOT NULL DEFAULT ''
);

-- Auto-atualiza updated_at em qualquer UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transacoes_updated_at ON transacoes;
CREATE TRIGGER trg_transacoes_updated_at
  BEFORE UPDATE ON transacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para queries mais rápidas
CREATE INDEX IF NOT EXISTS idx_transacoes_data_transf
  ON transacoes (data_transferencia DESC);

CREATE INDEX IF NOT EXISTS idx_transacoes_pendentes
  ON transacoes (data_retorno)
  WHERE data_retorno IS NULL;

-- Row Level Security — habilita mas bloqueia acesso anônimo/autenticado
-- O app usa service_role no servidor (bypassa RLS), então isso é só proteção extra
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Sem políticas para anon/authenticated = acesso bloqueado pelo RLS
-- Apenas service_role (usado no servidor Next.js) tem acesso completo

-- ================================================================
-- Verificação: deve retornar "0 rows" (tabela vazia inicial)
-- ================================================================
SELECT count(*) FROM transacoes;
