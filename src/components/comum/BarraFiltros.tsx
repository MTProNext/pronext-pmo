import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Exibe o botão "Limpar filtros" quando informado. */
  onLimpar?: () => void;
  /** Mostra o botão de limpar apenas se algum filtro estiver ativo. */
  filtrosAtivos?: boolean;
}

/** Linha de filtros acima de uma lista. */
export function BarraFiltros({ children, onLimpar, filtrosAtivos }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
      {onLimpar && filtrosAtivos && (
        <Button variant="ghost" size="sm" onClick={onLimpar}>
          <X className="mr-1 h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
