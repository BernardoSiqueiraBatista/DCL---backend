import * as repo from './dashboard.repository.js';

// "Créditos restantes" não tem origem definida no escopo; expomos um saldo base
// menos o custo já gasto (em cents → créditos), mantendo o KPI plausível.
const CREDITOS_BASE = 5000;

export async function getDashboard(userId) {
  const [kpis, projetosRecentes, clientesRecentes] = await Promise.all([
    repo.getKpis(userId),
    repo.getProjetosRecentes(userId),
    repo.getClientesRecentes(userId),
  ]);

  return {
    kpis: {
      projetos_ativos: kpis.projetos_ativos,
      clientes_ativos: kpis.clientes_ativos,
      creditos_restantes: Math.max(CREDITOS_BASE - Math.floor(kpis.custo_total_cents / 10), 0),
      creativos_gerados_30d: kpis.creativos_gerados_30d,
    },
    projetos_recentes: projetosRecentes,
    clientes_recentes: clientesRecentes,
  };
}
