import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

interface Props {
  titulo: string;
  descricao?: string;
  icone?: LucideIcon;
  /** Ação sugerida, ex.: botão "Nova demanda". */
  acao?: ReactNode;
}

/** Mensagem exibida quando uma lista ou seção não tem conteúdo. */
export function EstadoVazio({ titulo, descricao, icone: Icone = Inbox, acao }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Icone className="h-10 w-10 text-muted-foreground" />
      <p className="font-medium">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
