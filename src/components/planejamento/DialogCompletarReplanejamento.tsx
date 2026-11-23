import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CampoTextoLongo } from "@/components/comum/CamposFormulario";
import { FormularioDialog } from "@/components/comum/FormularioDialog";
import { useCompletarReplanejamento } from "@/hooks/useAcoesPlanejamento";
import type { Replanejamento } from "@/hooks/usePlanejamento";
import { formatCodigoDemanda } from "@/lib/format";

const esquema = z.object({
  motivo: z.string().trim().min(1, "Informe o motivo."),
  impacto: z.string().trim().min(1, "Informe o impacto."),
});
type Dados = z.infer<typeof esquema>;

interface Props {
  replanejamento: Replanejamento | null;
  onFechar: () => void;
}

/** Líder completa motivo e impacto de um replanejamento gerado por P1/P2. */
export function DialogCompletarReplanejamento({ replanejamento: r, onFechar }: Props) {
  const completar = useCompletarReplanejamento();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    if (r) form.reset({ motivo: "", impacto: "" });
  }, [r, form]);

  const onSalvar = async (v: Dados) => {
    if (!r) return;
    await completar.mutateAsync({ id: r.id, ...v });
    onFechar();
  };

  const demanda = r?.demanda ? `${formatCodigoDemanda(r.demanda.codigo)} · ${r.demanda.titulo}` : "";

  return (
    <FormularioDialog
      aberto={!!r}
      onAbertoChange={(aberto) => !aberto && onFechar()}
      titulo="Completar replanejamento"
      descricao={[demanda, r?.descricao_auto].filter(Boolean).join(" — ")}
      form={form}
      onSalvar={onSalvar}
      rotuloSalvar="Completar"
    >
      <CampoTextoLongo control={form.control} name="motivo" label="Motivo" descricao="Por que a demanda entrou ou subiu de prioridade nesta semana." />
      <CampoTextoLongo control={form.control} name="impacto" label="Impacto" descricao="O que foi reprogramado (pessoas, demandas, prazos)." />
    </FormularioDialog>
  );
}
