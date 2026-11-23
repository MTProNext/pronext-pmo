import { Loader2 } from "lucide-react";

/** Indicador de carregamento de página inteira (sessão, redirecionamentos). */
export function Carregando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Carregando...
    </div>
  );
}
