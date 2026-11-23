import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  valor: string;
  onSalvar: (descricao: string) => void;
}

/** Descrição da linha (vale para todos os dias); mínimo de 10 caracteres. */
export function LinhaDescricao({ valor, onSalvar }: Props) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  const curta = texto.trim().length > 0 && texto.trim().length < 10;

  return (
    <div className="space-y-1">
      <Input
        value={texto}
        placeholder="O que foi feito (mín. 10 caracteres)"
        aria-label="Descrição da linha"
        aria-invalid={curta}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => texto.trim() !== valor && onSalvar(texto.trim())}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={cn("h-8 min-w-[220px]", (curta || !texto.trim()) && "border-destructive/60")}
      />
      {curta && <p className="text-xs text-destructive">Faltam {10 - texto.trim().length} caracteres.</p>}
    </div>
  );
}
