import { Button } from "@/components/ui/button";
import { Selo } from "@/components/comum/Selo";
import type { Coluna } from "@/components/comum/TabelaDados";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { formatCodigoDemanda, formatDate, formatHours } from "@/lib/format";
import { SELO_CLASSIFICACAO } from "@/lib/selos";
import { SeloPlanejamento } from "./SeloPlanejamento";

const origem = (a: ApontamentoView) =>
  a.cliente_nome ? [a.cliente_nome, a.projeto_nome].filter(Boolean).join(" · ") : "Interno";

interface Acao {
  rotulo: string;
  executar: (ap: ApontamentoView) => void;
}

/** Colunas das listas de aprovação; a ação da linha é Devolver (pendentes) ou Reabrir (aprovadas). */
export function colunasAprovacao(acao?: Acao): Coluna<ApontamentoView>[] {
  const colunas: Coluna<ApontamentoView>[] = [
    { chave: "data", titulo: "Data", className: "whitespace-nowrap", celula: (a) => formatDate(a.data) },
    { chave: "pessoa", titulo: "Pessoa", celula: (a) => a.colaborador_nome },
    {
      chave: "demanda",
      titulo: "Demanda",
      celula: (a) => (
        <div>
          <div className="font-medium">
            <span className="mr-1 text-xs font-normal text-muted-foreground">{formatCodigoDemanda(a.demanda_codigo)}</span>
            {a.demanda_titulo}
          </div>
          <div className="text-xs text-muted-foreground">{origem(a)}</div>
        </div>
      ),
    },
    { chave: "categoria", titulo: "Categoria", celula: (a) => a.categoria_nome },
    { chave: "horas", titulo: "Horas", alinhamento: "direita", celula: (a) => formatHours(Number(a.horas)) },
    { chave: "descricao", titulo: "Descrição", celula: (a) => <div className="max-w-xs text-sm">{a.descricao}</div> },
    { chave: "planejamento", titulo: "Planejamento", celula: (a) => <SeloPlanejamento ap={a} /> },
    {
      chave: "classificacao",
      titulo: "Classificação",
      celula: (a) => (
        <div className="space-y-1">
          <Selo mapa={SELO_CLASSIFICACAO} valor={a.classificacao_comercial} />
          {a.classificacao_comercial === "a_validar" && a.classificacao_sugerida && a.classificacao_sugerida !== "a_validar" && (
            <div className="text-xs text-muted-foreground">sugestão: {SELO_CLASSIFICACAO[a.classificacao_sugerida].rotulo}</div>
          )}
        </div>
      ),
    },
  ];
  if (acao) {
    colunas.push({
      chave: "acao",
      titulo: "",
      alinhamento: "direita",
      celula: (a) => (
        <Button variant="outline" size="sm" onClick={() => acao.executar(a)}>
          {acao.rotulo}
        </Button>
      ),
    });
  }
  return colunas;
}
