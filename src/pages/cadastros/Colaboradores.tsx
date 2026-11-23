import { useMemo, useState } from "react";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { CampoBusca } from "@/components/comum/CampoBusca";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { COLUNAS_COLABORADORES } from "@/components/colaboradores/colunasColaboradores";
import { useColaboradores } from "@/hooks/useColaboradores";
import { PAPEL_LABEL } from "@/lib/papeis";

const OPCOES_PAPEL = Object.entries(PAPEL_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));
const OPCOES_SITUACAO = [
  { valor: "ativo", rotulo: "Ativos" },
  { valor: "inativo", rotulo: "Inativos" },
];

const Colaboradores = () => {
  const { data, isLoading, error } = useColaboradores();
  const [busca, setBusca] = useState("");
  const [papel, setPapel] = useState(TODOS);
  const [situacao, setSituacao] = useState(TODOS);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return data?.filter(
      (c) =>
        (!termo || c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo)) &&
        (papel === TODOS || c.papel === papel) &&
        (situacao === TODOS || (situacao === "ativo") === c.ativo),
    );
  }, [data, busca, papel, situacao]);

  const filtrosAtivos = !!busca || papel !== TODOS || situacao !== TODOS;
  const limpar = () => {
    setBusca("");
    setPapel(TODOS);
    setSituacao(TODOS);
  };

  return (
    <Pagina
      titulo="Colaboradores"
      descricao="Pessoas da operação, perfis de acesso e horas disponíveis para desenvolvimento."
    >
      <SecaoCard
        filtros={
          <BarraFiltros onLimpar={limpar} filtrosAtivos={filtrosAtivos}>
            <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por nome ou e-mail" />
            <FiltroSelect
              valor={papel}
              onChange={setPapel}
              opcoes={OPCOES_PAPEL}
              rotuloTodos="Todos os papéis"
            />
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
          <p className="text-sm text-destructive">Erro ao carregar colaboradores: {error.message}</p>
        ) : (
          <TabelaDados
            colunas={COLUNAS_COLABORADORES}
            dados={filtrados}
            carregando={isLoading}
            chaveLinha={(c) => c.id}
            vazio={{
              titulo: "Nenhum colaborador encontrado",
              descricao: filtrosAtivos ? "Ajuste ou limpe os filtros." : undefined,
            }}
          />
        )}
      </SecaoCard>
    </Pagina>
  );
};

export default Colaboradores;
