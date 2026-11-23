import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, TablesInsert } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

const CAMPOS_LISTA = "*, cliente:cliente_id(nome), projeto:projeto_id(nome), lider:lider_id(nome)";

/** Backlog ordenado por prioridade (P1 primeiro) e data de entrada. */
export function useDemandas() {
  return useQuery({
    queryKey: ["demandas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandas")
        .select(CAMPOS_LISTA)
        .order("prioridade")
        .order("data_entrada");
      if (error) throw error;
      return data;
    },
  });
}

export type DemandaDaLista = NonNullable<ReturnType<typeof useDemandas>["data"]>[number];

/** Uma demanda com cliente, contrato, projeto, líder e autor. */
export function useDemanda(id: string | undefined) {
  return useQuery({
    queryKey: ["demandas", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandas")
        .select(`${CAMPOS_LISTA}, contrato:contrato_id(nome), autor:created_by(nome)`)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type DemandaDetalhada = NonNullable<ReturnType<typeof useDemanda>["data"]>;

export type DadosDemanda = Omit<
  TablesInsert<"demandas">,
  "id" | "codigo" | "concluida_em" | "created_at" | "updated_at" | "created_by"
>;

export function useSalvarDemanda() {
  return useMutacao(
    async ({ id, dados }: { id?: string; dados: DadosDemanda }) => {
      const { error } = id
        ? await supabase.from("demandas").update(dados).eq("id", id)
        : await supabase.from("demandas").insert(dados);
      if (error) throw error;
    },
    { invalidar: [["demandas"]], sucesso: "Demanda salva." },
  );
}

export function useAlterarStatusDemanda() {
  return useMutacao(
    async ({ id, status }: { id: string; status: Enums<"status_demanda"> }) => {
      const { error } = await supabase.from("demandas").update({ status }).eq("id", id);
      if (error) throw error;
    },
    { invalidar: [["demandas"]], sucesso: "Status atualizado." },
  );
}
