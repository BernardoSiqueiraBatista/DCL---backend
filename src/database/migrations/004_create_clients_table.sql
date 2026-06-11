-- Task 3 / Task 4 — Clientes
-- Mantém os nomes de campo em português conforme o contrato de API do escopo.

CREATE TABLE IF NOT EXISTS clients (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome           VARCHAR(255)  NOT NULL,
  email_contato  VARCHAR(255),
  telefone       VARCHAR(50),
  setor          VARCHAR(120),
  site           TEXT,
  descricao      TEXT,
  tom_de_voz     VARCHAR(120),
  ativo          BOOLEAN       NOT NULL DEFAULT TRUE,
  deleted_at     TIMESTAMPTZ,                              -- soft delete (preserva histórico)
  criado_em      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_setor   ON clients(setor);
CREATE INDEX IF NOT EXISTS idx_clients_ativo   ON clients(ativo);

-- Trigger genérico para atualizar a coluna `atualizado_em` nas tabelas de domínio.
CREATE OR REPLACE FUNCTION update_atualizado_em_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clients_atualizado_em ON clients;
CREATE TRIGGER clients_atualizado_em
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em_column();
