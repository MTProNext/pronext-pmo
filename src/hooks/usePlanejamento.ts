import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Semana pelo início (segunda-feira). null se ainda não existir ou não for visível. */
export function useSemana(inicio: string) {
  return useQuery({
    queryKey: ["semanas", inicio],
    queryFn: async () => {
      const { data, error } = await supabase.from("semanas").select("*").eq("inicio", inicio).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type Semana = NonNullable<ReturnType<typeof useSemana>["data"]>;

/** Totais, limites das faixas e alertas da semana (v_resumo_semana). */
export function useResumoSemana(semanaId: string | undefined) {
  return useQuery({
    queryKey: ["planejamento", semanaId, "resumo"],
    enabled: !!semanaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_resumo_semana")
        .select("*")
        .eq("semana_id", semanaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type ResumoSemana = NonNullable<ReturnType<typeof useResumoSemana>["data"]>;

/** Capacidade efetiva, planejado e ocupação por pessoa (v_capacidade_colaborador_semana). */
export function useCapacidadeSemana(semanaId: string | undefined) {
  return useQuery({
    queryKey: ["planejamento", semanaId, "capacidade"],
    enabled: !!semanaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_capacidade_colaborador_semana")
        .select("*")
        .eq("semana_id", semanaId!)
        .order("papel", { ascending: false })
        .order("colaborador_nome");
      if (error) throw error;
      return data;
    },
  });
}

export type CapacidadePessoa = NonNullable<ReturnType<typeof useCapacidadeSemana>["data"]>[number];

/** Itens da grade com os dados da demanda. */
export function useItensSemana(semanaId: string | undefined) {
  return useQuery({
    queryKey: ["planejamento", semanaId, "itens"],
    enabled: !!semanaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planejamento_itens")
        .select(
          "*, demanda:demanda_id(id, codigo, titulo, prioridade, status, cliente_id, projeto_id, cliente:cliente_id(nome), projeto:projeto_id(nome))",
        )
        .eq("semana_id", semanaId!);
      if (error) throw error;
      return data;
    },
  });
}

export type ItemPlanejamento = NonNullable<ReturnType<typeof useItensSemana>["data"]>[number];

/** Alocações e replanejamentos de uma demanda, em todas as semanas visíveis. */
export function useHistoricoDemanda(demandaId: string | undefined) {
  return useQuery({
    queryKey: ["planejamento", "demanda", demandaId],
    enabled: !!demandaId,
    queryFn: async () => {
      const [alocacoes, replanejamentos] = await Promise.all([
        supabase
          .from("planejamento_itens")
          .select("id, horas_planejadas, faixa, semana:semana_id(inicio, status), colaborador:colaborador_id(nome)")
          .eq("demanda_id", demandaId!),
        supabase
          .from("replanejamentos")
          .select("id, tipo, pendente, motivo, descricao_auto, created_at, horas_antes, horas_depois, semana:semana_id(inicio)")
          .eq("demanda_id", demandaId!)
          .order("created_at", { ascending: false }),
      ]);
      if (alocacoes.error) throw alocacoes.error;
      if (replanejamentos.error) throw replanejamentos.error;
      return {
        alocacoes: [...alocacoes.data].sort((a, b) => (b.semana?.inicio ?? "").localeCompare(a.semana?.inicio ?? "")),
        replanejamentos: replanejamentos.data,
      };
    },
  });
}

/** Log de replanejamentos da semana (mais recentes primeiro). */
export function useReplanejamentos(semanaId: string | undefined) {
  return useQuery({
    queryKey: ["planejamento", semanaId, "replanejamentos"],
    enabled: !!semanaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("replanejamentos")
        .select(
          "*, demanda:demanda_id(codigo, titulo), colaborador:colaborador_afetado_id(nome), responsavel:responsavel_id(nome), completador:completado_por(nome)",
        )
        .eq("semana_id", semanaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type Replanejamento = NonNullable<ReturnType<typeof useReplanejamentos>["data"]>[number];
