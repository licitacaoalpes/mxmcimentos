-- ================================================================
-- Migration 003 — Marcas de Cimento
-- Execute no SQL Editor do Supabase
-- ================================================================

CREATE TABLE IF NOT EXISTS marcas_cimento (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  nome       TEXT        NOT NULL UNIQUE,
  ativo      BOOLEAN     NOT NULL DEFAULT true,
  ordem      INTEGER     NOT NULL DEFAULT 0  -- controla a ordem no select
);

ALTER TABLE marcas_cimento ENABLE ROW LEVEL SECURITY;
-- sem políticas = só service_role acessa

CREATE INDEX IF NOT EXISTS idx_marcas_ativas ON marcas_cimento (ordem) WHERE ativo = true;

-- Seed inicial
INSERT INTO marcas_cimento (nome, ordem) VALUES
  ('FACIMENT', 1),
  ('POTY',     2)
ON CONFLICT (nome) DO NOTHING;

-- ================================================================
-- Para adicionar novas marcas no futuro, basta:
--   INSERT INTO marcas_cimento (nome, ordem) VALUES ('NOVA MARCA', 3);
-- Para desativar sem excluir:
--   UPDATE marcas_cimento SET ativo = false WHERE nome = 'MARCA';
-- ================================================================

SELECT nome, ativo, ordem FROM marcas_cimento ORDER BY ordem;
