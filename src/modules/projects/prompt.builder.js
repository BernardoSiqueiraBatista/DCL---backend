/**
 * Monta o "pedido estruturado" que será enviado ao LLM de texto para refino
 * (Task 6 / 8.2). Não basta repassar o texto do usuário — agregamos área de
 * atuação, tipo, tamanho, diferenciais e descrição das referências.
 */
export function buildRefineInput({ project, referencias = [] }) {
  return {
    areaAtuacao: project.area_atuacao,
    tipoCriativo: project.tipo_criativo,
    tamanho: project.tamanho,
    prompt: project.prompt,
    diferenciais: Array.isArray(project.diferenciais) ? project.diferenciais : [],
    referencias: referencias.map((r) => ({
      url: r.url,
      descricao_textual: r.descricao_textual,
    })),
  };
}
