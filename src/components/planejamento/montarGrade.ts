import type { ItemPlanejamento } from "@/hooks/usePlanejamento";

type Demanda = NonNullable<ItemPlanejamento["demanda"]>;

export interface LinhaGrade {
  demanda: Demanda;
  /** colaborador_id → item */
  itens: Map<string, ItemPlanejamento>;
  total: number;
}

export interface GrupoGrade {
  chave: string;
  /** "Cliente · Projeto", "Cliente" ou "Interno" */
  titulo: string;
  linhas: LinhaGrade[];
  /** colaborador_id → horas */
  subtotais: Map<string, number>;
  subtotal: number;
}

const somar = (mapa: Map<string, number>, chave: string, horas: number) =>
  mapa.set(chave, (mapa.get(chave) ?? 0) + horas);

const tituloGrupo = (d: Demanda) =>
  d.cliente ? [d.cliente.nome, d.projeto?.nome].filter(Boolean).join(" · ") : "Interno";

const ORDEM_PRIORIDADE = { p1: 1, p2: 2, p3: 3, p4: 4 } as const;

/**
 * Agrupa os itens da semana: linhas = demandas, agrupadas por cliente/projeto
 * (Interno por último), com subtotal por colaborador em cada grupo.
 */
export function montarGrade(itens: ItemPlanejamento[]): GrupoGrade[] {
  const grupos = new Map<string, GrupoGrade>();
  const linhas = new Map<string, LinhaGrade>();

  for (const item of itens) {
    const d = item.demanda;
    if (!d) continue;
    const chaveGrupo = `${d.cliente_id ?? "interno"}|${d.projeto_id ?? ""}`;

    let grupo = grupos.get(chaveGrupo);
    if (!grupo) {
      grupo = { chave: chaveGrupo, titulo: tituloGrupo(d), linhas: [], subtotais: new Map(), subtotal: 0 };
      grupos.set(chaveGrupo, grupo);
    }

    let linha = linhas.get(d.id);
    if (!linha) {
      linha = { demanda: d, itens: new Map(), total: 0 };
      linhas.set(d.id, linha);
      grupo.linhas.push(linha);
    }

    const horas = Number(item.horas_planejadas);
    linha.itens.set(item.colaborador_id, item);
    linha.total += horas;
    somar(grupo.subtotais, item.colaborador_id, horas);
    grupo.subtotal += horas;
  }

  for (const grupo of grupos.values()) {
    grupo.linhas.sort(
      (a, b) =>
        ORDEM_PRIORIDADE[a.demanda.prioridade] - ORDEM_PRIORIDADE[b.demanda.prioridade] ||
        a.demanda.codigo - b.demanda.codigo,
    );
  }

  return [...grupos.values()].sort((a, b) => {
    if (a.titulo === "Interno") return 1;
    if (b.titulo === "Interno") return -1;
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}
