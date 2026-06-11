-- Task 6 — Referências gráficas enviadas pelo usuário (até 5 por projeto)
-- `descricao_textual` é gerada pelo LLM a partir da imagem e entra no contexto do prompt.

CREATE TABLE IF NOT EXISTS project_references (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID          REFERENCES projects(id) ON DELETE CASCADE,
  upload_id         UUID          NOT NULL,                 -- id retornado por POST /projects/uploads
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url               TEXT          NOT NULL,
  mime_type         VARCHAR(60),
  tamanho_bytes     BIGINT,
  descricao_textual TEXT,
  criado_em         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_references_project_id ON project_references(project_id);
CREATE INDEX IF NOT EXISTS idx_project_references_upload_id  ON project_references(upload_id);
CREATE INDEX IF NOT EXISTS idx_project_references_user_id    ON project_references(user_id);
