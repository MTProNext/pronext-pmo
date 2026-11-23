import { useMemo, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { colunaSelecao } from "@/components/comum/colunaSelecao";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { COLUNAS_CLASSIFICACAO } from "@/components/aprovacoes/colunasClassificacao";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { useClassificarApontamentos, useHorasParaClassificar } from "@/hooks/useAprovacoes";
import type { Enums } from "@/integrations/supabase/types";
import { formatHours } from "@/lib/format";
import { CLASSIFICACAO_LABEL, opcoesDe } from "@/lib/rotulos";

type Classificacao = Enums<"classificacao_comercial">;
const ATUAL = "atual";

/** Classificação proposta para validar: a atual (aplicada pelo líder) ou a sugestão do contrato. */
const proposta = (a: ApontamentoView): Classificacao =>
  a.classificacao_comercial !== "a_validar" ? a.classificacao_comercial : (a.classificacao_sugerida ?? "a_validar");

/** /horas/classificacao — validação comercial das horas aprovadas (Administrativo e Proprietário). */
const ClassificacaoHoras = () => {
  const { data, isLoading } = useHorasParaClassificar();
  const classificar = useClassificarApontamentos();
  const [cliente, setCliente] = useState(TODOS);
  const [contrato, setContrato] = useState(TODOS);
  const [selecionados, setSelecionados] = useState(new Set<string>());
  const [escolha, setEscolha] = useState(ATUAL);

  const filtrados = useMemo(
    () =>
      (data ?? []).filter(
        (a) => (cliente === TODOS || a.cliente_id === cliente) && (contrato === TODOS || a.contrato_id === contrato),
      ),
    [data, cliente, contrato],
  );
  const clientes = [...new Map((data ?? []).filter((a) => a.cliente_id).map((a) => [a.cliente_id!, a.cliente_nome!]))];
  const contratos = [...new Map((data ?? []).filter((a) => a.contrato_id).map((a) => [a.contrato_id!, a.contrato_nome!]))];
  const escolhidos = filtrados.filter((a) => selecionados.has(a.id));
  const semProposta = escolha === ATUAL && escolhidos.some((a) => proposta(a) === "a_validar");

  const validar = () => {
    const grupos = new Map<Classificacao, string[]>();
    for (const a of escolhidos) {
      const c = escolha === ATUAL ? proposta(a) : (escolha as Classificacao);
      grupos.set(c, [...(grupos.get(c) ?? []), a.id]);
    }
    classificar.mutate(
      [...grupos.entries()].map(([classificacao, ids]) => ({ ids, classificacao, validar: true })),
      { onSuccess: () => setSelecionados(new Set()) },
    );
  };

  return (
    <Pagina
      titulo="Classificação de horas"
      descricao="Validação comercial das horas aprovadas, conforme o contrato. Só horas validadas entram no saldo de contratos e no faturamento."
    >
      <SecaoCard
        filtros={
          <BarraFiltros filtrosAtivos={cliente !== TODOS || contrato !== TODOS} onLimpar={() => { setCliente(TODOS); setContrato(TODOS); }}>
            <FiltroSelect valor={cliente} onChange={setCliente} rotuloTodos="Todos os clientes"
              opcoes={clientes.map(([valor, rotulo]) => ({ valor, rotulo }))} />
            <FiltroSelect valor={contrato} onChange={setContrato} rotuloTodos="Todos os contratos"
              opcoes={contratos.map(([valor, rotulo]) => ({ valor, rotulo }))} />
          </BarraFiltros>
        }
      >
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm">
            {escolhidos.length
              ? `${escolhidos.length} selecionado(s) · ${formatHours(escolhidos.reduce((s, a) => s + Number(a.horas), 0))}`
              : "Selecione as horas para validar."}
            {semProposta && <span className="block text-destructive">Há horas sem classificação proposta: escolha uma.</span>}
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={escolha} onValueChange={setEscolha}>
              <SelectTrigger className="w-full sm:w-64" aria-label="Classificação a validar">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ATUAL}>Manter a atual / sugestão</SelectItem>
                {opcoesDe(CLASSIFICACAO_LABEL)
                  .filter((o) => o.valor !== "a_validar")
                  .map((o) => (
                    <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={validar} disabled={!escolhidos.length || semProposta || classificar.isPending}>
              <BadgeCheck className="mr-2 h-4 w-4" />
              Validar selecionadas
            </Button>
          </div>
        </div>
        <TabelaDados
          colunas={[
            colunaSelecao({ dados: filtrados, chaveLinha: (a: ApontamentoView) => a.id, selecionados, onChange: setSelecionados }),
            ...COLUNAS_CLASSIFICACAO,
          ]}
          dados={filtrados}
          carregando={isLoading}
          chaveLinha={(a) => a.id}
          vazio={{ titulo: "Nenhuma hora aguardando validação comercial" }}
        />
      </SecaoCard>
    </Pagina>
  );
};

export default ClassificacaoHoras;
