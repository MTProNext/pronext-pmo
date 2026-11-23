import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { BotaoSalvarSecao } from "./BotaoSalvarSecao";
import { CampoNumero } from "@/components/comum/CamposFormulario";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { useSalvarConfiguracoes } from "@/hooks/useConfiguracoes";
import type { Tables } from "@/integrations/supabase/types";

const esquema = z.object({
  dia_limite_fechamento: z
    .number({ invalid_type_error: "Informe o dia." })
    .int("Informe um dia inteiro.")
    .min(1)
    .max(28),
});

type Dados = z.infer<typeof esquema>;

interface Props {
  config: Tables<"configuracoes">;
  podeEditar: boolean;
}

/** Data-limite do fechamento mensal: editável por Proprietário e Administrativo (trigger no banco). */
export function FormFechamento({ config, podeEditar }: Props) {
  const salvar = useSalvarConfiguracoes();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    form.reset({ dia_limite_fechamento: config.dia_limite_fechamento });
  }, [config, form]);

  return (
    <SecaoCard
      titulo="Fechamento mensal"
      descricao={
        podeEditar
          ? "Até que dia do mês seguinte as horas do mês podem ser fechadas."
          : "Somente Proprietário e Administrativo alteram a data-limite."
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => salvar.mutate(d))} className="space-y-6">
          <div className="max-w-xs">
            <CampoNumero
              control={form.control}
              name="dia_limite_fechamento"
              label="Dia-limite do fechamento"
              descricao="Entre 1 e 28 do mês seguinte."
              passo={1}
              desabilitado={!podeEditar}
            />
          </div>
          {podeEditar && <BotaoSalvarSecao enviando={salvar.isPending} />}
        </form>
      </Form>
    </SecaoCard>
  );
}
