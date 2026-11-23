import { Loader2 } from "lucide-react";

export function Carregando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Carregando...
    </div>
  );
}
