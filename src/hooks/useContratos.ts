import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useMutacao } from "./useMutacao";

export function useContratos() {
  return useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*, cliente:cliente_id(nome)")
        .order("vigencia_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type ContratoComCliente = NonNullable<ReturnType<typeof useContratos>["data"]>[number];

/** Valor/hora por contrato. Só Proprietário e Administrativo têm acesso (RLS). */
export function useValoresContratos(habilitado: boolean) {
  return useQuery({
    queryKey: ["contratos_valores"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase.from("contratos_valores").select("contrato_id, valor_hora");
      if (error) throw error;
      return new Map(data.map((v) => [v.contrato_id, v.valor_hora]));
    },
  });
}

export type DadosContrato = Omit<TablesInsert<"contratos">, "id" | "created_at" | "updated_at" | "created_by">;

interface SalvarContrato {
  id?: string;
  dados: DadosContrato;
  /** undefined = não mexer no valor (usuário sem acesso); null = remover. */
  valorHora?: number | null;
}

/** Cria/atualiza o contrato e, se informado, o valor/hora em contratos_valores. */
export function useSalvarContrato() {
  return useMutacao(
    async ({ id, dados, valorHora }: SalvarContrato) => {
      let contratoId = id;
      if (id) {
        const { error } = await supabase.from("contratos").update(dados).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("contratos").insert(dados).select("id").single();
        if (error) throw error;
        contratoId = data.id;
      }

      if (valorHora === undefined || !contratoId) return;
      const { error } =
        valorHora === null
          ? await supabase.from("contratos_valores").delete().eq("contrato_id", contratoId)
          : await supabase
              .from("contratos_valores")
              .upsert({ contrato_id: contratoId, valor_hora: valorHora });
      if (error) throw error;
    },
    { invalidar: [["contratos"], ["contratos_valores"]], sucesso: "Contrato salvo." },
  );
}
