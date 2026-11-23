import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

export function useProjetos() {
  return useQuery({
    queryKey: ["projetos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select("*, cliente:cliente_id(nome), contrato:contrato_id(nome), lider:lider_id(nome)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export type ProjetoDetalhado = NonNullable<ReturnType<typeof useProjetos>["data"]>[number];

export type DadosProjeto = Omit<TablesInsert<"projetos">, "id" | "created_at" | "updated_at" | "created_by">;

export function useSalvarProjeto() {
  return useMutacao(
    async ({ id, dados }: { id?: string; dados: DadosProjeto }) => {
      const { error } = id
        ? await supabase.from("projetos").update(dados).eq("id", id)
        : await supabase.from("projetos").insert(dados);
      if (error) throw error;
    },
    { invalidar: [["projetos"]], sucesso: "Projeto salvo." },
  );
}
