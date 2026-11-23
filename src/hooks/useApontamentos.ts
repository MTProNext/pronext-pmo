import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { deslocarSemana } from "@/lib/semana";
import { addDaysISO } from "@/lib/format";
import { useMutacao } from "./useMutacao";

/** Recarregadas após qualquer alteração de apontamento. */
const INVALIDAR = [["apontamentos"], ["aprovacoes"], ["prazos"], ["planejamento"]];

/** Apontamentos da pessoa numa semana (segunda a domingo), com nomes e planejamento. */
export function useApontamentosSemana(colaboradorId: string | undefined, inicio: string) {
  return useQuery({
    queryKey: ["apontamentos", colaboradorId, inicio],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_apontamentos")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .gte("data", inicio)
        .lte("data", addDaysISO(inicio, 6))
        .order("data");
      if (error) throw error;
      return data;
    },
  });
}

export type ApontamentoView = NonNullable<ReturnType<typeof useApontamentosSemana>["data"]>[number];

/** Alocações da pessoa na semana publicada (pré-preenchimento da grade). */
export function useAlocacoesPessoa(colaboradorId: string | undefined, inicio: string) {
  return useQuery({
    queryKey: ["planejamento", "alocacoes-pessoa", colaboradorId, inicio],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planejamento_itens")
        .select(
          "demanda_id, horas_planejadas, semana:semana_id!inner(inicio, status), demanda:demanda_id(id, codigo, titulo, tipo, status, cliente_id, cliente:cliente_id(nome), projeto:projeto_id(nome))",
        )
        .eq("colaborador_id", colaboradorId!)
        .eq("semana.inicio", inicio)
        .neq("semana.status", "rascunho");
      if (error) throw error;
      return data;
    },
  });
}

export type AlocacaoPessoa = NonNullable<ReturnType<typeof useAlocacoesPessoa>["data"]>[number];

/** Situação de prazo de cada dia útil (v_prazo_apontamento_dia) no intervalo. */
export function usePrazosDias(colaboradorId: string | undefined, de: string, ate: string) {
  return useQuery({
    queryKey: ["prazos", "dias", colaboradorId, de, ate],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_prazo_apontamento_dia")
        .select("dia, situacao, sem_registro, horas_registradas, prazo")
        .eq("colaborador_id", colaboradorId!)
        .gte("dia", de)
        .lte("dia", ate);
      if (error) throw error;
      return data;
    },
  });
}

/** Linhas da semana anterior (para "Copiar linhas da semana anterior"). */
export function useDemandasSemanaAnterior(colaboradorId: string | undefined, inicio: string) {
  const anterior = deslocarSemana(inicio, -1);
  return useQuery({
    queryKey: ["apontamentos", colaboradorId, anterior, "linhas"],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apontamentos")
        .select("demanda_id, categoria_id, descricao, data")
        .eq("colaborador_id", colaboradorId!)
        .gte("data", anterior)
        .lte("data", addDaysISO(anterior, 6))
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Histórico (auditoria) de um apontamento. */
export function useHistoricoApontamento(apontamentoId: string | undefined) {
  return useQuery({
    queryKey: ["apontamentos", "historico", apontamentoId],
    enabled: !!apontamentoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apontamentos_auditoria")
        .select("*, autor:alterado_por(nome)")
        .eq("apontamento_id", apontamentoId!)
        .order("id", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

type NovoApontamento = Pick<
  TablesInsert<"apontamentos">,
  "data" | "demanda_id" | "categoria_id" | "descricao" | "horas"
>;

/** Salvamento de célula (sem toast): inclui, altera ou exclui (horas nulas). */
export function useSalvarCelula() {
  return useMutacao(
    async ({ id, novo, horas }: { id?: string; novo?: NovoApontamento; horas: number | null }) => {
      if (id && horas === null) {
        const { error } = await supabase.from("apontamentos").delete().eq("id", id);
        if (error) throw error;
      } else if (id) {
        const { error } = await supabase.from("apontamentos").update({ horas: horas! }).eq("id", id);
        if (error) throw error;
      } else if (novo) {
        const { error } = await supabase.from("apontamentos").insert(novo);
        if (error) throw error;
      }
    },
    { invalidar: INVALIDAR },
  );
}

/** Altera descrição e/ou categoria de vários apontamentos editáveis (sem toast). */
export function useAtualizarApontamentos() {
  return useMutacao(
    async ({ ids, dados }: { ids: string[]; dados: { descricao?: string; categoria_id?: string } }) => {
      if (ids.length === 0) return;
      const { error } = await supabase.from("apontamentos").update(dados).in("id", ids);
      if (error) throw error;
    },
    { invalidar: INVALIDAR },
  );
}

export function useEnviarApontamentos() {
  return useMutacao(
    async (ids: string[]) => {
      const { error } = await supabase.rpc("enviar_apontamentos", { p_ids: ids });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Horas enviadas para aprovação." },
  );
}
