import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePrazosDias } from "@/hooks/useApontamentos";
import { paraDataISO, parseData } from "@/lib/format";
import { deslocarSemana, inicioSemanaAtual, segundaDaSemana } from "@/lib/semana";

/** Aviso de dias úteis passados (semana atual e anterior) sem nenhuma hora registrada. */
export function AvisoDiasSemHoras({ colaboradorId }: { colaboradorId: string }) {
  const hoje = paraDataISO(new Date());
  const { data } = usePrazosDias(colaboradorId, deslocarSemana(inicioSemanaAtual(), -1), hoje);
  const dias = (data ?? []).filter((d) => d.sem_registro && d.dia! < hoje).map((d) => d.dia!).sort();
  if (dias.length === 0) return null;

  return (
    <Alert variant="destructive">
      <Clock className="h-4 w-4" />
      <AlertTitle>
        {dias.length === 1 ? "1 dia útil sem horas registradas" : `${dias.length} dias úteis sem horas registradas`}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>{dias.map((d) => format(parseData(d), "EEE dd/MM", { locale: ptBR })).join(", ")}</span>
        <Button asChild size="sm" variant="outline">
          <Link to={`/apontamentos?semana=${segundaDaSemana(dias[0])}`}>Apontar agora</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
