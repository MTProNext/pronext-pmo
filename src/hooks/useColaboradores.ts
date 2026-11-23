import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Colaboradores com o nome do líder direto, ordenados por nome. */
export function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*, lider:lider_id(nome)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export type ColaboradorComLider = NonNullable<ReturnType<typeof useColaboradores>["data"]>[number];
