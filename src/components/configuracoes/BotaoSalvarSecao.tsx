import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botão Salvar de um cartão de configurações. */
export function BotaoSalvarSecao({ enviando }: { enviando: boolean }) {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={enviando}>
        {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar
      </Button>
    </div>
  );
}
