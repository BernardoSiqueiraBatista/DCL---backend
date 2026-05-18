CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code        VARCHAR(6)    NOT NULL,
  type        VARCHAR(50)   NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at  TIMESTAMPTZ   NOT NULL,
  used        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code     ON otp_codes(code);
