import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ResumoSemana } from "@/hooks/usePlanejamento";
import { formatHours, formatNumero } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Faixa {
  rotulo: string;
  pct: number | null;
  limite: number | null;
  horas: number | null;
  alerta: boolean | null;
}

function BarraFaixa({ rotulo, pct, limite, horas, alerta }: Faixa) {
  const h = horas ?? 0;
  const lim = limite ?? 0;
  const uso = lim > 0 ? (h / lim) * 100 : h > 0 ? 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">
          {rotulo} <span className="font-normal text-muted-foreground">({formatNumero(pct ?? 0)}%)</span>
        </span>
        <span className={cn("text-muted-foreground", alerta && "font-medium text-destructive")}>
          {alerta && <AlertTriangle className="mr-1 inline h-4 w-4" />}
          {formatHours(h)} de {formatHours(lim)} ({formatNumero(Math.round(uso))}%)
        </span>
      </div>
      <Progress value={Math.min(uso, 100)} className={cn(alerta && "[&>div]:bg-destructive")} />
      {alerta && (
        <p className="text-xs text-destructive">
          Acima da faixa configurada em {formatHours(Number((h - lim).toFixed(2)))}.
        </p>
      )}
    </div>
  );
}

/** Barras das faixas planejado/reserva/interno contra os limites da configuração. */
export function FaixasCapacidade({ resumo: r }: { resumo: ResumoSemana }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <BarraFaixa
        rotulo="Planejado"
        pct={r.pct_planejado}
        limite={r.limite_planejado}
        horas={r.horas_planejado}
        alerta={r.alerta_planejado}
      />
      <BarraFaixa rotulo="Reserva" pct={r.pct_reserva} limite={r.limite_reserva} horas={r.horas_reserva} alerta={r.alerta_reserva} />
      <BarraFaixa rotulo="Interno" pct={r.pct_interno} limite={r.limite_interno} horas={r.horas_interno} alerta={r.alerta_interno} />
    </div>
  );
}
