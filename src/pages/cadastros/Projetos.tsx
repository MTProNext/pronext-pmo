import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { CampoBusca } from "@/components/comum/CampoBusca";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { COLUNAS_PROJETOS } from "@/components/projetos/colunasProjetos";
import { FormularioProjeto } from "@/components/projetos/FormularioProjeto";
import { useClientes } from "@/hooks/useClientes";
import { usePermissao } from "@/hooks/usePermissao";
import { useProjetos, type ProjetoDetalhado } from "@/hooks/useProjetos";
import { opcoesDe, STATUS_PROJETO_LABEL } from "@/lib/rotulos";

const Projetos = () => {
  const { data, isLoading, error } = useProjetos();
  const { data: clientes } = useClientes();
  const podeEditar = usePermissao("editarProjetos");

  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<ProjetoDetalhado | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return data?.filter(
      (p) =>
        (!termo || p.nome.toLowerCase().includes(termo)) &&
        (cliente === TODOS || p.cliente_id === cliente) &&
        (status === TODOS || p.status === status),
    );
  }, [data, busca, cliente, status]);

  const filtrosAtivos = !!busca || cliente !== TODOS || status !== TODOS;
  const abrir = (projeto: ProjetoDetalhado | null) => {
    setEditando(projeto);
    setFormAberto(true);
  };

  return (
    <Pagina
      titulo="Projetos"
      descricao="Projetos por cliente e líder responsável."
      acoes={
        podeEditar && (
          <Button onClick={() => abrir(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo projeto
          </Button>
        )
      }
    >
      <SecaoCard
        filtros={
          <BarraFiltros
            filtrosAtivos={filtrosAtivos}
            onLimpar={() => {
              setBusca("");
              setCliente(TODOS);
              setStatus(TODOS);
            }}
          >
            <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar projeto" />
            <FiltroSelect
              valor={cliente}
              onChange={setCliente}
              opcoes={(clientes ?? []).map((c) => ({ valor: c.id, rotulo: c.nome }))}
              rotuloTodos="Todos os clientes"
            />
            <FiltroSelect
              valor={status}
              onChange={setStatus}
              opcoes={opcoesDe(STATUS_PROJETO_LABEL)}
              rotuloTodos="Todos os status"
            />
          </BarraFiltros>
        }
      >
        {error ? (
          <p className="text-sm text-destructive">Erro ao carregar projetos: {error.message}</p>
        ) : (
          <TabelaDados
            colunas={COLUNAS_PROJETOS}
            dados={filtrados}
            carregando={isLoading}
            chaveLinha={(p) => p.id}
            onLinhaClick={podeEditar ? abrir : undefined}
            vazio={{
              titulo: "Nenhum projeto encontrado",
              descricao: filtrosAtivos ? "Ajuste ou limpe os filtros." : undefined,
            }}
          />
        )}
      </SecaoCard>
      <FormularioProjeto aberto={formAberto} onAbertoChange={setFormAberto} projeto={editando} />
    </Pagina>
  );
};

export default Projetos;
