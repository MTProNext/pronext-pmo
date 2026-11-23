import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

/** Após qualquer ação, recarrega semanas, planejamento e demandas (status pode mudar). */
const INVALIDAR = [["semanas"], ["planejamento"], ["demandas"]];

export function useCriarSemana() {
  return useMutacao(
    async (inicio: string) => {
      const { error } = await supabase.from("semanas").insert({ inicio });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Semana criada em rascunho." },
  );
}

export function useAvancarSemana() {
  return useMutacao(
    async (semanaId: string) => {
      const { error } = await supabase.rpc("avancar_semana", { p_semana_id: semanaId });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Ciclo da semana atualizado." },
  );
}

interface Alocacao {
  semanaId: string;
  colaboradorId: string;
  demandaId: string;
  /** 0 = remover. */
  horas: number;
  faixa: Enums<"faixa_capacidade">;
}

/** Semana em rascunho: grava direto na grade (inclui, altera ou remove). */
export function useSalvarAlocacao() {
  return useMutacao(
    async ({ semanaId, colaboradorId, demandaId, horas, faixa }: Alocacao) => {
      const chave = { semana_id: semanaId, colaborador_id: colaboradorId, demanda_id: demandaId };
      const { error } =
        horas === 0
          ? await supabase.from("planejamento_itens").delete().match(chave)
          : await supabase
              .from("planejamento_itens")
              .upsert({ ...chave, horas_planejadas: horas, faixa }, { onConflict: "semana_id,colaborador_id,demanda_id" });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Alocação salva." },
  );
}

/** Semana publicada: replaneja com motivo e impacto (registrado no log). */
export function useReplanejarItem() {
  return useMutacao(
    async ({ semanaId, colaboradorId, demandaId, horas, faixa, motivo, impacto }: Alocacao & { motivo: string; impacto: string }) => {
      const { error } = await supabase.rpc("replanejar_item", {
        p_semana_id: semanaId,
        p_colaborador_id: colaboradorId,
        p_demanda_id: demandaId,
        p_horas: horas,
        p_motivo: motivo,
        p_impacto: impacto,
        p_faixa: faixa,
      });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Replanejamento registrado." },
  );
}

/** Completa motivo e impacto de um replanejamento pendente (P1/P2). */
export function useCompletarReplanejamento() {
  return useMutacao(
    async ({ id, motivo, impacto }: { id: string; motivo: string; impacto: string }) => {
      const { error } = await supabase.rpc("completar_replanejamento", {
        p_id: id,
        p_motivo: motivo,
        p_impacto: impacto,
      });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Replanejamento completado." },
  );
}
