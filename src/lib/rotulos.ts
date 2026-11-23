import type { Enums } from "@/integrations/supabase/types";

/** Rótulos em pt-BR dos enums do banco (os de papel/senioridade ficam em papeis.ts). */

export const TIPO_CONTRATO_LABEL: Record<Enums<"tipo_contrato">, string> = {
  banco_horas: "Banco de horas",
  escopo_fechado: "Escopo fechado",
  sustentacao: "Mensalidade / sustentação",
  outro: "Outro",
};

export const PERIODICIDADE_LABEL: Record<Enums<"periodicidade_horas">, string> = {
  total: "Na vigência",
  mensal: "Por mês",
};

export const STATUS_CONTRATO_LABEL: Record<Enums<"status_contrato">, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
};

export const STATUS_PROJETO_LABEL: Record<Enums<"status_projeto">, string> = {
  nao_iniciado: "Não iniciado",
  em_descoberta: "Em descoberta",
  planejamento: "Planejamento",
  em_execucao: "Em execução",
  em_homologacao: "Em homologação",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const TIPO_INDISPONIBILIDADE_LABEL: Record<Enums<"tipo_indisponibilidade">, string> = {
  ferias: "Férias",
  feriado: "Feriado",
  ausencia: "Ausência",
  treinamento: "Treinamento",
  outra: "Outra",
};

export const PRIORIDADE_LABEL: Record<Enums<"prioridade">, string> = {
  p1: "P1 · Crítica",
  p2: "P2 · Alta",
  p3: "P3 · Normal",
  p4: "P4 · Baixa",
};

/** Regra de tratamento de cada prioridade (seção 5.1 do escopo). */
export const PRIORIDADE_REGRA: Record<Enums<"prioridade">, string> = {
  p1: "Líder avalia na hora e define a resposta.",
  p2: "Líder avalia impacto e reprogramação.",
  p3: "Entra no próximo planejamento.",
  p4: "Permanece no backlog.",
};

export const STATUS_DEMANDA_LABEL: Record<Enums<"status_demanda">, string> = {
  nova: "Nova",
  priorizada: "Priorizada",
  planejada: "Planejada",
  em_execucao: "Em execução",
  bloqueada: "Bloqueada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const TIPO_DEMANDA_LABEL: Record<Enums<"tipo_demanda">, string> = {
  demanda: "Demanda",
  urgencia: "Urgência",
  correcao: "Correção",
  atividade_interna: "Atividade interna",
};

export const STATUS_SEMANA_LABEL: Record<Enums<"status_semana">, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  confirmada: "Confirmada",
  em_execucao: "Em execução",
  revisada: "Revisada",
};

export const FAIXA_LABEL: Record<Enums<"faixa_capacidade">, string> = {
  planejado: "Planejado",
  reserva: "Reserva",
  interno: "Interno",
};

export const TIPO_REPLANEJAMENTO_LABEL: Record<Enums<"tipo_replanejamento">, string> = {
  inclusao: "Inclusão",
  alteracao_horas: "Alteração de horas",
  remocao: "Remoção",
  entrada_p1_p2: "Entrada P1/P2",
  outro: "Outro",
};

export const STATUS_APONTAMENTO_LABEL: Record<Enums<"status_apontamento">, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  devolvido: "Devolvido",
};

export const CLASSIFICACAO_LABEL: Record<Enums<"classificacao_comercial">, string> = {
  banco_horas: "Banco de horas",
  faturavel_adicional: "Serviço faturável adicional",
  escopo_projeto: "Escopo de projeto",
  nao_faturavel: "Não faturável",
  a_validar: "A validar",
};

/** Situação de prazo das views v_prazo_apontamento_dia/semana. */
export type SituacaoPrazo = "no_prazo" | "atrasado" | "pendente";
export const SITUACAO_PRAZO_LABEL: Record<SituacaoPrazo, string> = {
  no_prazo: "No prazo",
  atrasado: "Atrasado",
  pendente: "Pendente",
};

export const DIA_SEMANA_LABEL: Record<number, string> = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  7: "Domingo",
};

/** Converte um mapa de rótulos em opções para Select. */
export const opcoesDe = (rotulos: Record<string, string>) =>
  Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));
