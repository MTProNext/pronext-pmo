import type { ReactNode } from "react";
import type { DemandaDetalhada } from "@/hooks/useDemandas";
import { formatDate } from "@/lib/format";
import { PRIORIDADE_REGRA, TIPO_DEMANDA_LABEL } from "@/lib/rotulos";
import { Estimativa } from "./Estimativa";

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

/** Lista de atributos da demanda (página de detalhe). */
export function DadosDemanda({ demanda: d }: { demanda: DemandaDetalhada }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Item rotulo="Cliente">{d.cliente?.nome ?? "Interno"}</Item>
      <Item rotulo="Projeto">{d.projeto?.nome ?? "—"}</Item>
      <Item rotulo="Contrato">{d.contrato?.nome ?? "—"}</Item>
      <Item rotulo="Tipo">{TIPO_DEMANDA_LABEL[d.tipo]}</Item>
      <Item rotulo="Líder responsável">{d.lider?.nome ?? "—"}</Item>
      <Item rotulo="Estimativa">
        <Estimativa horas={d.estimativa_horas} />
      </Item>
      <Item rotulo="Solicitante">{d.solicitante ?? "—"}</Item>
      <Item rotulo="Data de entrada">{formatDate(d.data_entrada)}</Item>
      <Item rotulo="Regra da prioridade">{PRIORIDADE_REGRA[d.prioridade]}</Item>
      <Item rotulo="Registrada por">{d.autor?.nome ?? "—"}</Item>
      <Item rotulo="Concluída em">{d.concluida_em ? formatDate(d.concluida_em) : "—"}</Item>
    </dl>
  );
}
