-- ============================================================================
-- DC Lab — Schema completo (Tasks 1 a 6)
-- Cole este arquivo inteiro no Supabase Dashboard → SQL Editor → Run.
-- Alternativa: configure DATABASE_URL no .env e rode `npm run migrate`.
-- Idempotente: pode ser re-executado com segurança.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Funções de trigger para timestamps -----------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_atualizado_em_column()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ─── Task 1 — Auth ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','manager')),
  avatar_url    TEXT,
  is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(6)  NOT NULL,
  type       VARCHAR(50) NOT NULL CHECK (type IN ('email_verification','password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code    ON otp_codes(code);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens(token);

-- ─── Tasks 3 e 4 — Clientes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome          VARCHAR(255) NOT NULL,
  email_contato VARCHAR(255),
  telefone      VARCHAR(50),
  setor         VARCHAR(120),
  site          TEXT,
  descricao     TEXT,
  tom_de_voz    VARCHAR(120),
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  deleted_at    TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_setor   ON clients(setor);
CREATE INDEX IF NOT EXISTS idx_clients_ativo   ON clients(ativo);
DROP TRIGGER IF EXISTS clients_atualizado_em ON clients;
CREATE TRIGGER clients_atualizado_em BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em_column();

-- ─── Tasks 5 e 6 — Projetos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  cliente_id        UUID         NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  titulo            VARCHAR(255) NOT NULL,
  area_atuacao      VARCHAR(120),
  tipo_criativo     VARCHAR(60),
  tamanho           VARCHAR(20),
  prompt            TEXT         NOT NULL,
  diferenciais      JSONB        NOT NULL DEFAULT '[]'::jsonb,
  prompt_final      TEXT,
  status            VARCHAR(20)  NOT NULL DEFAULT 'gerando' CHECK (status IN ('gerando','pronto','erro')),
  erro_mensagem     TEXT,
  capa_url          TEXT,
  ultima_geracao_em TIMESTAMPTZ,
  ativo             BOOLEAN      NOT NULL DEFAULT TRUE,
  deleted_at        TIMESTAMPTZ,
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_user_id    ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_cliente_id ON projects(cliente_id);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tipo       ON projects(tipo_criativo);
DROP TRIGGER IF EXISTS projects_atualizado_em ON projects;
CREATE TRIGGER projects_atualizado_em BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em_column();

CREATE TABLE IF NOT EXISTS project_references (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        REFERENCES projects(id) ON DELETE CASCADE,
  upload_id         UUID        NOT NULL,
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url               TEXT        NOT NULL,
  mime_type         VARCHAR(60),
  tamanho_bytes     BIGINT,
  descricao_textual TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_references_project_id ON project_references(project_id);
CREATE INDEX IF NOT EXISTS idx_project_references_upload_id  ON project_references(upload_id);
CREATE INDEX IF NOT EXISTS idx_project_references_user_id    ON project_references(user_id);

CREATE TABLE IF NOT EXISTS project_creatives (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  variacao     INTEGER     NOT NULL DEFAULT 1,
  url          TEXT        NOT NULL,
  modelo_usado VARCHAR(60),
  custo_cents  INTEGER     NOT NULL DEFAULT 0,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_creatives_project_id ON project_creatives(project_id);
