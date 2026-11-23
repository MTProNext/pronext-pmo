import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EstadoVazio } from "./EstadoVazio";

export interface Coluna<T> {
  chave: string;
  titulo: string;
  celula: (linha: T) => ReactNode;
  alinhamento?: "esquerda" | "direita" | "centro";
  className?: string;
}

interface Props<T> {
  colunas: Coluna<T>[];
  dados: T[] | undefined;
  carregando?: boolean;
  /** Chave única de cada linha. */
  chaveLinha: (linha: T) => string;
  onLinhaClick?: (linha: T) => void;
  vazio?: { titulo: string; descricao?: string; acao?: ReactNode };
  linhasSkeleton?: number;
}

const ALINHAMENTO = { esquerda: "", direita: "text-right", centro: "text-center" };

/** Lista padrão: Table do shadcn com skeleton de carregamento e estado vazio. */
export function TabelaDados<T>({
  colunas,
  dados,
  carregando,
  chaveLinha,
  onLinhaClick,
  vazio = { titulo: "Nenhum registro encontrado." },
  linhasSkeleton = 5,
}: Props<T>) {
  if (!carregando && dados && dados.length === 0) {
    return <EstadoVazio {...vazio} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {colunas.map((c) => (
              <TableHead
                key={c.chave}
                className={cn(ALINHAMENTO[c.alinhamento ?? "esquerda"], c.className)}
              >
                {c.titulo}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {carregando || !dados
            ? Array.from({ length: linhasSkeleton }, (_, i) => (
                <TableRow key={i}>
                  {colunas.map((c) => (
                    <TableCell key={c.chave}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : dados.map((linha) => (
                <TableRow
                  key={chaveLinha(linha)}
                  onClick={onLinhaClick ? () => onLinhaClick(linha) : undefined}
                  className={onLinhaClick ? "cursor-pointer" : undefined}
                >
                  {colunas.map((c) => (
                    <TableCell
                      key={c.chave}
                      className={cn(ALINHAMENTO[c.alinhamento ?? "esquerda"], c.className)}
                    >
                      {c.celula(linha)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
