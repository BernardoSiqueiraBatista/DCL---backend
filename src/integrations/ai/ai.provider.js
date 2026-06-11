import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Provedor de LLM de texto (Task 6 / 8.2 — refinamento de prompt).
 *
 * Sem OPENAI_API_KEY configurada, opera em modo MOCK determinístico: devolve um
 * prompt enriquecido a partir dos dados estruturados, sem chamada externa. Isso
 * mantém o fluxo (e a validação de layout) funcional offline, conforme o espírito
 * de "dados mockados realistas" do escopo. Plugue a OpenAI definindo a chave.
 */

const USE_OPENAI = Boolean(env.OPENAI_API_KEY);

// Custo aproximado (em cents) por refinamento — logado em project_creatives.
const REFINE_COST_CENTS = USE_OPENAI ? 1 : 0;

async function callOpenAIText(systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Refina o prompt do usuário em um prompt final para o modelo de imagem.
 * @returns {Promise<{ promptFinal: string, modelo: string, custoCents: number }>}
 */
export async function refinePrompt({ areaAtuacao, tipoCriativo, tamanho, prompt, diferenciais = [], referencias = [] }) {
  const contexto = [
    areaAtuacao && `Área de atuação: ${areaAtuacao}`,
    tipoCriativo && `Tipo de criativo: ${tipoCriativo}`,
    tamanho && `Proporção: ${tamanho}`,
    diferenciais.length && `Diferenciais: ${diferenciais.join(', ')}`,
    referencias.length && `Referências visuais: ${referencias.map((r) => r.descricao_textual || r.url).join(' | ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  if (!USE_OPENAI) {
    const estilo = diferenciais.length ? `, estilo ${diferenciais.join(' e ')}` : '';
    const ratio = tamanho ? ` (proporção ${tamanho})` : '';
    const promptFinal =
      `[${tipoCriativo || 'criativo'}${ratio}] ${prompt}${estilo}. ` +
      `Composição profissional voltada para ${areaAtuacao || 'marketing digital'}, ` +
      `iluminação cuidada, alta qualidade e identidade visual coesa.`;
    logger.debug('[ai.provider] refinePrompt em modo MOCK.');
    return { promptFinal, modelo: 'mock-text', custoCents: REFINE_COST_CENTS };
  }

  const system =
    'Você é um diretor de arte. Reescreva o pedido do usuário como um prompt detalhado, ' +
    'visualmente rico e objetivo para um modelo de geração de imagem. Responda apenas com o prompt.';
  const promptFinal = await callOpenAIText(system, `${contexto}\n\nPedido do usuário: ${prompt}`);
  return { promptFinal, modelo: env.LLM_TEXT_MODEL, custoCents: REFINE_COST_CENTS };
}

/**
 * Gera uma descrição textual de uma imagem de referência (entra no contexto do prompt).
 * Em modo MOCK devolve um placeholder; com chave, pode evoluir para visão multimodal.
 */
export async function describeReference({ url, mimeType }) {
  if (!USE_OPENAI) {
    return `Imagem de referência (${mimeType || 'imagem'}) fornecida pelo usuário.`;
  }
  // Placeholder para evolução com modelo de visão; mantém custo previsível por ora.
  return `Referência visual em ${url}.`;
}

export const aiProvider = { refinePrompt, describeReference, usingMock: !USE_OPENAI };
