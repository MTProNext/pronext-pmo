import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileQuestion, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { Selo } from "@/components/comum/Selo";
import { DadosDemanda } from "@/components/backlog/DadosDemanda";
import { FormularioDemanda } from "@/components/backlog/FormularioDemanda";
import { MenuStatusDemanda } from "@/components/backlog/MenuStatusDemanda";
import { useDemanda } from "@/hooks/useDemandas";
import { usePermissao } from "@/hooks/usePermissao";
import { formatCodigoDemanda } from "@/lib/format";
import { SELO_PRIORIDADE, SELO_STATUS_DEMANDA } from "@/lib/selos";

const Voltar = () => (
  <Button variant="ghost" size="sm" asChild className="-ml-2">
    <Link to="/backlog">
      <ArrowLeft className="mr-2 h-4 w-4" />
      Voltar ao backlog
    </Link>
  </Button>
);

const DemandaDetalhe = () => {
  const { id } = useParams();
  const { data: demanda, isLoading, error } = useDemanda(id);
  const podeEditar = usePermissao("editarDemandas");
  const [formAberto, setFormAberto] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !demanda) {
    return (
      <div className="space-y-4">
        <Voltar />
        <EstadoVazio
          icone={FileQuestion}
          titulo="Demanda não encontrada"
          descricao={error?.message ?? "Ela pode ter sido removida ou o endereço está incorreto."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Voltar />
      <Pagina
        titulo={`${formatCodigoDemanda(demanda.codigo)} · ${demanda.titulo}`}
        acoes={
          podeEditar && (
            <>
              <MenuStatusDemanda demanda={demanda} />
              <Button onClick={() => setFormAberto(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-wrap gap-2">
          <Selo mapa={SELO_PRIORIDADE} valor={demanda.prioridade} />
          <Selo mapa={SELO_STATUS_DEMANDA} valor={demanda.status} />
        </div>
        <SecaoCard titulo="Detalhes">
          <DadosDemanda demanda={demanda} />
        </SecaoCard>
        <SecaoCard titulo="Descrição">
          <p className="whitespace-pre-wrap text-sm">
            {demanda.descricao || <span className="text-muted-foreground">Sem descrição.</span>}
          </p>
        </SecaoCard>
        <SecaoCard
          titulo="Planejamento e replanejamentos"
          descricao="Alocações semanais e histórico de replanejamentos aparecem aqui a partir da etapa 4."
        >
          <p className="text-sm text-muted-foreground">Nenhuma alocação registrada.</p>
        </SecaoCard>
      </Pagina>
      {podeEditar && <FormularioDemanda aberto={formAberto} onAbertoChange={setFormAberto} demanda={demanda} />}
    </div>
  );
};

export default DemandaDetalhe;
