import { Badge } from "@/components/ui/badge";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { formatHours } from "@/lib/format";

/** "Não planejada", "Fora do plano" (gestão/reunião) ou as horas planejadas da pessoa na demanda. */
export function SeloPlanejamento({ ap }: { ap: ApontamentoView }) {
  if (ap.nao_planejada) return <Badge variant="destructive">Não planejada</Badge>;
  if (ap.fora_do_planejamento) return <Badge variant="outline">Fora do plano</Badge>;
  return (
    <span className="text-xs text-muted-foreground">
      Planejado {formatHours(Number(ap.horas_planejadas_semana))} na semana
    </span>
  );
}
