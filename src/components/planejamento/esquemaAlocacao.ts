import { z } from "zod";

/** Esquema do diálogo de alocação; motivo e impacto só são exigidos no replanejamento. */
export const criarEsquemaAlocacao = (replanejamento: boolean, horasAtuais: (demanda: string, colaborador: string) => number) =>
  z
    .object({
      demanda_id: z.string({ required_error: "Selecione a demanda." }).min(1, "Selecione a demanda."),
      colaborador_id: z.string({ required_error: "Selecione o colaborador." }).min(1, "Selecione o colaborador."),
      horas: z.number().min(0).max(80).nullable(),
      faixa: z.enum(["planejado", "reserva", "interno"]),
      motivo: z.string().optional(),
      impacto: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      if (v.horas === null) {
        ctx.addIssue({ code: "custom", path: ["horas"], message: "Informe as horas." });
        return;
      }
      const atuais = horasAtuais(v.demanda_id, v.colaborador_id);
      if (v.horas === 0 && atuais === 0) {
        ctx.addIssue({ code: "custom", path: ["horas"], message: "Informe as horas (0 só remove uma alocação existente)." });
      }
      if (v.horas === atuais && atuais > 0 && replanejamento) {
        ctx.addIssue({ code: "custom", path: ["horas"], message: "As horas não mudaram." });
      }
      if (replanejamento && !v.motivo?.trim()) {
        ctx.addIssue({ code: "custom", path: ["motivo"], message: "Informe o motivo do replanejamento." });
      }
      if (replanejamento && !v.impacto?.trim()) {
        ctx.addIssue({ code: "custom", path: ["impacto"], message: "Informe o impacto do replanejamento." });
      }
    });

export type DadosAlocacao = z.infer<ReturnType<typeof criarEsquemaAlocacao>>;
