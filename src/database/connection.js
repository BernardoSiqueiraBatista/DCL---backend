import pg from 'pg';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASS,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => logger.debug('Nova conexão PostgreSQL estabelecida no pool.'));
pool.on('error',   (err) => { logger.error('Erro inesperado no pool PostgreSQL:', err.message); process.exit(1); });

export async function query(text, params) {
  const start  = Date.now();
  const result = await pool.query(text, params);
  logger.debug(`Query executada em ${Date.now() - start}ms | Linhas: ${result.rowCount}`);
  return result;
}

export async function getClient() {
  return pool.connect();
}

export async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.info('✅ PostgreSQL conectado com sucesso.');
  } finally {
    client.release();
  }
}

export { pool };
