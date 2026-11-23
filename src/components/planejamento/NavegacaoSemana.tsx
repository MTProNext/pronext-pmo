import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deslocarSemana, inicioSemanaAtual } from "@/lib/semana";

interface Props {
  inicio: string;
  onChange: (inicio: string) => void;
}

/** Semana anterior / atual / próxima. */
export function NavegacaoSemana({ inicio, onChange }: Props) {
  const atual = inicioSemanaAtual();
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" aria-label="Semana anterior" onClick={() => onChange(deslocarSemana(inicio, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" disabled={inicio === atual} onClick={() => onChange(atual)}>
        Semana atual
      </Button>
      <Button variant="outline" size="icon" aria-label="Próxima semana" onClick={() => onChange(deslocarSemana(inicio, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
