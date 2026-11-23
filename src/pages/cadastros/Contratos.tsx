import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { CampoBusca } from "@/components/comum/CampoBusca";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { colunasContratos } from "@/components/contratos/colunasContratos";
import { FormularioContrato } from "@/components/contratos/FormularioContrato";
import { useClientes } from "@/hooks/useClientes";
import { useContratos, useValoresContratos, type ContratoComCliente } from "@/hooks/useContratos";
import { usePermissao } from "@/hooks/usePermissao";
import { opcoesDe, STATUS_CONTRATO_LABEL, TIPO_CONTRATO_LABEL } from "@/lib/rotulos";

const Contratos = () => {
  const { data, isLoading, error } = useContratos();
  const { data: clientes } = useClientes();
  const podeEditar = usePermissao("editarContratos");
  const podeVerValor = usePermissao("verValoresContratos");
  const { data: valores } = useValoresContratos(podeVerValor);

  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState(TODOS);
  const [tipo, setTipo] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<ContratoComCliente | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return data?.filter(
      (c) =>
        (!termo || c.nome.toLowerCase().includes(termo)) &&
        (cliente === TODOS || c.cliente_id === cliente) &&
        (tipo === TODOS || c.tipo === tipo) &&
        (status === TODOS || c.status === status),
    );
  }, [data, busca, cliente, tipo, status]);

  const colunas = useMemo(
    () => colunasContratos(podeVerValor ? (valores ?? new Map()) : undefined),
    [podeVerValor, valores],
  );

  const filtrosAtivos = !!busca || cliente !== TODOS || tipo !== TODOS || status !== TODOS;
  const limpar = () => {
    setBusca("");
    setCliente(TODOS);
    setTipo(TODOS);
    setStatus(TODOS);
  };
  const abrir = (contrato: ContratoComCliente | null) => {
    setEditando(contrato);
    setFormAberto(true);
  };

  return (
    <Pagina
      titulo="Contratos"
      descricao="Contratos por cliente: tipo, horas contratadas e vigência."
      acoes={
        podeEditar && (
          <Button onClick={() => abrir(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo contrato
          </Button>
        )
      }
    >
      <SecaoCard
        filtros={
          <BarraFiltros filtrosAtivos={filtrosAtivos} onLimpar={limpar}>
            <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar contrato" />
            <FiltroSelect
              valor={cliente}
              onChange={setCliente}
              opcoes={(clientes ?? []).map((c) => ({ valor: c.id, rotulo: c.nome }))}
              rotuloTodos="Todos os clientes"
            />
            <FiltroSelect
              valor={tipo}
              onChange={setTipo}
              opcoes={opcoesDe(TIPO_CONTRATO_LABEL)}
              rotuloTodos="Todos os tipos"
            />
            <FiltroSelect
              valor={status}
              onChange={setStatus}
              opcoes={opcoesDe(STATUS_CONTRATO_LABEL)}
              rotuloTodos="Todos os status"
            />
          </BarraFiltros>
        }
      >
        {error ? (
          <p className="text-sm text-destructive">Erro ao carregar contratos: {error.message}</p>
        ) : (
          <TabelaDados
            colunas={colunas}
            dados={filtrados}
            carregando={isLoading}
            chaveLinha={(c) => c.id}
            onLinhaClick={podeEditar ? abrir : undefined}
            vazio={{
              titulo: "Nenhum contrato encontrado",
              descricao: filtrosAtivos ? "Ajuste ou limpe os filtros." : undefined,
            }}
          />
        )}
      </SecaoCard>
      <FormularioContrato
        aberto={formAberto}
        onAbertoChange={setFormAberto}
        contrato={editando}
        valorHora={editando && podeVerValor ? (valores?.get(editando.id) ?? null) : undefined}
        podeVerValor={podeVerValor}
      />
    </Pagina>
  );
};

export default Contratos;
