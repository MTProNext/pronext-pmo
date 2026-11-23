import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Coluna } from "@/components/comum/TabelaDados";
import type { Replanejamento } from "@/hooks/usePlanejamento";
import { formatCodigoDemanda, formatDataHora, formatHours } from "@/lib/format";
import { TIPO_REPLANEJAMENTO_LABEL } from "@/lib/rotulos";

const horas = (r: Replanejamento) =>
  r.horas_antes === null && r.horas_depois === null
    ? "—"
    : `${formatHours(Number(r.horas_antes ?? 0))} → ${formatHours(Number(r.horas_depois ?? 0))}`;

const texto = (valor: string | null) =>
  valor ?? <span className="text-muted-foreground">Aguardando</span>;

/** Colunas do log; "Completar" aparece nos pendentes quando há permissão. */
export function colunasReplanejamentos(onCompletar?: (r: Replanejamento) => void): Coluna<Replanejamento>[] {
  return [
    {
      chave: "quando",
      titulo: "Quando",
      className: "whitespace-nowrap",
      celula: (r) => formatDataHora(r.created_at),
    },
    {
      chave: "tipo",
      titulo: "Tipo",
      celula: (r) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="outline">{TIPO_REPLANEJAMENTO_LABEL[r.tipo]}</Badge>
          {r.pendente && <Badge variant="destructive">Pendente</Badge>}
        </div>
      ),
    },
    {
      chave: "demanda",
      titulo: "Demanda",
      celula: (r) =>
        r.demanda ? (
          <div>
            <div className="text-xs text-muted-foreground">{formatCodigoDemanda(r.demanda.codigo)}</div>
            <div>{r.demanda.titulo}</div>
          </div>
        ) : (
          "—"
        ),
    },
    { chave: "colaborador", titulo: "Colaborador", celula: (r) => r.colaborador?.nome ?? "—" },
    { chave: "horas", titulo: "Horas", className: "whitespace-nowrap", celula: horas },
    {
      chave: "motivo",
      titulo: "Motivo",
      celula: (r) => (
        <div className="max-w-xs">
          {texto(r.motivo)}
          {r.descricao_auto && <div className="mt-1 text-xs text-muted-foreground">{r.descricao_auto}</div>}
        </div>
      ),
    },
    { chave: "impacto", titulo: "Impacto", celula: (r) => <div className="max-w-xs">{texto(r.impacto)}</div> },
    {
      chave: "responsavel",
      titulo: "Responsável",
      celula: (r) => (
        <div>
          <div>{r.responsavel?.nome ?? "—"}</div>
          {r.completador && (
            <div className="text-xs text-muted-foreground">
              completado por {r.completador.nome}
              {r.completado_em && ` em ${formatDataHora(r.completado_em)}`}
            </div>
          )}
        </div>
      ),
    },
    {
      chave: "acoes",
      titulo: "",
      alinhamento: "direita",
      celula: (r) =>
        r.pendente && onCompletar ? (
          <Button size="sm" variant="outline" onClick={() => onCompletar(r)}>
            Completar
          </Button>
        ) : null,
    },
  ];
}
