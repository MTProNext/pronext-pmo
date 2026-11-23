import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

export type CategoriaHora = Tables<"categorias_hora">;

/** Categorias de horas, na ordem configurada. */
export function useCategorias() {
  return useQuery({
    queryKey: ["categorias_hora"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias_hora").select("*").order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

type DadosCategoria = Pick<CategoriaHora, "nome" | "fora_do_planejamento" | "ativo"> & { codigo?: string };

export function useSalvarCategoria() {
  return useMutacao(
    async ({ id, dados }: { id?: string; dados: DadosCategoria }) => {
      const { error } = id
        ? await supabase.from("categorias_hora").update(dados).eq("id", id)
        : await supabase
            .from("categorias_hora")
            .insert({ ...dados, codigo: dados.codigo ?? crypto.randomUUID(), ordem: 99 });
      if (error) throw error;
    },
    { invalidar: [["categorias_hora"]], sucesso: "Categoria salva." },
  );
}
