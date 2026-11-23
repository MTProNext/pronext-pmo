import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  enviando: boolean;
  onCancelar: () => void;
  rotuloSalvar?: string;
}

/** Rodapé padrão de formulário: Cancelar + Salvar (com estado de envio). */
export function BotoesFormulario({ enviando, onCancelar, rotuloSalvar = "Salvar" }: Props) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onCancelar} disabled={enviando}>
        Cancelar
      </Button>
      <Button type="submit" disabled={enviando}>
        {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {rotuloSalvar}
      </Button>
    </>
  );
}
