import 'dotenv/config';

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ENV] Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
}

// Se DATABASE_URL estiver presente (ex.: connection string do pooler do Supabase),
// ela tem precedência e os parâmetros discretos DB_* deixam de ser obrigatórios.
const DATABASE_URL = process.env.DATABASE_URL || null;

const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database — connection string (Supabase) OU parâmetros discretos (Postgres local)
  DATABASE_URL,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: DATABASE_URL ? process.env.DB_NAME : requireEnv('DB_NAME'),
  DB_USER: DATABASE_URL ? process.env.DB_USER : requireEnv('DB_USER'),
  DB_PASS: DATABASE_URL ? process.env.DB_PASS : requireEnv('DB_PASS'),
  // SSL é exigido pelo Supabase; em Postgres local fica desligado por padrão.
  DB_SSL: (process.env.DB_SSL || (DATABASE_URL ? 'true' : 'false')) === 'true',

  // Supabase (REST/Storage)
  SUPABASE_URL: process.env.SUPABASE_URL || null,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'project-creatives',

  // JWT
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Gmail SMTP
  SMTP_USER: requireEnv('SMTP_USER'),
  SMTP_PASS: requireEnv('SMTP_PASS'),

  // OTP
  OTP_EXPIRES_MINUTES: parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // LLM / Geração de imagens (Tasks 6 e 7)
  // Sem chave configurada, o backend cai num gerador MOCK determinístico
  // (suficiente para validar layout/fluxo, conforme "dados mockados" do escopo).
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
  LLM_TEXT_MODEL: process.env.LLM_TEXT_MODEL || 'gpt-4o-mini',
  IMAGE_MODEL: process.env.IMAGE_MODEL || 'dall-e-3',
  REGENERATE_COOLDOWN_HOURS: parseInt(process.env.REGENERATE_COOLDOWN_HOURS || '6', 10),

  // Uploads (referências gráficas)
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  UPLOAD_MAX_MB: parseInt(process.env.UPLOAD_MAX_MB || '10', 10),
  UPLOAD_MAX_FILES: parseInt(process.env.UPLOAD_MAX_FILES || '5', 10),

  // Helpers
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

export default env;
