import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { CampoBusca } from "@/components/comum/CampoBusca";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { COLUNAS_CLIENTES } from "@/components/clientes/colunasClientes";
import { FormularioCliente } from "@/components/clientes/FormularioCliente";
import { useClientes, type Cliente } from "@/hooks/useClientes";
import { usePermissao } from "@/hooks/usePermissao";

const OPCOES_SITUACAO = [
  { valor: "ativo", rotulo: "Ativos" },
  { valor: "inativo", rotulo: "Inativos" },
];

const Clientes = () => {
  const { data, isLoading, error } = useClientes();
  const podeEditar = usePermissao("editarClientes");
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState(TODOS);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return data?.filter(
      (c) =>
        (!termo ||
          c.nome.toLowerCase().includes(termo) ||
          c.documento?.toLowerCase().includes(termo)) &&
        (situacao === TODOS || (situacao === "ativo") === c.ativo),
    );
  }, [data, busca, situacao]);

  const filtrosAtivos = !!busca || situacao !== TODOS;
  const abrir = (cliente: Cliente | null) => {
    setEditando(cliente);
    setFormAberto(true);
  };

  return (
    <Pagina
      titulo="Clientes"
      descricao="Clientes atendidos pela ProNext."
      acoes={
        podeEditar && (
          <Button onClick={() => abrir(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
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
              setSituacao(TODOS);
            }}
          >
            <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por nome ou documento" />
            <FiltroSelect
              valor={situacao}
              onChange={setSituacao}
              opcoes={OPCOES_SITUACAO}
              rotuloTodos="Todas as situações"
            />
          </BarraFiltros>
        }
      >
        {error ? (
          <p className="text-sm text-destructive">Erro ao carregar clientes: {error.message}</p>
        ) : (
          <TabelaDados
            colunas={COLUNAS_CLIENTES}
            dados={filtrados}
            carregando={isLoading}
            chaveLinha={(c) => c.id}
            onLinhaClick={podeEditar ? abrir : undefined}
            vazio={{
              titulo: "Nenhum cliente encontrado",
              descricao: filtrosAtivos ? "Ajuste ou limpe os filtros." : undefined,
            }}
          />
        )}
      </SecaoCard>
      <FormularioCliente aberto={formAberto} onAbertoChange={setFormAberto} cliente={editando} />
    </Pagina>
  );
};

export default Clientes;
