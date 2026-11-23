import { useMemo, useState } from "react";
import { CalendarClock, Gauge, Scale, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { Indicador } from "@/components/comum/Indicador";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { Selo } from "@/components/comum/Selo";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { AvisoDiasSemHoras } from "@/components/minhaSemana/AvisoDiasSemHoras";
import { colunasMinhaSemana } from "@/components/minhaSemana/colunasMinhaSemana";
import { useApontamentosSemana } from "@/hooks/useApontamentos";
import { NavegacaoSemana } from "@/components/planejamento/NavegacaoSemana";
import { useCapacidadeSemana, useItensSemana, useSemana } from "@/hooks/usePlanejamento";
import { useSessao } from "@/hooks/useSessao";
import { formatHours, formatNumero, formatPct } from "@/lib/format";
import { formatSemana, inicioSemanaAtual } from "@/lib/semana";
import { SELO_STATUS_SEMANA } from "@/lib/selos";

/** Programação publicada da semana para o usuário logado. */
const MinhaSemana = () => {
  const { colaborador } = useSessao();
  const [inicio, setInicio] = useState(inicioSemanaAtual());
  const { data: semanaBruta, isLoading } = useSemana(inicio);
  // Rascunho não é programação: só semanas publicadas ou posteriores aparecem aqui.
  const semana = semanaBruta && semanaBruta.status !== "rascunho" ? semanaBruta : null;
  const { data: capacidades } = useCapacidadeSemana(semana?.id);
  const { data: itens, isLoading: carregandoItens } = useItensSemana(semana?.id);

  const { data: apontamentos } = useApontamentosSemana(colaborador?.id, inicio);

  const minha = capacidades?.find((c) => c.colaborador_id === colaborador?.id);
  const meusItens = useMemo(() => itens?.filter((i) => i.colaborador_id === colaborador?.id), [itens, colaborador]);
  const apontadoPorDemanda = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const a of apontamentos ?? []) mapa.set(a.demanda_id, (mapa.get(a.demanda_id) ?? 0) + Number(a.horas));
    return mapa;
  }, [apontamentos]);
  const colunas = useMemo(
    () => colunasMinhaSemana(semana?.status !== "revisada", apontadoPorDemanda),
    [semana?.status, apontadoPorDemanda],
  );

  const capacidade = Number(minha?.capacidade_efetiva ?? 0);
  const planejado = Number(minha?.horas_planejadas ?? 0);

  return (
    <Pagina
      titulo="Minha semana"
      descricao={`Sua programação de ${formatSemana(inicio)}`}
      acoes={<NavegacaoSemana inicio={inicio} onChange={setInicio} />}
    >
      {colaborador && <AvisoDiasSemHoras colaboradorId={colaborador.id} />}
      {isLoading && <Skeleton className="h-64 w-full" />}
      {!isLoading && !semana && (
        <SecaoCard>
          <EstadoVazio
            icone={CalendarClock}
            titulo="Programação ainda não publicada"
            descricao="A grade desta semana aparece aqui depois que o líder técnico publicar o planejamento."
          />
        </SecaoCard>
      )}
      {semana && (
        <>
          <div className="-mt-2">
            <Selo mapa={SELO_STATUS_SEMANA} valor={semana.status} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador
              rotulo="Capacidade efetiva"
              icone={Timer}
              valor={formatHours(capacidade)}
              descricao={
                Number(minha?.horas_indisponiveis ?? 0) > 0
                  ? `${formatNumero(Number(minha?.horas_indisponiveis))}h de indisponibilidade descontadas`
                  : "Sem indisponibilidades na semana"
              }
            />
            <Indicador rotulo="Horas planejadas" icone={CalendarClock} valor={formatHours(planejado)} />
            <Indicador
              rotulo="Saldo"
              icone={Scale}
              alerta={capacidade - planejado < 0}
              valor={formatHours(Number((capacidade - planejado).toFixed(2)))}
              descricao={capacidade - planejado < 0 ? "Planejado acima da sua capacidade" : "Disponível na semana"}
            />
            <Indicador
              rotulo="Ocupação"
              icone={Gauge}
              alerta={!!minha?.excede_capacidade}
              valor={formatPct(minha?.ocupacao_pct ?? null)}
              descricao="Horas planejadas ÷ capacidade"
            />
          </div>
          <SecaoCard
            titulo="Demandas da semana"
            descricao={
              semana.status === "revisada"
                ? "Semana revisada: somente leitura."
                : "Atualize o status das demandas conforme o andamento."
            }
          >
            <TabelaDados
              colunas={colunas}
              dados={meusItens}
              carregando={carregandoItens}
              chaveLinha={(i) => i.id}
              vazio={{ titulo: "Nenhuma demanda planejada para você nesta semana" }}
            />
          </SecaoCard>
        </>
      )}
    </Pagina>
  );
};

export default MinhaSemana;
