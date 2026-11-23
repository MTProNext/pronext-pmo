import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { CampoBusca } from "@/components/comum/CampoBusca";
import { ConfirmacaoDialog } from "@/components/comum/ConfirmacaoDialog";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { colunasIndisponibilidades } from "@/components/indisponibilidades/colunasIndisponibilidades";
import { FormularioIndisponibilidade } from "@/components/indisponibilidades/FormularioIndisponibilidade";
import { useColaboradores } from "@/hooks/useColaboradores";
import {
  useExcluirIndisponibilidade,
  useIndisponibilidades,
  type IndisponibilidadeDetalhada,
} from "@/hooks/useIndisponibilidades";
import { usePermissao } from "@/hooks/usePermissao";
import { paraDataISO } from "@/lib/format";
import { opcoesDe, TIPO_INDISPONIBILIDADE_LABEL } from "@/lib/rotulos";

const GLOBAIS = "globais";
const OPCOES_PERIODO = [
  { valor: "proximas", rotulo: "A partir de hoje" },
  { valor: "passadas", rotulo: "Já encerradas" },
];

const Indisponibilidades = () => {
  const { data, isLoading, error } = useIndisponibilidades();
  const { data: colaboradores } = useColaboradores();
  const podeEditar = usePermissao("editarIndisponibilidades");
  const excluir = useExcluirIndisponibilidade();

  const [busca, setBusca] = useState("");
  const [colaborador, setColaborador] = useState(TODOS);
  const [tipo, setTipo] = useState(TODOS);
  const [periodo, setPeriodo] = useState("proximas");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<IndisponibilidadeDetalhada | null>(null);
  const [excluindo, setExcluindo] = useState<IndisponibilidadeDetalhada | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const hoje = paraDataISO(new Date());
    return data?.filter(
      (i) =>
        (!termo || i.descricao?.toLowerCase().includes(termo) || i.localidade?.toLowerCase().includes(termo)) &&
        (colaborador === TODOS ||
          (colaborador === GLOBAIS ? i.colaborador_id === null : i.colaborador_id === colaborador)) &&
        (tipo === TODOS || i.tipo === tipo) &&
        (periodo === TODOS || (periodo === "proximas" ? i.data_fim >= hoje : i.data_fim < hoje)),
    );
  }, [data, busca, colaborador, tipo, periodo]);

  const colunas = useMemo(() => colunasIndisponibilidades(podeEditar ? setExcluindo : undefined), [podeEditar]);

  const filtrosAtivos = !!busca || colaborador !== TODOS || tipo !== TODOS || periodo !== "proximas";
  const abrir = (ind: IndisponibilidadeDetalhada | null) => {
    setEditando(ind);
    setFormAberto(true);
  };

  return (
    <Pagina
      titulo="Indisponibilidades"
      descricao="Férias, feriados, ausências e treinamentos que reduzem a capacidade da semana."
      acoes={
        podeEditar && (
          <Button onClick={() => abrir(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova indisponibilidade
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
              setColaborador(TODOS);
              setTipo(TODOS);
              setPeriodo("proximas");
            }}
          >
            <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar descrição ou localidade" />
            <FiltroSelect
              valor={colaborador}
              onChange={setColaborador}
              rotuloTodos="Todos os colaboradores"
              opcoes={[
                { valor: GLOBAIS, rotulo: "Somente globais" },
                ...(colaboradores ?? []).map((c) => ({ valor: c.id, rotulo: c.nome })),
              ]}
            />
            <FiltroSelect
              valor={tipo}
              onChange={setTipo}
              opcoes={opcoesDe(TIPO_INDISPONIBILIDADE_LABEL)}
              rotuloTodos="Todos os tipos"
            />
            <FiltroSelect valor={periodo} onChange={setPeriodo} opcoes={OPCOES_PERIODO} rotuloTodos="Todo o período" />
          </BarraFiltros>
        }
      >
        {error ? (
          <p className="text-sm text-destructive">Erro ao carregar indisponibilidades: {error.message}</p>
        ) : (
          <TabelaDados
            colunas={colunas}
            dados={filtrados}
            carregando={isLoading}
            chaveLinha={(i) => i.id}
            onLinhaClick={podeEditar ? abrir : undefined}
            vazio={{
              titulo: "Nenhuma indisponibilidade encontrada",
              descricao: filtrosAtivos ? "Ajuste ou limpe os filtros." : undefined,
            }}
          />
        )}
      </SecaoCard>
      <FormularioIndisponibilidade aberto={formAberto} onAbertoChange={setFormAberto} indisponibilidade={editando} />
      <ConfirmacaoDialog
        aberto={!!excluindo}
        onAbertoChange={(aberto) => !aberto && setExcluindo(null)}
        titulo="Excluir indisponibilidade?"
        descricao="A capacidade das semanas afetadas será recalculada. Esta ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        destrutivo
        onConfirmar={() => excluindo && excluir.mutate(excluindo.id)}
      />
    </Pagina>
  );
};

export default Indisponibilidades;
