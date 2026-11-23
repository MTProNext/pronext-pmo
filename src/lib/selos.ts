import type { Enums } from "@/integrations/supabase/types";
import { STATUS_CONTRATO_LABEL, STATUS_PROJETO_LABEL } from "./rotulos";

/**
 * Rótulo e variante do Badge para cada valor de status/prioridade.
 * Regra de cor (discreta, só variantes do shadcn):
 * - destructive: exige ação imediata (P1, bloqueada)
 * - default:     em andamento / destaque (P2, em execução)
 * - secondary:   estados normais do fluxo
 * - outline:     neutro, inicial ou encerrado
 */
export type VarianteSelo = "default" | "secondary" | "destructive" | "outline";

export type MapaSelos<T extends string> = Record<T, { rotulo: string; variante: VarianteSelo }>;

export const SELO_SITUACAO: MapaSelos<"ativo" | "inativo"> = {
  ativo: { rotulo: "Ativo", variante: "secondary" },
  inativo: { rotulo: "Inativo", variante: "outline" },
};

const C = STATUS_CONTRATO_LABEL;
export const SELO_STATUS_CONTRATO: MapaSelos<Enums<"status_contrato">> = {
  ativo: { rotulo: C.ativo, variante: "secondary" },
  suspenso: { rotulo: C.suspenso, variante: "default" },
  encerrado: { rotulo: C.encerrado, variante: "outline" },
};

const P = STATUS_PROJETO_LABEL;
export const SELO_STATUS_PROJETO: MapaSelos<Enums<"status_projeto">> = {
  nao_iniciado: { rotulo: P.nao_iniciado, variante: "outline" },
  em_descoberta: { rotulo: P.em_descoberta, variante: "secondary" },
  planejamento: { rotulo: P.planejamento, variante: "secondary" },
  em_execucao: { rotulo: P.em_execucao, variante: "default" },
  em_homologacao: { rotulo: P.em_homologacao, variante: "secondary" },
  bloqueado: { rotulo: P.bloqueado, variante: "destructive" },
  concluido: { rotulo: P.concluido, variante: "secondary" },
  cancelado: { rotulo: P.cancelado, variante: "outline" },
};

// Os mapas abaixo seguem os enums aprovados no passo 1. Quando os enums forem
// criados no banco (etapas 3 e 4), troque as uniões literais por Enums<"...">.

export const SELO_PRIORIDADE: MapaSelos<"p1" | "p2" | "p3" | "p4"> = {
  p1: { rotulo: "P1 · Crítica", variante: "destructive" },
  p2: { rotulo: "P2 · Alta", variante: "default" },
  p3: { rotulo: "P3 · Normal", variante: "secondary" },
  p4: { rotulo: "P4 · Baixa", variante: "outline" },
};

export const SELO_STATUS_DEMANDA: MapaSelos<
  "nova" | "priorizada" | "planejada" | "em_execucao" | "bloqueada" | "concluida" | "cancelada"
> = {
  nova: { rotulo: "Nova", variante: "outline" },
  priorizada: { rotulo: "Priorizada", variante: "secondary" },
  planejada: { rotulo: "Planejada", variante: "secondary" },
  em_execucao: { rotulo: "Em execução", variante: "default" },
  bloqueada: { rotulo: "Bloqueada", variante: "destructive" },
  concluida: { rotulo: "Concluída", variante: "secondary" },
  cancelada: { rotulo: "Cancelada", variante: "outline" },
};

export const SELO_STATUS_SEMANA: MapaSelos<
  "rascunho" | "publicada" | "confirmada" | "em_execucao" | "revisada"
> = {
  rascunho: { rotulo: "Rascunho", variante: "outline" },
  publicada: { rotulo: "Publicada", variante: "secondary" },
  confirmada: { rotulo: "Confirmada", variante: "secondary" },
  em_execucao: { rotulo: "Em execução", variante: "default" },
  revisada: { rotulo: "Revisada", variante: "outline" },
};
