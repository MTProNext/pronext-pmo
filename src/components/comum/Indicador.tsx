import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  rotulo: string;
  valor: ReactNode;
  descricao?: ReactNode;
  icone?: LucideIcon;
  /** Destaca o valor como alerta (text-destructive). */
  alerta?: boolean;
}

/** Cartão de indicador: rótulo pequeno, número grande e descrição. */
export function Indicador({ rotulo, valor, descricao, icone: Icone, alerta }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{rotulo}</CardTitle>
        {Icone && <Icone className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", alerta && "text-destructive")}>{valor}</div>
        {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
      </CardContent>
    </Card>
  );
}
