import { useMemo, useState } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarraFiltros } from "@/components/comum/BarraFiltros";
import { colunaSelecao } from "@/components/comum/colunaSelecao";
import { DialogMotivo } from "@/components/comum/DialogMotivo";
import { FiltroSelect, TODOS } from "@/components/comum/FiltroSelect";
import { TabelaDados } from "@/components/comum/TabelaDados";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { useAprovarApontamentos, useDevolverApontamento, usePendentesAprovacao } from "@/hooks/useAprovacoes";
import type { Enums } from "@/integrations/supabase/types";
import { formatHours } from "@/lib/format";
import { CLASSIFICACAO_LABEL, opcoesDe } from "@/lib/rotulos";
import { formatSemana } from "@/lib/semana";
import { colunasAprovacao } from "./colunasAprovacao";

const SUGESTAO = "sugestao";
const SIM = "sim";

/** Fila de horas enviadas aguardando o usuário: filtros, seleção em lote, aprovar e devolver. */
export function ListaPendentes() {
  const { data, isLoading } = usePendentesAprovacao();
  const aprovar = useAprovarApontamentos();
  const devolver = useDevolverApontamento();

  const [pessoa, setPessoa] = useState(TODOS);
  const [semana, setSemana] = useState(TODOS);
  const [naoPlanejadas, setNaoPlanejadas] = useState(TODOS);
  const [selecionados, setSelecionados] = useState(new Set<string>());
  const [classificacao, setClassificacao] = useState(SUGESTAO);
  const [devolvendo, setDevolvendo] = useState<ApontamentoView | null>(null);

  const filtrados = useMemo(
    () =>
      (data ?? []).filter(
        (a) =>
          (pessoa === TODOS || a.colaborador_id === pessoa) &&
          (semana === TODOS || a.semana_inicio === semana) &&
          (naoPlanejadas === TODOS || a.nao_planejada),
      ),
    [data, pessoa, semana, naoPlanejadas],
  );

  const pessoas = [...new Map((data ?? []).map((a) => [a.colaborador_id, a.colaborador_nome])).entries()];
  const semanas = [...new Set((data ?? []).map((a) => a.semana_inicio!))].sort();
  const escolhidos = filtrados.filter((a) => selecionados.has(a.id));
  const horasEscolhidas = escolhidos.reduce((s, a) => s + Number(a.horas), 0);

  const colunas = [
    colunaSelecao({ dados: filtrados, chaveLinha: (a: ApontamentoView) => a.id, selecionados, onChange: setSelecionados }),
    ...colunasAprovacao({ rotulo: "Devolver", executar: setDevolvendo }),
  ];

  const aprovarSelecionados = () =>
    aprovar.mutate(
      {
        ids: escolhidos.map((a) => a.id),
        usarSugestao: classificacao === SUGESTAO,
        classificacao:
          classificacao === SUGESTAO ? undefined : (classificacao as Enums<"classificacao_comercial">),
      },
      { onSuccess: () => setSelecionados(new Set()) },
    );

  return (
    <div className="space-y-4">
      <BarraFiltros
        filtrosAtivos={pessoa !== TODOS || semana !== TODOS || naoPlanejadas !== TODOS}
        onLimpar={() => {
          setPessoa(TODOS);
          setSemana(TODOS);
          setNaoPlanejadas(TODOS);
        }}
      >
        <FiltroSelect valor={pessoa} onChange={setPessoa} rotuloTodos="Todas as pessoas"
          opcoes={pessoas.map(([valor, rotulo]) => ({ valor, rotulo }))} />
        <FiltroSelect valor={semana} onChange={setSemana} rotuloTodos="Todas as semanas"
          opcoes={semanas.map((s) => ({ valor: s, rotulo: formatSemana(s) }))} />
        <FiltroSelect valor={naoPlanejadas} onChange={setNaoPlanejadas} rotuloTodos="Planejadas e não planejadas"
          opcoes={[{ valor: SIM, rotulo: "Só não planejadas" }]} />
      </BarraFiltros>

      <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">
          {escolhidos.length
            ? `${escolhidos.length} selecionado(s) · ${formatHours(horasEscolhidas)}`
            : "Selecione os apontamentos para aprovar em lote."}
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={classificacao} onValueChange={setClassificacao}>
            <SelectTrigger className="w-full sm:w-64" aria-label="Classificação ao aprovar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SUGESTAO}>Classificação: sugestão do contrato</SelectItem>
              {opcoesDe(CLASSIFICACAO_LABEL).map((o) => (
                <SelectItem key={o.valor} value={o.valor}>
                  Classificação: {o.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={aprovarSelecionados} disabled={!escolhidos.length || aprovar.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Aprovar selecionados
          </Button>
        </div>
      </div>

      <TabelaDados
        colunas={colunas}
        dados={filtrados}
        carregando={isLoading}
        chaveLinha={(a) => a.id}
        vazio={{ titulo: "Nenhuma hora aguardando sua aprovação" }}
      />
      <p className="text-xs text-muted-foreground">
        A classificação escolhida aqui é uma sugestão técnica; a validação comercial é do Administrativo com o Proprietário.
      </p>

      <DialogMotivo
        aberto={!!devolvendo}
        onAbertoChange={(aberto) => !aberto && setDevolvendo(null)}
        titulo="Devolver apontamento"
        descricao={devolvendo ? `${devolvendo.colaborador_nome} · ${devolvendo.demanda_titulo}` : undefined}
        rotuloSalvar="Devolver"
        onConfirmar={(motivo) => devolver.mutateAsync({ id: devolvendo!.id, motivo })}
      />
    </div>
  );
}
