import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// __dirname não existe em ESM — reconstruímos a partir do import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  console.log('🚀 Iniciando migrations...\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL       PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT id FROM _migrations WHERE filename = $1',
      [file]
    );

    if (rows.length > 0) {
      console.log(`  ⏭️  Já aplicada: ${file}`);
      continue;
    }

    const sql    = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  ✅ Aplicada: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ❌ Erro na migration ${file}:`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log('\n✨ Migrations concluídas.');
  await pool.end();
}

run().catch((err) => {
  console.error('Erro fatal no script de migrations:', err);
  process.exit(1);
});
