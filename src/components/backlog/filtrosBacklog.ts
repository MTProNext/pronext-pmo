import { TODOS } from "@/components/comum/FiltroSelect";
import type { DemandaDaLista } from "@/hooks/useDemandas";
import { formatCodigoDemanda } from "@/lib/format";

/** Valor especial do filtro de status: tudo que não está concluído nem cancelado. */
export const EM_ABERTO = "em_aberto";
/** Valor especial do filtro de cliente: demandas internas (sem cliente). */
export const INTERNO = "interno";

export interface FiltrosBacklog {
  busca: string;
  status: string;
  prioridade: string;
  cliente: string;
  lider: string;
  tipo: string;
}

export const FILTROS_PADRAO: FiltrosBacklog = {
  busca: "",
  status: EM_ABERTO,
  prioridade: TODOS,
  cliente: TODOS,
  lider: TODOS,
  tipo: TODOS,
};

export const filtrosAlterados = (f: FiltrosBacklog) =>
  (Object.keys(FILTROS_PADRAO) as (keyof FiltrosBacklog)[]).some((k) => f[k] !== FILTROS_PADRAO[k]);

const confere = (filtro: string, valor: string | null) => filtro === TODOS || filtro === valor;

export function aplicarFiltros(demandas: DemandaDaLista[], f: FiltrosBacklog) {
  const termo = f.busca.trim().toLowerCase();
  return demandas.filter((d) => {
    const emAberto = d.status !== "concluida" && d.status !== "cancelada";
    return (
      (!termo ||
        d.titulo.toLowerCase().includes(termo) ||
        formatCodigoDemanda(d.codigo).toLowerCase().includes(termo)) &&
      (f.status === EM_ABERTO ? emAberto : confere(f.status, d.status)) &&
      confere(f.prioridade, d.prioridade) &&
      (f.cliente === INTERNO ? d.cliente_id === null : confere(f.cliente, d.cliente_id)) &&
      confere(f.lider, d.lider_id) &&
      confere(f.tipo, d.tipo)
    );
  });
}
