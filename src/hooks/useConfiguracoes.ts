import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

/** Configurações globais (linha única). */
export function useConfiguracoes() {
  return useQuery({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Atualiza parte das configurações. O trigger configuracoes_guardar_colunas
 * recusa colunas que o perfil não pode alterar.
 */
export function useSalvarConfiguracoes() {
  return useMutacao(
    async (dados: Omit<TablesUpdate<"configuracoes">, "id">) => {
      const { error } = await supabase.from("configuracoes").update(dados).eq("id", true);
      if (error) throw error;
    },
    { invalidar: [["configuracoes"]], sucesso: "Configurações salvas." },
  );
}
