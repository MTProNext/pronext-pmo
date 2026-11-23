import type { Enums } from "@/integrations/supabase/types";
import {
  CLASSIFICACAO_LABEL,
  SITUACAO_PRAZO_LABEL,
  STATUS_APONTAMENTO_LABEL,
  type SituacaoPrazo,
  FAIXA_LABEL,
  PRIORIDADE_LABEL,
  STATUS_SEMANA_LABEL,
  STATUS_CONTRATO_LABEL,
  STATUS_DEMANDA_LABEL,
  STATUS_PROJETO_LABEL,
} from "./rotulos";

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

const PR = PRIORIDADE_LABEL;
export const SELO_PRIORIDADE: MapaSelos<Enums<"prioridade">> = {
  p1: { rotulo: PR.p1, variante: "destructive" },
  p2: { rotulo: PR.p2, variante: "default" },
  p3: { rotulo: PR.p3, variante: "secondary" },
  p4: { rotulo: PR.p4, variante: "outline" },
};

const D = STATUS_DEMANDA_LABEL;
export const SELO_STATUS_DEMANDA: MapaSelos<Enums<"status_demanda">> = {
  nova: { rotulo: D.nova, variante: "outline" },
  priorizada: { rotulo: D.priorizada, variante: "secondary" },
  planejada: { rotulo: D.planejada, variante: "secondary" },
  em_execucao: { rotulo: D.em_execucao, variante: "default" },
  bloqueada: { rotulo: D.bloqueada, variante: "destructive" },
  concluida: { rotulo: D.concluida, variante: "secondary" },
  cancelada: { rotulo: D.cancelada, variante: "outline" },
};

const S = STATUS_SEMANA_LABEL;
export const SELO_STATUS_SEMANA: MapaSelos<Enums<"status_semana">> = {
  rascunho: { rotulo: S.rascunho, variante: "outline" },
  publicada: { rotulo: S.publicada, variante: "secondary" },
  confirmada: { rotulo: S.confirmada, variante: "secondary" },
  em_execucao: { rotulo: S.em_execucao, variante: "default" },
  revisada: { rotulo: S.revisada, variante: "outline" },
};

const A = STATUS_APONTAMENTO_LABEL;
export const SELO_STATUS_APONTAMENTO: MapaSelos<Enums<"status_apontamento">> = {
  rascunho: { rotulo: A.rascunho, variante: "outline" },
  enviado: { rotulo: A.enviado, variante: "secondary" },
  aprovado: { rotulo: A.aprovado, variante: "default" },
  devolvido: { rotulo: A.devolvido, variante: "destructive" },
};

const CL = CLASSIFICACAO_LABEL;
export const SELO_CLASSIFICACAO: MapaSelos<Enums<"classificacao_comercial">> = {
  banco_horas: { rotulo: CL.banco_horas, variante: "secondary" },
  faturavel_adicional: { rotulo: CL.faturavel_adicional, variante: "secondary" },
  escopo_projeto: { rotulo: CL.escopo_projeto, variante: "secondary" },
  nao_faturavel: { rotulo: CL.nao_faturavel, variante: "secondary" },
  a_validar: { rotulo: CL.a_validar, variante: "outline" },
};

export const SELO_SITUACAO_PRAZO: MapaSelos<SituacaoPrazo> = {
  no_prazo: { rotulo: SITUACAO_PRAZO_LABEL.no_prazo, variante: "secondary" },
  atrasado: { rotulo: SITUACAO_PRAZO_LABEL.atrasado, variante: "destructive" },
  pendente: { rotulo: SITUACAO_PRAZO_LABEL.pendente, variante: "outline" },
};

const F = FAIXA_LABEL;
export const SELO_FAIXA: MapaSelos<Enums<"faixa_capacidade">> = {
  planejado: { rotulo: F.planejado, variante: "secondary" },
  reserva: { rotulo: F.reserva, variante: "outline" },
  interno: { rotulo: F.interno, variante: "outline" },
};
