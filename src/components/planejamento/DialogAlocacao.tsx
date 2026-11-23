import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CampoNumero, CampoTextoLongo } from "@/components/comum/CamposFormulario";
import { CampoSelect } from "@/components/comum/CampoSelect";
import { FormularioDialog } from "@/components/comum/FormularioDialog";
import { useReplanejarItem, useSalvarAlocacao } from "@/hooks/useAcoesPlanejamento";
import { useDemandas } from "@/hooks/useDemandas";
import type { CapacidadePessoa, ItemPlanejamento, Semana } from "@/hooks/usePlanejamento";
import { formatCodigoDemanda, formatHours } from "@/lib/format";
import type { CelulaSelecionada } from "./GradePlanejamento";
import { criarEsquemaAlocacao, type DadosAlocacao } from "./esquemaAlocacao";

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  semana: Semana;
  /** Célula clicada; sem ela, o diálogo serve para adicionar uma nova alocação. */
  celula: CelulaSelecionada | null;
  pessoas: CapacidadePessoa[];
  itens: ItemPlanejamento[];
}

/** Em rascunho grava direto; publicada/confirmada/em execução exige replanejamento. */
export function DialogAlocacao({ aberto, onAbertoChange, semana, celula, pessoas, itens }: Props) {
  const replanejamento = semana.status !== "rascunho";
  const { data: demandas } = useDemandas();
  const salvar = useSalvarAlocacao();
  const replanejar = useReplanejarItem();

  const horasAtuais = useCallback(
    (demandaId: string, colaboradorId: string) =>
      Number(itens.find((i) => i.demanda_id === demandaId && i.colaborador_id === colaboradorId)?.horas_planejadas ?? 0),
    [itens],
  );
  const esquema = useMemo(() => criarEsquemaAlocacao(replanejamento, horasAtuais), [replanejamento, horasAtuais]);
  const form = useForm<DadosAlocacao>({ resolver: zodResolver(esquema) });
  const [demandaId, colaboradorId] = form.watch(["demanda_id", "colaborador_id"]);

  useEffect(() => {
    if (!aberto) return;
    form.reset({
      demanda_id: celula?.demandaId ?? "",
      colaborador_id: celula?.colaboradorId ?? "",
      horas: celula?.item ? Number(celula.item.horas_planejadas) : null,
      faixa: celula?.item?.faixa ?? "planejado",
      motivo: "",
      impacto: "",
    });
  }, [aberto, celula, form]);

  // Demandas em aberto (as já presentes na grade também aparecem).
  const opcoesDemandas = (demandas ?? [])
    .filter((d) => (d.status !== "concluida" && d.status !== "cancelada") || d.id === celula?.demandaId)
    .map((d) => ({ valor: d.id, rotulo: `${formatCodigoDemanda(d.codigo)} · ${d.titulo}` }));
  const demandaInterna = (demandas ?? []).find((d) => d.id === demandaId)?.cliente_id === null;
  const antes = demandaId && colaboradorId ? horasAtuais(demandaId, colaboradorId) : 0;

  const onSalvar = async (v: DadosAlocacao) => {
    const base = {
      semanaId: semana.id,
      colaboradorId: v.colaborador_id,
      demandaId: v.demanda_id,
      horas: v.horas ?? 0,
      faixa: demandaInterna ? ("interno" as const) : v.faixa,
    };
    if (replanejamento) await replanejar.mutateAsync({ ...base, motivo: v.motivo!, impacto: v.impacto! });
    else await salvar.mutateAsync(base);
    onAbertoChange(false);
  };

  const c = form.control;
  return (
    <FormularioDialog
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={replanejamento ? "Replanejar alocação" : celula?.item ? "Editar alocação" : "Nova alocação"}
      descricao={
        replanejamento
          ? "A semana já foi publicada: a alteração fica registrada no log com motivo, responsável e impacto."
          : "Semana em rascunho: a alteração vale direto na grade."
      }
      form={form}
      onSalvar={onSalvar}
      rotuloSalvar={replanejamento ? "Registrar replanejamento" : "Salvar"}
    >
      <CampoSelect control={c} name="demanda_id" label="Demanda" opcoes={opcoesDemandas} desabilitado={!!celula} />
      <CampoSelect
        control={c}
        name="colaborador_id"
        label="Colaborador"
        desabilitado={!!celula}
        opcoes={pessoas.map((p) => ({ valor: p.colaborador_id!, rotulo: p.colaborador_nome! }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Horas antes</p>
          <p className="flex h-10 items-center text-sm text-muted-foreground">{formatHours(antes)}</p>
        </div>
        <CampoNumero control={c} name="horas" label="Horas depois" sufixo="h" descricao="0 remove a alocação." />
      </div>
      {demandaInterna ? (
        <p className="text-sm text-muted-foreground">Demanda interna: entra na faixa Interno automaticamente.</p>
      ) : (
        <CampoSelect
          control={c}
          name="faixa"
          label="Faixa"
          descricao="Use Reserva ao alocar um item do backlog na reserva da semana."
          opcoes={[
            { valor: "planejado", rotulo: "Planejado" },
            { valor: "reserva", rotulo: "Reserva" },
          ]}
        />
      )}
      {replanejamento && (
        <>
          <CampoTextoLongo control={c} name="motivo" label="Motivo" />
          <CampoTextoLongo control={c} name="impacto" label="Impacto" descricao="O que muda para outras demandas, prazos ou pessoas." />
        </>
      )}
    </FormularioDialog>
  );
}
