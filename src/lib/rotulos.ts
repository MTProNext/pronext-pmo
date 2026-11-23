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

/** Converte um mapa de rótulos em opções para Select. */
export const opcoesDe = (rotulos: Record<string, string>) =>
  Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));
