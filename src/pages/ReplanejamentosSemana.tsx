import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { colunasReplanejamentos } from "@/components/planejamento/colunasReplanejamentos";
import { DialogCompletarReplanejamento } from "@/components/planejamento/DialogCompletarReplanejamento";
import { usePermissao } from "@/hooks/usePermissao";
import { useReplanejamentos, useSemana, type Replanejamento } from "@/hooks/usePlanejamento";
import { opcoesDe, TIPO_REPLANEJAMENTO_LABEL } from "@/lib/rotulos";
import { ehSegunda, formatSemana } from "@/lib/semana";

const PENDENTES = "pendentes";

/** /planejamento/:inicio/replanejamentos: log da semana. */
const ReplanejamentosSemana = () => {
  const { inicio = "" } = useParams();
  const valido = ehSegunda(inicio);
  const { data: semana, isLoading: carregandoSemana } = useSemana(inicio);
  const { data, isLoading, error } = useReplanejamentos(semana?.id);
  const podeCompletar = usePermissao("planejarSemana");
  const [tipo, setTipo] = useState(TODOS);
  const [completando, setCompletando] = useState<Replanejamento | null>(null);

  const filtrados = useMemo(
    () =>
      data?.filter((r) => tipo === TODOS || (tipo === PENDENTES ? r.pendente : r.tipo === tipo)),
    [data, tipo],
  );
  const colunas = useMemo(
    () => colunasReplanejamentos(podeCompletar ? setCompletando : undefined),
    [podeCompletar],
  );

  if (!valido) return <Navigate to="/planejamento" replace />;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/planejamento/${inicio}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao planejamento
        </Link>
      </Button>
      <Pagina
        titulo="Replanejamentos"
        descricao={`Alterações após a publicação da semana de ${formatSemana(inicio)}. O log não pode ser editado; só os pendentes recebem motivo e impacto.`}
      >
        <SecaoCard
          filtros={
            <BarraFiltros filtrosAtivos={tipo !== TODOS} onLimpar={() => setTipo(TODOS)}>
              <FiltroSelect
                valor={tipo}
                onChange={setTipo}
                rotuloTodos="Todos os registros"
                opcoes={[{ valor: PENDENTES, rotulo: "Somente pendentes" }, ...opcoesDe(TIPO_REPLANEJAMENTO_LABEL)]}
              />
            </BarraFiltros>
          }
        >
          {error ? (
            <p className="text-sm text-destructive">Erro ao carregar o log: {error.message}</p>
          ) : (
            <TabelaDados
              colunas={colunas}
              dados={!carregandoSemana && !semana ? [] : filtrados}
              carregando={carregandoSemana || (!!semana && isLoading)}
              chaveLinha={(r) => r.id}
              vazio={{
                titulo: semana ? "Nenhum replanejamento registrado" : "Semana não encontrada ou ainda não publicada",
                descricao: tipo !== TODOS ? "Ajuste ou limpe o filtro." : undefined,
              }}
            />
          )}
        </SecaoCard>
      </Pagina>
      <DialogCompletarReplanejamento replanejamento={completando} onFechar={() => setCompletando(null)} />
    </div>
  );
};

export default ReplanejamentosSemana;
