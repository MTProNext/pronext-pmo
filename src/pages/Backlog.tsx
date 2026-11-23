import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { BarraFiltrosBacklog } from "@/components/backlog/BarraFiltrosBacklog";
import { COLUNAS_DEMANDAS } from "@/components/backlog/colunasDemandas";
import {
  aplicarFiltros,
  FILTROS_PADRAO,
  filtrosAlterados,
  type FiltrosBacklog,
} from "@/components/backlog/filtrosBacklog";
import { FormularioDemanda } from "@/components/backlog/FormularioDemanda";
import { useDemandas } from "@/hooks/useDemandas";
import { usePermissao } from "@/hooks/usePermissao";

const Backlog = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDemandas();
  const podeEditar = usePermissao("editarDemandas");
  const [filtros, setFiltros] = useState<FiltrosBacklog>(FILTROS_PADRAO);
  const [formAberto, setFormAberto] = useState(false);

  const filtradas = useMemo(() => (data ? aplicarFiltros(data, filtros) : undefined), [data, filtros]);

  return (
    <Pagina
      titulo="Backlog de demandas"
      descricao="Demandas registradas, por prioridade. Clique em uma linha para ver os detalhes."
      acoes={
        podeEditar && (
          <Button onClick={() => setFormAberto(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova demanda
          </Button>
        )
      }
    >
      <SecaoCard filtros={<BarraFiltrosBacklog filtros={filtros} onChange={setFiltros} />}>
        {error ? (
          <p className="text-sm text-destructive">Erro ao carregar o backlog: {error.message}</p>
        ) : (
          <>
            <TabelaDados
              colunas={COLUNAS_DEMANDAS}
              dados={filtradas}
              carregando={isLoading}
              chaveLinha={(d) => d.id}
              onLinhaClick={(d) => navigate(`/backlog/${d.id}`)}
              vazio={{
                titulo: "Nenhuma demanda encontrada",
                descricao: filtrosAlterados(filtros) ? "Ajuste ou limpe os filtros." : undefined,
              }}
            />
            {filtradas && filtradas.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {filtradas.length} de {data?.length} demanda(s)
              </p>
            )}
          </>
        )}
      </SecaoCard>
      <FormularioDemanda aberto={formAberto} onAbertoChange={setFormAberto} demanda={null} />
    </Pagina>
  );
};

export default Backlog;
