import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { CampoBusca } from "@/components/comum/CampoBusca";
import { FiltroSelect } from "@/components/comum/FiltroSelect";
import { useClientes } from "@/hooks/useClientes";
import { useColaboradores } from "@/hooks/useColaboradores";
import { opcoesDe, PRIORIDADE_LABEL, STATUS_DEMANDA_LABEL, TIPO_DEMANDA_LABEL } from "@/lib/rotulos";
import { EM_ABERTO, FILTROS_PADRAO, filtrosAlterados, INTERNO, type FiltrosBacklog } from "./filtrosBacklog";

interface Props {
  filtros: FiltrosBacklog;
  onChange: (filtros: FiltrosBacklog) => void;
}

export function BarraFiltrosBacklog({ filtros, onChange }: Props) {
  const { data: clientes } = useClientes();
  const { data: colaboradores } = useColaboradores();
  const set = (campo: keyof FiltrosBacklog) => (valor: string) => onChange({ ...filtros, [campo]: valor });

  const lideres = (colaboradores ?? []).filter((c) => c.papel === "lider_tecnico");

  return (
    <BarraFiltros filtrosAtivos={filtrosAlterados(filtros)} onLimpar={() => onChange(FILTROS_PADRAO)}>
      <CampoBusca valor={filtros.busca} onChange={set("busca")} placeholder="Buscar título ou código" />
      <FiltroSelect
        valor={filtros.status}
        onChange={set("status")}
        rotuloTodos="Todos os status"
        opcoes={[{ valor: EM_ABERTO, rotulo: "Em aberto" }, ...opcoesDe(STATUS_DEMANDA_LABEL)]}
      />
      <FiltroSelect
        valor={filtros.prioridade}
        onChange={set("prioridade")}
        rotuloTodos="Todas as prioridades"
        opcoes={opcoesDe(PRIORIDADE_LABEL)}
      />
      <FiltroSelect
        valor={filtros.cliente}
        onChange={set("cliente")}
        rotuloTodos="Todos os clientes"
        opcoes={[
          { valor: INTERNO, rotulo: "Interno" },
          ...(clientes ?? []).map((c) => ({ valor: c.id, rotulo: c.nome })),
        ]}
      />
      <FiltroSelect
        valor={filtros.lider}
        onChange={set("lider")}
        rotuloTodos="Todos os líderes"
        opcoes={lideres.map((c) => ({ valor: c.id, rotulo: c.nome }))}
      />
      <FiltroSelect
        valor={filtros.tipo}
        onChange={set("tipo")}
        rotuloTodos="Todos os tipos"
        opcoes={opcoesDe(TIPO_DEMANDA_LABEL)}
      />
    </BarraFiltros>
  );
}
