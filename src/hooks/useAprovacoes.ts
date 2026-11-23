import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { deslocarSemana, inicioSemanaAtual } from "@/lib/semana";
import { useMutacao } from "./useMutacao";

type Classificacao = Enums<"classificacao_comercial">;

const INVALIDAR = [["apontamentos"], ["aprovacoes"], ["prazos"]];

/** Horas enviadas que o usuário pode aprovar. */
export function usePendentesAprovacao(habilitado = true) {
  return useQuery({
    queryKey: ["aprovacoes", "pendentes"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_apontamentos")
        .select("*")
        .eq("status", "enviado")
        .eq("pode_aprovar", true)
        .order("colaborador_nome")
        .order("data");
      if (error) throw error;
      return data;
    },
  });
}

/** Horas aprovadas nas últimas 4 semanas que o usuário pode reabrir. */
export function useAprovadasRecentes(habilitado = true) {
  return useQuery({
    queryKey: ["aprovacoes", "aprovadas"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_apontamentos")
        .select("*")
        .eq("status", "aprovado")
        .eq("pode_aprovar", true)
        .gte("data", deslocarSemana(inicioSemanaAtual(), -4))
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Semanas já encerradas que ainda não foram enviadas (bloco "Semana não enviada"). */
export function useSemanasNaoEnviadas(habilitado = true) {
  return useQuery({
    queryKey: ["prazos", "semanas-nao-enviadas"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_prazo_apontamento_semana")
        .select("colaborador_id, colaborador_nome, semana_inicio, situacao, dias_sem_registro, apontamentos_nao_enviados, prazo_envio")
        .eq("enviada", false)
        .lt("semana_inicio", inicioSemanaAtual())
        .gte("semana_inicio", deslocarSemana(inicioSemanaAtual(), -4))
        .order("semana_inicio", { ascending: false })
        .order("colaborador_nome");
      if (error) throw error;
      return data;
    },
  });
}

/** Quantidade de horas aguardando a aprovação do usuário (contador do menu). */
export function useContagemPendentes(habilitado: boolean) {
  return useQuery({
    queryKey: ["aprovacoes", "contagem"],
    enabled: habilitado,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("v_apontamentos")
        .select("id", { count: "exact", head: true })
        .eq("status", "enviado")
        .eq("pode_aprovar", true);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Horas aprovadas com classificação comercial ainda não validada. */
export function useHorasParaClassificar(habilitado = true) {
  return useQuery({
    queryKey: ["aprovacoes", "classificacao"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_apontamentos")
        .select("*")
        .eq("status", "aprovado")
        .is("classificacao_validada_em", null)
        .order("data");
      if (error) throw error;
      return data;
    },
  });
}

export function useAprovarApontamentos() {
  return useMutacao(
    async ({ ids, classificacao, usarSugestao }: { ids: string[]; classificacao?: Classificacao; usarSugestao: boolean }) => {
      const { error } = await supabase.rpc("aprovar_apontamentos", {
        p_ids: ids,
        p_classificacao: classificacao,
        p_usar_sugestao: usarSugestao,
      });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Horas aprovadas." },
  );
}

export function useDevolverApontamento() {
  return useMutacao(
    async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await supabase.rpc("devolver_apontamento", { p_id: id, p_motivo: motivo });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Apontamento devolvido ao autor." },
  );
}

export function useReabrirApontamento() {
  return useMutacao(
    async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await supabase.rpc("reabrir_apontamento", { p_id: id, p_motivo: motivo });
      if (error) throw error;
    },
    { invalidar: INVALIDAR, sucesso: "Apontamento reaberto para correção." },
  );
}

/** Classifica (e opcionalmente valida) vários apontamentos com a mesma classificação. */
export function useClassificarApontamentos() {
  return useMutacao(
    async (grupos: { ids: string[]; classificacao: Classificacao; validar: boolean }[]) => {
      for (const g of grupos) {
        const { error } = await supabase.rpc("classificar_apontamentos", {
          p_ids: g.ids,
          p_classificacao: g.classificacao,
          p_validar: g.validar,
        });
        if (error) throw error;
      }
    },
    { invalidar: INVALIDAR, sucesso: "Classificação registrada." },
  );
}
