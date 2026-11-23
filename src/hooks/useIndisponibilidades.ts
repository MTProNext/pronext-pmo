import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

export function useIndisponibilidades() {
  return useQuery({
    queryKey: ["indisponibilidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indisponibilidades")
        .select("*, colaborador:colaborador_id(nome)")
        .order("data_inicio");
      if (error) throw error;
      return data;
    },
  });
}

export type IndisponibilidadeDetalhada = NonNullable<
  ReturnType<typeof useIndisponibilidades>["data"]
>[number];

export type DadosIndisponibilidade = Omit<
  TablesInsert<"indisponibilidades">,
  "id" | "created_at" | "updated_at" | "created_by"
>;

export function useSalvarIndisponibilidade() {
  return useMutacao(
    async ({ id, dados }: { id?: string; dados: DadosIndisponibilidade }) => {
      const { error } = id
        ? await supabase.from("indisponibilidades").update(dados).eq("id", id)
        : await supabase.from("indisponibilidades").insert(dados);
      if (error) throw error;
    },
    { invalidar: [["indisponibilidades"]], sucesso: "Indisponibilidade salva." },
  );
}

export function useExcluirIndisponibilidade() {
  return useMutacao(
    async (id: string) => {
      const { error } = await supabase.from("indisponibilidades").delete().eq("id", id);
      if (error) throw error;
    },
    { invalidar: [["indisponibilidades"]], sucesso: "Indisponibilidade excluída." },
  );
}
