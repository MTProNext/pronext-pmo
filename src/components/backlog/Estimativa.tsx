import { Badge } from "@/components/ui/badge";
import { formatHours } from "@/lib/format";

/** Estimativa em horas ou o selo "A definir" (estimativas são progressivas). */
export function Estimativa({ horas }: { horas: number | null }) {
  return horas === null ? <Badge variant="outline">A definir</Badge> : <>{formatHours(horas)}</>;
}
