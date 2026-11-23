import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CampoData } from "@/components/comum/CampoData";
import { CampoNumero, CampoTexto, CampoTextoLongo } from "@/components/comum/CamposFormulario";
import { CampoSelect } from "@/components/comum/CampoSelect";
import { FormularioSheet } from "@/components/comum/FormularioSheet";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useSalvarDemanda, type DemandaDetalhada } from "@/hooks/useDemandas";
import { useSessao } from "@/hooks/useSessao";
import {
  opcoesDe,
  PRIORIDADE_LABEL,
  PRIORIDADE_REGRA,
  STATUS_DEMANDA_LABEL,
  TIPO_DEMANDA_LABEL,
} from "@/lib/rotulos";
import { CamposVinculoDemanda } from "./CamposVinculoDemanda";
import { esquemaDemanda, valoresIniciais, type DadosFormDemanda } from "./esquemaDemanda";

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** Demanda em edição; null para nova. */
  demanda: DemandaDetalhada | null;
}

export function FormularioDemanda({ aberto, onAbertoChange, demanda }: Props) {
  const { colaborador } = useSessao();
  const { data: colaboradores } = useColaboradores();
  const salvar = useSalvarDemanda();
  const form = useForm<DadosFormDemanda>({ resolver: zodResolver(esquemaDemanda) });
  const prioridade = form.watch("prioridade");

  useEffect(() => {
    if (!aberto) return;
    const liderPadrao = colaborador?.papel === "lider_tecnico" ? colaborador.id : "";
    form.reset(valoresIniciais(demanda, liderPadrao));
  }, [aberto, demanda, colaborador, form]);

  const opcoesLideres = (colaboradores ?? [])
    .filter((c) => c.papel === "lider_tecnico" && (c.ativo || c.id === demanda?.lider_id))
    .map((c) => ({ valor: c.id, rotulo: c.nome }));

  const onSalvar = async ({ descricao, solicitante, ...v }: DadosFormDemanda) => {
    await salvar.mutateAsync({
      id: demanda?.id,
      dados: { ...v, descricao: descricao || null, solicitante: solicitante || null },
    });
    onAbertoChange(false);
  };

  const c = form.control;
  return (
    <FormularioSheet
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={demanda ? "Editar demanda" : "Nova demanda"}
      descricao="Toda demanda tem um único líder responsável. A estimativa pode ficar a definir."
      form={form}
      onSalvar={onSalvar}
    >
      <CampoTexto control={c} name="titulo" label="Título" />
      <CampoTextoLongo control={c} name="descricao" label="Descrição" />
      <CampoSelect control={c} name="tipo" label="Tipo" opcoes={opcoesDe(TIPO_DEMANDA_LABEL)} />
      <CamposVinculoDemanda form={form} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto control={c} name="solicitante" label="Solicitante" />
        <CampoData control={c} name="data_entrada" label="Data de entrada" />
      </div>
      <CampoSelect
        control={c}
        name="prioridade"
        label="Prioridade"
        opcoes={opcoesDe(PRIORIDADE_LABEL)}
        descricao={prioridade ? PRIORIDADE_REGRA[prioridade] : undefined}
      />
      <CampoSelect control={c} name="lider_id" label="Líder responsável" opcoes={opcoesLideres} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoNumero
          control={c}
          name="estimativa_horas"
          label="Estimativa"
          sufixo="h"
          descricao="Deixe vazio para “a definir”."
        />
        {demanda && (
          <CampoSelect control={c} name="status" label="Status" opcoes={opcoesDe(STATUS_DEMANDA_LABEL)} />
        )}
      </div>
    </FormularioSheet>
  );
}
