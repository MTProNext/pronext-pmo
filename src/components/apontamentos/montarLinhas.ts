import type { AlocacaoPessoa, ApontamentoView } from "@/hooks/useApontamentos";
import type { CategoriaHora } from "@/hooks/useCategorias";
import type { Enums } from "@/integrations/supabase/types";

export interface DemandaLinha {
  id: string;
  codigo: number;
  titulo: string;
  tipo: Enums<"tipo_demanda">;
  cliente_id: string | null;
  /** "Cliente · Projeto" ou "Interno" */
  origem: string;
}

export interface LinhaApontamento {
  demanda: DemandaLinha;
  horasPlanejadas: number;
  /** data "aaaa-mm-dd" → apontamento */
  celulas: Map<string, ApontamentoView>;
  categoriaId: string | null;
  descricao: string;
}

/** Linha incluída pelo usuário (ainda sem horas) ou copiada da semana anterior. */
export interface LinhaExtra {
  demanda: DemandaLinha;
  categoriaId?: string;
  descricao?: string;
}

export const EDITAVEL: Enums<"status_apontamento">[] = ["rascunho", "devolvido"];

const origem = (cliente?: string | null, projeto?: string | null) =>
  cliente ? [cliente, projeto].filter(Boolean).join(" · ") : "Interno";

/** Categoria padrão pela demanda: correção → Correção; interna → Atividade interna; demais → Desenvolvimento. */
export function categoriaPadrao(demanda: DemandaLinha, categorias: CategoriaHora[]) {
  const codigo =
    demanda.tipo === "correcao" ? "correcao" : demanda.cliente_id === null ? "atividade_interna" : "desenvolvimento";
  return categorias.find((c) => c.codigo === codigo)?.id ?? categorias[0]?.id ?? null;
}

export const demandaDaAlocacao = (a: AlocacaoPessoa): DemandaLinha | null =>
  a.demanda && {
    id: a.demanda.id,
    codigo: a.demanda.codigo,
    titulo: a.demanda.titulo,
    tipo: a.demanda.tipo,
    cliente_id: a.demanda.cliente_id,
    origem: origem(a.demanda.cliente?.nome, a.demanda.projeto?.nome),
  };

interface Entrada {
  apontamentos: ApontamentoView[];
  alocacoes: AlocacaoPessoa[];
  extras: LinhaExtra[];
  /** Ajustes de descrição/categoria feitos na linha nesta sessão. */
  ajustes: Map<string, { descricao?: string; categoriaId?: string }>;
  categorias: CategoriaHora[];
}

/**
 * Linhas da grade semanal: demandas planejadas para a pessoa, demandas com horas
 * e linhas incluídas. Planejadas primeiro, depois as demais, por código.
 */
export function montarLinhas({ apontamentos, alocacoes, extras, ajustes, categorias }: Entrada): LinhaApontamento[] {
  const linhas = new Map<string, LinhaApontamento>();
  const nova = (demanda: DemandaLinha): LinhaApontamento => ({
    demanda,
    horasPlanejadas: 0,
    celulas: new Map(),
    categoriaId: null,
    descricao: "",
  });

  for (const a of alocacoes) {
    const demanda = demandaDaAlocacao(a);
    if (!demanda) continue;
    const linha = linhas.get(demanda.id) ?? nova(demanda);
    linha.horasPlanejadas += Number(a.horas_planejadas);
    linhas.set(demanda.id, linha);
  }

  for (const ap of apontamentos) {
    let linha = linhas.get(ap.demanda_id);
    if (!linha) {
      linha = nova({
        id: ap.demanda_id,
        codigo: ap.demanda_codigo,
        titulo: ap.demanda_titulo,
        tipo: ap.demanda_tipo,
        cliente_id: ap.cliente_id,
        origem: origem(ap.cliente_nome, ap.projeto_nome),
      });
      linhas.set(ap.demanda_id, linha);
    }
    linha.celulas.set(ap.data, ap);
    // Descrição e categoria da linha = as do primeiro dia apontado.
    linha.categoriaId ??= ap.categoria_id;
    if (!linha.descricao) linha.descricao = ap.descricao;
  }

  for (const extra of extras) {
    if (linhas.has(extra.demanda.id)) continue;
    const linha = nova(extra.demanda);
    linha.categoriaId = extra.categoriaId ?? null;
    linha.descricao = extra.descricao ?? "";
    linhas.set(extra.demanda.id, linha);
  }

  for (const linha of linhas.values()) {
    const ajuste = ajustes.get(linha.demanda.id);
    if (ajuste?.descricao !== undefined) linha.descricao = ajuste.descricao;
    if (ajuste?.categoriaId) linha.categoriaId = ajuste.categoriaId;
    linha.categoriaId ??= categoriaPadrao(linha.demanda, categorias);
  }

  return [...linhas.values()].sort(
    (a, b) => Number(b.horasPlanejadas > 0) - Number(a.horasPlanejadas > 0) || a.demanda.codigo - b.demanda.codigo,
  );
}
