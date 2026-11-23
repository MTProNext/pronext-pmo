import type { ReactNode } from "react";

interface Props {
  titulo: string;
  descricao?: string;
  /** Botões de ação, alinhados à direita do título. */
  acoes?: ReactNode;
  children: ReactNode;
}

/** Padrão de página: título e descrição no topo, ações à direita, conteúdo abaixo. */
export function Pagina({ titulo, descricao, acoes, children }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {children}
    </div>
  );
}
