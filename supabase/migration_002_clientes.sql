-- ================================================================
-- Migration 002 — Cadastro de Clientes
-- Execute no SQL Editor do Supabase
-- ================================================================

-- 1. Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  nome       TEXT        NOT NULL,
  telefone   TEXT,
  email      TEXT,
  cidade     TEXT        NOT NULL,
  ativo      BOOLEAN     NOT NULL DEFAULT true
);

-- 2. Trigger de updated_at para clientes
DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS na tabela clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- Sem políticas para anon = bloqueado; service_role bypassa

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_clientes_nome   ON clientes (nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cidade ON clientes (cidade);
CREATE INDEX IF NOT EXISTS idx_clientes_ativos ON clientes (ativo) WHERE ativo = true;

-- 5. Adiciona coluna cliente_id em transacoes (FK opcional — não quebra dados existentes)
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS cliente_id UUID
    REFERENCES clientes(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transacoes_cliente_id
  ON transacoes (cliente_id)
  WHERE cliente_id IS NOT NULL;

-- ================================================================
-- Verificação
-- ================================================================
SELECT
  (SELECT count(*) FROM clientes) AS total_clientes,
  (SELECT count(*) FROM transacoes WHERE cliente_id IS NOT NULL) AS transacoes_vinculadas;
