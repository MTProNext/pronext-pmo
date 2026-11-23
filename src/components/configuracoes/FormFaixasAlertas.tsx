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

const pct = z.number({ invalid_type_error: "Informe um percentual." }).min(0).max(100);

const esquema = z
  .object({
    pct_planejado: pct,
    pct_reserva: pct,
    pct_interno: pct,
    dias_alerta_projeto_sem_atualizacao: z.number({ invalid_type_error: "Informe os dias." }).int().min(1),
    pct_alerta_contrato: pct,
  })
  .refine((v) => v.pct_planejado + v.pct_reserva + v.pct_interno === 100, {
    path: ["pct_interno"],
    message: "Planejado + reserva + interno precisam somar 100%.",
  });

type Dados = z.infer<typeof esquema>;

interface Props {
  config: Tables<"configuracoes">;
  podeEditar: boolean;
}

/** Faixas de capacidade e alertas: editáveis por Proprietário e Líder técnico. */
export function FormFaixasAlertas({ config, podeEditar }: Props) {
  const salvar = useSalvarConfiguracoes();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    form.reset({
      pct_planejado: config.pct_planejado,
      pct_reserva: config.pct_reserva,
      pct_interno: config.pct_interno,
      dias_alerta_projeto_sem_atualizacao: config.dias_alerta_projeto_sem_atualizacao,
      pct_alerta_contrato: config.pct_alerta_contrato,
    });
  }, [config, form]);

  const c = form.control;
  const bloqueado = !podeEditar;

  return (
    <SecaoCard
      titulo="Capacidade e alertas"
      descricao={
        podeEditar
          ? "Distribuição da capacidade semanal e limites de alerta."
          : "Somente Proprietário e Líder técnico alteram estes valores."
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => salvar.mutate(d))} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoNumero control={c} name="pct_planejado" label="Planejado" sufixo="%" passo={1} desabilitado={bloqueado} />
            <CampoNumero control={c} name="pct_reserva" label="Reserva" sufixo="%" passo={1} desabilitado={bloqueado} />
            <CampoNumero control={c} name="pct_interno" label="Interno" sufixo="%" passo={1} desabilitado={bloqueado} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoNumero
              control={c}
              name="dias_alerta_projeto_sem_atualizacao"
              label="Alertar projeto sem atualização após"
              sufixo="dias"
              passo={1}
              desabilitado={bloqueado}
            />
            <CampoNumero
              control={c}
              name="pct_alerta_contrato"
              label="Alertar contrato com consumo a partir de"
              sufixo="%"
              passo={1}
              desabilitado={bloqueado}
            />
          </div>
          {podeEditar && <BotaoSalvarSecao enviando={salvar.isPending} />}
        </form>
      </Form>
    </SecaoCard>
  );
}
