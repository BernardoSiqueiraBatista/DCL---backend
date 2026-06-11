-- Task 5 / Task 6 — Projetos
-- `status` segue o ciclo de geração do Step 1 (Task 6), que é o contrato mais
-- detalhado (endpoint /status faz polling sobre ele):
--   gerando | pronto | erro
-- O filtro de "Meus Projetos" (Task 5) opera sobre esse mesmo campo.

CREATE TABLE IF NOT EXISTS projects (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  cliente_id      UUID          NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  titulo          VARCHAR(255)  NOT NULL,
  area_atuacao    VARCHAR(120),
  tipo_criativo   VARCHAR(60),
  tamanho         VARCHAR(20),
  prompt          TEXT          NOT NULL,
  diferenciais    JSONB         NOT NULL DEFAULT '[]'::jsonb,
  prompt_final    TEXT,                                         -- prompt refinado pelo LLM (auditoria)
  status          VARCHAR(20)   NOT NULL DEFAULT 'gerando'
                   CHECK (status IN ('gerando', 'pronto', 'erro')),
  erro_mensagem   TEXT,                                         -- detalhe quando status = 'erro'
  capa_url        TEXT,                                         -- preview (1ª variação) p/ a grid da Task 5
  ultima_geracao_em TIMESTAMPTZ,                                -- base do rate limit de regeneração (6h)
  ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ,                                  -- soft delete
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id     ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_cliente_id  ON projects(cliente_id);
CREATE INDEX IF NOT EXISTS idx_projects_status      ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tipo        ON projects(tipo_criativo);

DROP TRIGGER IF EXISTS projects_atualizado_em ON projects;
CREATE TRIGGER projects_atualizado_em
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em_column();
