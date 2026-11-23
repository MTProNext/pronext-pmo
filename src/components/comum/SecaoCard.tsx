import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  titulo?: string;
  descricao?: string;
  /** Ações do cartão, à direita do título. */
  acoes?: ReactNode;
  /** Filtros exibidos acima do conteúdo (use <BarraFiltros>). */
  filtros?: ReactNode;
  children: ReactNode;
}

/** Bloco de conteúdo da página, sempre dentro de um Card. */
export function SecaoCard({ titulo, descricao, acoes, filtros, children }: Props) {
  const temCabecalho = titulo || descricao || acoes;

  return (
    <Card>
      {temCabecalho && (
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            {titulo && <CardTitle>{titulo}</CardTitle>}
            {descricao && <CardDescription>{descricao}</CardDescription>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </CardHeader>
      )}
      <CardContent className={temCabecalho ? "space-y-4" : "space-y-4 pt-6"}>
        {filtros}
        {children}
      </CardContent>
    </Card>
  );
}
