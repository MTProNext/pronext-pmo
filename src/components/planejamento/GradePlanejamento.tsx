import { Fragment } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CapacidadePessoa, ItemPlanejamento } from "@/hooks/usePlanejamento";
import { formatCodigoDemanda, formatNumero } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GrupoGrade, LinhaGrade } from "./montarGrade";

export interface CelulaSelecionada {
  demandaId: string;
  colaboradorId: string;
  item?: ItemPlanejamento;
}

interface Props {
  grupos: GrupoGrade[];
  pessoas: CapacidadePessoa[];
  /** Se informado, as células viram botões (rascunho ou replanejamento). */
  onCelula?: (celula: CelulaSelecionada) => void;
}

const primeiroNome = (nome: string | null) => (nome ?? "").split(" ")[0];
const num = (n: number) => (n ? formatNumero(n) : "—");

function Celula({ linha, pessoa, onCelula }: { linha: LinhaGrade; pessoa: CapacidadePessoa; onCelula?: Props["onCelula"] }) {
  const item = linha.itens.get(pessoa.colaborador_id!);
  const conteudo = (
    <>
      <span>{item ? formatNumero(Number(item.horas_planejadas)) : onCelula ? "+" : "—"}</span>
      {item && item.faixa !== "planejado" && (
        <span className="block text-[10px] leading-none text-muted-foreground">{item.faixa}</span>
      )}
    </>
  );

  if (!onCelula) return <TableCell className="text-center">{conteudo}</TableCell>;
  return (
    <TableCell className="p-1 text-center">
      <button
        type="button"
        onClick={() => onCelula({ demandaId: linha.demanda.id, colaboradorId: pessoa.colaborador_id!, item })}
        className={cn(
          "w-full rounded-md px-2 py-1.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !item && "text-muted-foreground/50",
        )}
      >
        {conteudo}
      </button>
    </TableCell>
  );
}

/** Grade da semana: demandas nas linhas, colaboradores nas colunas. */
export function GradePlanejamento({ grupos, pessoas, onCelula }: Props) {
  const totalCapacidade = pessoas.reduce((s, p) => s + Number(p.capacidade_efetiva), 0);
  const totalPlanejado = pessoas.reduce((s, p) => s + Number(p.horas_planejadas), 0);
  const saldoTotal = totalCapacidade - totalPlanejado;

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[240px]">Demanda</TableHead>
            {pessoas.map((p) => (
              <TableHead key={p.colaborador_id} className={cn("text-center", p.excede_capacidade && "text-destructive")}>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  {p.excede_capacidade && <AlertTriangle className="h-3.5 w-3.5" aria-label="Acima da capacidade" />}
                  {primeiroNome(p.colaborador_nome)}
                </span>
              </TableHead>
            ))}
            <TableHead className="text-center">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupos.map((g) => (
            <Fragment key={g.chave}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={pessoas.length + 2} className="py-2 text-xs font-semibold uppercase text-muted-foreground">
                  {g.titulo}
                </TableCell>
              </TableRow>
              {g.linhas.map((linha) => (
                <TableRow key={linha.demanda.id}>
                  <TableCell>
                    <span className="mr-2 text-xs text-muted-foreground">{formatCodigoDemanda(linha.demanda.codigo)}</span>
                    {linha.demanda.titulo}
                  </TableCell>
                  {pessoas.map((p) => (
                    <Celula key={p.colaborador_id} linha={linha} pessoa={p} onCelula={onCelula} />
                  ))}
                  <TableCell className="text-center font-medium">{num(linha.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-xs text-muted-foreground">Subtotal {g.titulo}</TableCell>
                {pessoas.map((p) => (
                  <TableCell key={p.colaborador_id} className="text-center text-xs text-muted-foreground">
                    {num(g.subtotais.get(p.colaborador_id!) ?? 0)}
                  </TableCell>
                ))}
                <TableCell className="text-center text-xs font-medium">{num(g.subtotal)}</TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Capacidade efetiva</TableCell>
            {pessoas.map((p) => (
              <TableCell key={p.colaborador_id} className="text-center">{formatNumero(Number(p.capacidade_efetiva))}</TableCell>
            ))}
            <TableCell className="text-center">{formatNumero(totalCapacidade)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Planejado</TableCell>
            {pessoas.map((p) => (
              <TableCell key={p.colaborador_id} className={cn("text-center", p.excede_capacidade && "text-destructive")}>
                {formatNumero(Number(p.horas_planejadas))}
              </TableCell>
            ))}
            <TableCell className="text-center">{formatNumero(totalPlanejado)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Saldo</TableCell>
            {pessoas.map((p) => {
              const saldo = Number(p.capacidade_efetiva) - Number(p.horas_planejadas);
              return (
                <TableCell key={p.colaborador_id} className={cn("text-center font-semibold", saldo < 0 && "text-destructive")}>
                  {formatNumero(Number(saldo.toFixed(2)))}
                </TableCell>
              );
            })}
            <TableCell className={cn("text-center font-semibold", saldoTotal < 0 && "text-destructive")}>
              {formatNumero(Number(saldoTotal.toFixed(2)))}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
