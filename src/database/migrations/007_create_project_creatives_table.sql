-- Task 6 — Criativos (imagens) gerados por projeto.
-- Loga modelo e custo de cada geração para a análise de custo-benefício (ADR).

CREATE TABLE IF NOT EXISTS project_creatives (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  variacao      INTEGER       NOT NULL DEFAULT 1,
  url           TEXT          NOT NULL,
  modelo_usado  VARCHAR(60),
  custo_cents   INTEGER       NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_creatives_project_id ON project_creatives(project_id);
