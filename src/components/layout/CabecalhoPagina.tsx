import type { ReactNode } from "react";

interface Props {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, acoes }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{titulo}</h1>
        {descricao && <p className="mt-1 text-muted-foreground">{descricao}</p>}
      </div>
      {acoes}
    </div>
  );
}
