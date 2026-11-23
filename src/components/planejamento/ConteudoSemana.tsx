import { useMemo, useState } from "react";
import { CalendarPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { usePermissao } from "@/hooks/usePermissao";
import {
  useCapacidadeSemana,
  useItensSemana,
  useReplanejamentos,
  useResumoSemana,
  type Semana,
} from "@/hooks/usePlanejamento";
import { AvisoPendentes } from "./AvisoPendentes";
import { DialogAlocacao } from "./DialogAlocacao";
import { FaixasCapacidade } from "./FaixasCapacidade";
import { GradePlanejamento, type CelulaSelecionada } from "./GradePlanejamento";
import { IndicadoresSemana } from "./IndicadoresSemana";
import { montarGrade } from "./montarGrade";

/** Indicadores, faixas, pendências e grade de uma semana existente. */
export function ConteudoSemana({ semana }: { semana: Semana }) {
  const podePlanejar = usePermissao("planejarSemana");
  const { data: resumo } = useResumoSemana(semana.id);
  const { data: pessoas } = useCapacidadeSemana(semana.id);
  const { data: itens } = useItensSemana(semana.id);
  const { data: replanejamentos } = useReplanejamentos(semana.id);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [celula, setCelula] = useState<CelulaSelecionada | null>(null);

  const grupos = useMemo(() => montarGrade(itens ?? []), [itens]);
  const editavel = podePlanejar && semana.status !== "revisada";
  const abrir = (c: CelulaSelecionada | null) => {
    setCelula(c);
    setDialogAberto(true);
  };

  if (!resumo || !pessoas || !itens) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AvisoPendentes replanejamentos={replanejamentos ?? []} podeCompletar={podePlanejar} />
      <IndicadoresSemana resumo={resumo} pessoas={pessoas} inicio={semana.inicio} />
      <SecaoCard titulo="Faixas de capacidade" descricao="Planejado, reserva e interno contra os limites da configuração.">
        <FaixasCapacidade resumo={resumo} />
      </SecaoCard>
      <SecaoCard
        titulo="Grade da semana"
        descricao={
          editavel
            ? semana.status === "rascunho"
              ? "Clique numa célula para alocar horas. Em rascunho, as alterações valem direto."
              : "Semana publicada: clique numa célula para replanejar (motivo e impacto obrigatórios)."
            : "Horas planejadas por demanda e colaborador."
        }
        acoes={
          editavel && (
            <Button variant="outline" onClick={() => abrir(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar alocação
            </Button>
          )
        }
      >
        {grupos.length === 0 ? (
          <EstadoVazio
            icone={CalendarPlus}
            titulo="Nenhuma alocação nesta semana"
            descricao={editavel ? "Use “Adicionar alocação” para montar a grade a partir do backlog." : undefined}
          />
        ) : (
          <GradePlanejamento grupos={grupos} pessoas={pessoas} onCelula={editavel ? abrir : undefined} />
        )}
      </SecaoCard>
      {editavel && (
        <DialogAlocacao
          aberto={dialogAberto}
          onAbertoChange={setDialogAberto}
          semana={semana}
          celula={celula}
          pessoas={pessoas}
          itens={itens}
        />
      )}
    </div>
  );
}
