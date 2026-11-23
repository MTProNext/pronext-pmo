import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Selo } from "@/components/comum/Selo";
import { useHistoricoDemanda } from "@/hooks/usePlanejamento";
import { formatDataHora, formatHours } from "@/lib/format";
import { TIPO_REPLANEJAMENTO_LABEL } from "@/lib/rotulos";
import { formatSemana } from "@/lib/semana";
import { SELO_FAIXA, SELO_STATUS_SEMANA } from "@/lib/selos";

/** Alocações semanais e replanejamentos da demanda (página de detalhe). */
export function HistoricoPlanejamento({ demandaId }: { demandaId: string }) {
  const { data, isLoading } = useHistoricoDemanda(demandaId);

  if (isLoading || !data) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Alocações</h3>
        {data.alocacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não alocada em nenhuma semana visível.</p>
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {data.alocacoes.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <Link to={`/planejamento/${a.semana?.inicio}`} className="font-medium underline-offset-4 hover:underline">
                    {a.semana && formatSemana(a.semana.inicio)}
                  </Link>
                  <div className="text-muted-foreground">{a.colaborador?.nome}</div>
                </div>
                <div className="flex items-center gap-2">
                  {a.faixa !== "planejado" && <Selo mapa={SELO_FAIXA} valor={a.faixa} />}
                  {a.semana && <Selo mapa={SELO_STATUS_SEMANA} valor={a.semana.status} />}
                  <span className="font-medium">{formatHours(Number(a.horas_planejadas))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Replanejamentos</h3>
        {data.replanejamentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum replanejamento envolvendo esta demanda.</p>
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {data.replanejamentos.map((r) => (
              <li key={r.id} className="space-y-1 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{TIPO_REPLANEJAMENTO_LABEL[r.tipo]}</Badge>
                  {r.pendente && <Badge variant="destructive">Pendente</Badge>}
                  <span className="text-muted-foreground">{formatDataHora(r.created_at)}</span>
                  {r.horas_depois !== null && (
                    <span className="text-muted-foreground">
                      {formatHours(Number(r.horas_antes ?? 0))} → {formatHours(Number(r.horas_depois))}
                    </span>
                  )}
                </div>
                <div>{r.motivo ?? r.descricao_auto}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
