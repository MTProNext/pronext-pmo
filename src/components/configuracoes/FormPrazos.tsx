import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CampoData } from "@/components/comum/CampoData";
import { CampoNumero } from "@/components/comum/CamposFormulario";
import { CampoSelect } from "@/components/comum/CampoSelect";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { useSalvarConfiguracoes } from "@/hooks/useConfiguracoes";
import type { Tables } from "@/integrations/supabase/types";
import { DIA_SEMANA_LABEL } from "@/lib/rotulos";
import { BotaoSalvarSecao } from "./BotaoSalvarSecao";

const esquema = z.object({
  prazo_registro_dias_uteis: z.number({ invalid_type_error: "Informe os dias." }).int().min(0).max(5),
  prazo_envio_dia_semana: z.string().min(1),
  prazo_envio_hora: z.string().regex(/^\d{2}:\d{2}/, "Informe a hora (hh:mm)."),
  inicio_controle_apontamentos: z.string().nullable(),
});
type Dados = z.infer<typeof esquema>;

interface Props {
  config: Tables<"configuracoes">;
  podeEditar: boolean;
}

/** Prazos de registro diário e de envio semanal (Proprietário e Líder técnico). */
export function FormPrazos({ config, podeEditar }: Props) {
  const salvar = useSalvarConfiguracoes();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    form.reset({
      prazo_registro_dias_uteis: config.prazo_registro_dias_uteis,
      prazo_envio_dia_semana: String(config.prazo_envio_dia_semana),
      prazo_envio_hora: config.prazo_envio_hora.slice(0, 5),
      inicio_controle_apontamentos: config.inicio_controle_apontamentos,
    });
  }, [config, form]);

  const onSalvar = (d: Dados) =>
    salvar.mutate({ ...d, prazo_envio_dia_semana: Number(d.prazo_envio_dia_semana) });

  const c = form.control;
  return (
    <SecaoCard
      titulo="Prazos de apontamento"
      descricao={
        podeEditar
          ? "Base do indicador “apontamentos no prazo”. Feriados e indisponibilidades de dia inteiro não contam como dia útil."
          : "Somente Proprietário e Líder técnico alteram os prazos."
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSalvar)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoNumero
              control={c}
              name="prazo_registro_dias_uteis"
              label="Registrar as horas do dia até o fim de"
              sufixo="dia(s) útil(eis) seguinte(s)"
              passo={1}
              desabilitado={!podeEditar}
            />
            <CampoData
              control={c}
              name="inicio_controle_apontamentos"
              label="Controle de prazo desde"
              descricao="Vazio desliga o controle."
              opcional
              desabilitado={!podeEditar}
            />
            <CampoSelect
              control={c}
              name="prazo_envio_dia_semana"
              label="Enviar a semana até (semana seguinte)"
              opcoes={Object.entries(DIA_SEMANA_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }))}
              desabilitado={!podeEditar}
            />
            <FormField
              control={c}
              name="prazo_envio_hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora limite do envio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} disabled={!podeEditar} />
                  </FormControl>
                  <FormDescription>Horário de Brasília.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {podeEditar && <BotaoSalvarSecao enviando={salvar.isPending} />}
        </form>
      </Form>
    </SecaoCard>
  );
}
