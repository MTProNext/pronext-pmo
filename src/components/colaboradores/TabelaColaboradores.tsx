import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ColaboradorComLider } from "@/hooks/useColaboradores";
import { formatHours } from "@/lib/format";
import { PAPEL_LABEL, SENIORIDADE_LABEL } from "@/lib/papeis";

export function TabelaColaboradores({ colaboradores }: { colaboradores: ColaboradorComLider[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Líder</TableHead>
            <TableHead className="text-right">Jornada</TableHead>
            <TableHead className="text-right">Horas dev</TableHead>
            <TableHead>Senioridade</TableHead>
            <TableHead>Competências</TableHead>
            <TableHead>Situação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {colaboradores.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="font-medium">{c.nome}</div>
                <div className="text-xs text-muted-foreground">{c.email}</div>
              </TableCell>
              <TableCell>{PAPEL_LABEL[c.papel]}</TableCell>
              <TableCell>{c.lider?.nome ?? "—"}</TableCell>
              <TableCell className="text-right">{formatHours(c.jornada_semanal)}</TableCell>
              <TableCell className="text-right">{formatHours(c.horas_dev_semanais)}</TableCell>
              <TableCell>{c.senioridade ? SENIORIDADE_LABEL[c.senioridade] : "—"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {c.competencias.map((comp) => (
                    <Badge key={comp} variant="secondary">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={c.ativo ? "default" : "outline"}>{c.ativo ? "Ativo" : "Inativo"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
