import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { Selo } from "@/components/comum/Selo";
import { AcoesSemana } from "@/components/planejamento/AcoesSemana";
import { ConteudoSemana } from "@/components/planejamento/ConteudoSemana";
import { NavegacaoSemana } from "@/components/planejamento/NavegacaoSemana";
import { useCriarSemana } from "@/hooks/useAcoesPlanejamento";
import { usePermissao } from "@/hooks/usePermissao";
import { useSemana } from "@/hooks/usePlanejamento";
import { ehSegunda, formatSemana, inicioSemanaAtual } from "@/lib/semana";
import { SELO_STATUS_SEMANA } from "@/lib/selos";

/** /planejamento (semana atual) e /planejamento/:inicio (segunda-feira da semana). */
const Planejamento = () => {
  const { inicio: parametro } = useParams();
  const navigate = useNavigate();
  const inicio = parametro ?? inicioSemanaAtual();
  const valido = ehSegunda(inicio);
  const { data: semana, isLoading, error } = useSemana(inicio);
  const podePlanejar = usePermissao("planejarSemana");
  const criar = useCriarSemana();

  if (!valido) return <Navigate to="/planejamento" replace />;

  return (
    <Pagina
      titulo="Planejamento semanal"
      descricao={`Semana de ${formatSemana(inicio)}`}
      acoes={
        <>
          <NavegacaoSemana inicio={inicio} onChange={(i) => navigate(`/planejamento/${i}`)} />
          {semana && podePlanejar && <AcoesSemana semana={semana} />}
        </>
      }
    >
      {semana && (
        <div className="-mt-2">
          <Selo mapa={SELO_STATUS_SEMANA} valor={semana.status} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">Erro ao carregar a semana: {error.message}</p>}
      {isLoading && <Skeleton className="h-64 w-full" />}
      {!isLoading && !error && !semana && (
        <SecaoCard>
          <EstadoVazio
            icone={CalendarX}
            titulo={podePlanejar ? "Semana ainda não criada" : "Planejamento ainda não publicado"}
            descricao={
              podePlanejar
                ? "Crie a semana em rascunho para montar a grade (preparação na quinta, publicação na sexta)."
                : "A grade desta semana aparece aqui depois que o líder técnico publicar."
            }
            acao={
              podePlanejar && (
                <Button onClick={() => criar.mutate(inicio)} disabled={criar.isPending}>
                  Criar semana em rascunho
                </Button>
              )
            }
          />
        </SecaoCard>
      )}
      {semana && <ConteudoSemana semana={semana} />}
    </Pagina>
  );
};

export default Planejamento;
