import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Gerador de imagens (Task 6 / 8.3). Backend mediando — nunca direto do client.
 *
 * Sem OPENAI_API_KEY, devolve URLs de placeholder determinísticas (picsum) com
 * seed derivada do prompt, suficiente para validar a grid/preview. Com a chave,
 * chama DALL·E 3 e retorna as URLs reais.
 */

const USE_OPENAI = Boolean(env.OPENAI_API_KEY);

// Custo aproximado por imagem DALL·E 3 standard 1024 (~US$0.04) em cents.
const IMAGE_COST_CENTS = USE_OPENAI ? 4 : 0;

// Mapeia a proporção do escopo para o size aceito pelo modelo.
function sizeFor(tamanho) {
  switch (tamanho) {
    case '16:9': return '1792x1024';
    case '9:16': return '1024x1792';
    case '4:5':  return '1024x1792';
    case '1:1':
    default:     return '1024x1024';
  }
}

async function callDalle(prompt, size) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: env.IMAGE_MODEL, prompt, n: 1, size }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Image API ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.data?.[0]?.url || null;
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Gera `quantidade` variações para um prompt.
 * @returns {Promise<Array<{ variacao:number, url:string, modelo:string, custoCents:number }>>}
 */
export async function generateImages({ promptFinal, tamanho = '1:1', quantidade = 2 }) {
  const size = sizeFor(tamanho);
  const out = [];

  for (let i = 1; i <= quantidade; i++) {
    if (USE_OPENAI) {
      const url = await callDalle(promptFinal, size);
      out.push({ variacao: i, url, modelo: env.IMAGE_MODEL, custoCents: IMAGE_COST_CENTS });
    } else {
      const [w, h] = size.split('x');
      const seed = hashSeed(`${promptFinal}-${i}`);
      out.push({
        variacao: i,
        url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
        modelo: 'mock-image',
        custoCents: IMAGE_COST_CENTS,
      });
    }
  }

  if (!USE_OPENAI) logger.debug(`[image.generator] ${quantidade} imagem(ns) em modo MOCK.`);
  return out;
}

export const imageGenerator = { generateImages, usingMock: !USE_OPENAI };
