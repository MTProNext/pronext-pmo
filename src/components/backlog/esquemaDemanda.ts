import { z } from "zod";
import type { DemandaDetalhada } from "@/hooks/useDemandas";
import { paraDataISO } from "@/lib/format";
import { PRIORIDADE_LABEL, STATUS_DEMANDA_LABEL, TIPO_DEMANDA_LABEL } from "@/lib/rotulos";
import { enumDe } from "@/lib/validacao";

export const esquemaDemanda = z
  .object({
    titulo: z.string().trim().min(1, "Informe o título."),
    descricao: z.string().optional(),
    tipo: enumDe(TIPO_DEMANDA_LABEL),
    cliente_id: z.string().nullable(),
    projeto_id: z.string().nullable(),
    contrato_id: z.string().nullable(),
    solicitante: z.string().optional(),
    data_entrada: z.string({ required_error: "Informe a data de entrada." }).min(1),
    prioridade: enumDe(PRIORIDADE_LABEL),
    lider_id: z.string({ required_error: "Selecione o líder responsável." }).min(1, "Selecione o líder responsável."),
    estimativa_horas: z.number().min(0).nullable(),
    status: enumDe(STATUS_DEMANDA_LABEL),
  })
  .refine((v) => v.tipo !== "atividade_interna" || v.cliente_id === null, {
    path: ["cliente_id"],
    message: "Atividade interna não tem cliente.",
  });

export type DadosFormDemanda = z.infer<typeof esquemaDemanda>;

/** Valores iniciais: a demanda em edição ou uma nova (líder padrão = usuário, se for líder). */
export function valoresIniciais(demanda: DemandaDetalhada | null, liderPadrao: string): DadosFormDemanda {
  return {
    titulo: demanda?.titulo ?? "",
    descricao: demanda?.descricao ?? "",
    tipo: demanda?.tipo ?? "demanda",
    cliente_id: demanda ? demanda.cliente_id : null,
    projeto_id: demanda?.projeto_id ?? null,
    contrato_id: demanda?.contrato_id ?? null,
    solicitante: demanda?.solicitante ?? "",
    data_entrada: demanda?.data_entrada ?? paraDataISO(new Date()),
    prioridade: demanda?.prioridade ?? "p3",
    lider_id: demanda?.lider_id ?? liderPadrao,
    estimativa_horas: demanda?.estimativa_horas ?? null,
    status: demanda?.status ?? "nova",
  };
}
