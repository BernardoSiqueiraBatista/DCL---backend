import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Seed de dados mockados realistas (Tasks 2 e 4): sem dados, o dashboard e a
// listagem de clientes não "provam" o layout. Idempotente por e-mail do usuário.
// Self-contained (como migrate.js) p/ não exigir SMTP/JWT no ambiente.

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || null;
const useSsl = (process.env.DB_SSL || (DATABASE_URL ? 'true' : 'false')) === 'true';
const ssl = useSsl ? { rejectUnauthorized: false } : false;

const pool = new Pool(
  DATABASE_URL
    ? { connectionString: DATABASE_URL, ssl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        ssl,
      }
);

const DEMO_EMAIL = process.env.SEED_EMAIL || 'demo@dclab.com';
const DEMO_PASS = process.env.SEED_PASSWORD || 'Demo1234';

const CLIENTES = [
  { nome: 'Estúdio Bossa', setor: 'Moda', email_contato: 'contato@bossa.com', telefone: '+55 11 99999-0000', site: 'https://bossa.com', descricao: 'Marca de roupas casuais femininas', tom_de_voz: 'casual_e_inspirador' },
  { nome: 'FitLab Academia', setor: 'Fitness', email_contato: 'mkt@fitlab.com', telefone: '+55 21 98888-1111', site: 'https://fitlab.com', descricao: 'Rede de academias premium', tom_de_voz: 'energetico_e_motivador' },
  { nome: 'Verde Cozinha', setor: 'Alimentação', email_contato: 'ola@verde.com', telefone: '+55 31 97777-2222', site: 'https://verde.com', descricao: 'Restaurante plant-based', tom_de_voz: 'acolhedor_e_natural' },
  { nome: 'Nimbus Tech', setor: 'Tecnologia', email_contato: 'hi@nimbus.io', telefone: '+55 11 96666-3333', site: 'https://nimbus.io', descricao: 'SaaS de produtividade', tom_de_voz: 'direto_e_confiavel' },
  { nome: 'Aurora Beauty', setor: 'Beleza', email_contato: 'sac@aurora.com', telefone: '+55 41 95555-4444', site: 'https://aurora.com', descricao: 'Cosméticos veganos', tom_de_voz: 'elegante_e_delicado' },
];

const TIPOS = ['post_quadrado', 'story', 'reels_capa', 'banner'];
const TAMANHOS = { post_quadrado: '1:1', story: '9:16', reels_capa: '9:16', banner: '16:9' };
const STATUS = ['pronto', 'pronto', 'pronto', 'gerando', 'erro'];

async function run() {
  console.log(`🌱 Semeando dados para ${DEMO_EMAIL}...\n`);

  // 1) Usuário demo (verificado)
  const hash = await bcrypt.hash(DEMO_PASS, 12);
  const { rows: userRows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, is_verified)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (email) DO UPDATE SET is_verified = TRUE
     RETURNING id`,
    ['Usuário Demo', DEMO_EMAIL, hash]
  );
  const userId = userRows[0].id;
  console.log(`  ✅ Usuário demo: ${userId} (senha: ${DEMO_PASS})`);

  // Evita duplicar seed: se já há clientes, não reinsere.
  const { rows: existing } = await pool.query(
    'SELECT COUNT(*)::int AS total FROM clients WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
  if (existing[0].total > 0) {
    console.log(`  ⏭️  Já existem ${existing[0].total} clientes — seed ignorado.`);
    await pool.end();
    return;
  }

  // 2) Clientes
  const clientIds = [];
  for (const c of CLIENTES) {
    const { rows } = await pool.query(
      `INSERT INTO clients (user_id, nome, email_contato, telefone, setor, site, descricao, tom_de_voz)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [userId, c.nome, c.email_contato, c.telefone, c.setor, c.site, c.descricao, c.tom_de_voz]
    );
    clientIds.push({ id: rows[0].id, setor: c.setor, nome: c.nome });
  }
  console.log(`  ✅ ${clientIds.length} clientes inseridos.`);

  // 3) Projetos (12) distribuídos entre clientes, com status variados + criativos
  let projetos = 0;
  let criativos = 0;
  for (let i = 0; i < 12; i++) {
    const cli = clientIds[i % clientIds.length];
    const tipo = TIPOS[i % TIPOS.length];
    const status = STATUS[i % STATUS.length];
    const seed = 1000 + i;
    const capa = status === 'pronto' ? `https://picsum.photos/seed/${seed}/1024/1024` : null;

    const { rows } = await pool.query(
      `INSERT INTO projects
         (user_id, cliente_id, titulo, area_atuacao, tipo_criativo, tamanho, prompt, diferenciais,
          prompt_final, status, capa_url, ultima_geracao_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12)
       RETURNING id`,
      [
        userId, cli.id,
        `Campanha ${cli.nome.split(' ')[0]} #${i + 1}`,
        cli.setor, tipo, TAMANHOS[tipo],
        `Criativo para ${cli.nome} com foco em conversão e identidade da marca.`,
        JSON.stringify(['minimalista', 'fotografico']),
        status === 'pronto' ? 'Prompt refinado para alta qualidade visual.' : null,
        status, capa,
        status === 'pronto' ? new Date(Date.now() - i * 86_400_000) : null,
      ]
    );
    projetos++;

    if (status === 'pronto') {
      for (let v = 1; v <= 2; v++) {
        await pool.query(
          `INSERT INTO project_creatives (project_id, variacao, url, modelo_usado, custo_cents)
           VALUES ($1,$2,$3,'mock-image',4)`,
          [rows[0].id, v, `https://picsum.photos/seed/${seed}${v}/1024/1024`]
        );
        criativos++;
      }
    }
  }
  console.log(`  ✅ ${projetos} projetos e ${criativos} criativos inseridos.`);

  console.log('\n✨ Seed concluído.');
  await pool.end();
}

run().catch((err) => {
  console.error('Erro fatal no seed:', err);
  process.exit(1);
});
