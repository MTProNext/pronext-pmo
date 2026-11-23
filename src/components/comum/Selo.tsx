import { Badge } from "@/components/ui/badge";
import type { MapaSelos } from "@/lib/selos";

interface Props<T extends string> {
  mapa: MapaSelos<T>;
  valor: T;
}

/**
 * Selo de status/prioridade. Usa só as variantes do Badge do shadcn;
 * o rótulo e a variante de cada valor ficam em src/lib/selos.ts.
 */
export function Selo<T extends string>({ mapa, valor }: Props<T>) {
  const { rotulo, variante } = mapa[valor];
  return <Badge variant={variante}>{rotulo}</Badge>;
}
