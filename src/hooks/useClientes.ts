import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

export type Cliente = Tables<"clientes">;

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export type DadosCliente = Pick<TablesInsert<"clientes">, "nome" | "documento" | "contato" | "ativo">;

/** Cria (sem id) ou atualiza (com id) um cliente. */
export function useSalvarCliente() {
  return useMutacao(
    async ({ id, dados }: { id?: string; dados: DadosCliente }) => {
      const { error } = id
        ? await supabase.from("clientes").update(dados).eq("id", id)
        : await supabase.from("clientes").insert(dados);
      if (error) throw error;
    },
    { invalidar: [["clientes"]], sucesso: "Cliente salvo." },
  );
}
