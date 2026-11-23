import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import type { CategoriaHora } from "@/hooks/useCategorias";
import { formatCodigoDemanda, formatNumero, parseData } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CelulaHoras } from "./CelulaHoras";
import { LinhaDescricao } from "./LinhaDescricao";
import type { LinhaApontamento } from "./montarLinhas";

/** sem_horas = dia útil passado sem registro; folga = feriado/férias/ausência de dia inteiro. */
export type MarcaDia = "sem_horas" | "folga" | null;

interface Props {
  dias: string[];
  linhas: LinhaApontamento[];
  marcas: Map<string, MarcaDia>;
  jornadaDia: number;
  categorias: CategoriaHora[];
  onHoras: (linha: LinhaApontamento, dia: string, texto: string) => boolean;
  onDescricaoLinha: (linha: LinhaApontamento, descricao: string) => void;
  onCategoriaLinha: (linha: LinhaApontamento, categoriaId: string) => void;
  onDescricaoDia: (ap: ApontamentoView, descricao: string) => void;
  onHistorico: (ap: ApontamentoView) => void;
}

const totalDia = (linhas: LinhaApontamento[], dia: string) =>
  linhas.reduce((s, l) => s + Number(l.celulas.get(dia)?.horas ?? 0), 0);

/** Grade semanal de apontamento: demandas nas linhas, dias nas colunas. */
export function GradeApontamentos({ dias, linhas, marcas, jornadaDia, categorias, ...acoes }: Props) {
  const totalSemana = dias.reduce((s, d) => s + totalDia(linhas, d), 0);

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Demanda</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição da linha</TableHead>
            {dias.map((dia) => (
              <TableHead key={dia} className={cn("text-center", marcas.get(dia) === "sem_horas" && "text-destructive")}>
                <div className="whitespace-nowrap capitalize">{format(parseData(dia), "EEE dd/MM", { locale: ptBR })}</div>
                {marcas.get(dia) === "sem_horas" && <Badge variant="destructive" className="mt-1">Sem horas</Badge>}
                {marcas.get(dia) === "folga" && <Badge variant="outline" className="mt-1">Folga</Badge>}
              </TableHead>
            ))}
            <TableHead className="text-center">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha) => {
            const totalLinha = dias.reduce((s, d) => s + Number(linha.celulas.get(d)?.horas ?? 0), 0);
            return (
              <TableRow key={linha.demanda.id}>
                <TableCell>
                  <div className="font-medium">
                    <span className="mr-2 text-xs font-normal text-muted-foreground">
                      {formatCodigoDemanda(linha.demanda.codigo)}
                    </span>
                    {linha.demanda.titulo}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {linha.demanda.origem}
                    {linha.horasPlanejadas > 0 && ` · planejado ${formatNumero(linha.horasPlanejadas)}h`}
                  </div>
                </TableCell>
                <TableCell>
                  <Select value={linha.categoriaId ?? undefined} onValueChange={(v) => acoes.onCategoriaLinha(linha, v)}>
                    <SelectTrigger className="h-8 w-40" aria-label="Categoria">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias
                        .filter((c) => c.ativo || c.id === linha.categoriaId)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <LinhaDescricao valor={linha.descricao} onSalvar={(d) => acoes.onDescricaoLinha(linha, d)} />
                </TableCell>
                {dias.map((dia) => (
                  <TableCell key={dia} className="p-1">
                    <CelulaHoras
                      apontamento={linha.celulas.get(dia)}
                      descricaoLinha={linha.descricao}
                      destacarSemHoras={marcas.get(dia) === "sem_horas"}
                      onSalvarHoras={(texto) => acoes.onHoras(linha, dia, texto)}
                      onSalvarDescricao={acoes.onDescricaoDia}
                      onHistorico={acoes.onHistorico}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center font-medium">{totalLinha ? formatNumero(totalLinha) : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total do dia</TableCell>
            {dias.map((dia) => {
              const total = totalDia(linhas, dia);
              return (
                <TableCell
                  key={dia}
                  className={cn("text-center", total > jornadaDia && "text-destructive")}
                  title={total > jornadaDia ? "Acima da jornada diária" : undefined}
                >
                  {total ? formatNumero(total) : "—"}
                </TableCell>
              );
            })}
            <TableCell className="text-center">{formatNumero(totalSemana)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
