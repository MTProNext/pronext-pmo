import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Undo2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { formatCodigoDemanda, formatDate, parseData } from "@/lib/format";

interface Props {
  devolvidos: ApontamentoView[];
  /** Dias úteis passados sem nenhuma hora registrada ("aaaa-mm-dd"). */
  diasSemHoras: string[];
}

/** Avisos do topo da tela de apontamento: dias sem horas e apontamentos devolvidos. */
export function AvisosApontamento({ devolvidos, diasSemHoras }: Props) {
  return (
    <>
      {diasSemHoras.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dias úteis sem horas registradas</AlertTitle>
          <AlertDescription>
            {diasSemHoras.map((d) => format(parseData(d), "EEEE dd/MM", { locale: ptBR })).join(", ")}. Cada dia útil deve
            ser registrado até o fim do dia útil seguinte.
          </AlertDescription>
        </Alert>
      )}
      {devolvidos.length > 0 && (
        <Alert>
          <Undo2 className="h-4 w-4" />
          <AlertTitle>{devolvidos.length} apontamento(s) devolvido(s) para correção</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {devolvidos.map((ap) => (
                <li key={ap.id}>
                  {formatDate(ap.data)} · {formatCodigoDemanda(ap.demanda_codigo)} {ap.demanda_titulo}:{" "}
                  <strong>{ap.motivo_devolucao}</strong>
                </li>
              ))}
            </ul>
            <p className="mt-2">Corrija na grade (ícone de descrição da célula) e envie a semana de novo.</p>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
