import { Selo } from "@/components/comum/Selo";
import type { Coluna } from "@/components/comum/TabelaDados";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { formatCodigoDemanda, formatDate, formatHours } from "@/lib/format";
import { SELO_CLASSIFICACAO } from "@/lib/selos";

/** Colunas da validação comercial: o foco é cliente/contrato e a classificação. */
export const COLUNAS_CLASSIFICACAO: Coluna<ApontamentoView>[] = [
  { chave: "data", titulo: "Data", className: "whitespace-nowrap", celula: (a) => formatDate(a.data) },
  {
    chave: "contrato",
    titulo: "Cliente / contrato",
    celula: (a) => (
      <div>
        <div className="font-medium">{a.cliente_nome ?? "Interno"}</div>
        <div className="text-xs text-muted-foreground">{a.contrato_nome ?? "Sem contrato"}</div>
      </div>
    ),
  },
  {
    chave: "demanda",
    titulo: "Demanda",
    celula: (a) => (
      <div>
        <span className="mr-1 text-xs text-muted-foreground">{formatCodigoDemanda(a.demanda_codigo)}</span>
        {a.demanda_titulo}
        <div className="text-xs text-muted-foreground">
          {a.colaborador_nome} · {a.categoria_nome}
        </div>
      </div>
    ),
  },
  { chave: "horas", titulo: "Horas", alinhamento: "direita", celula: (a) => formatHours(Number(a.horas)) },
  {
    chave: "atual",
    titulo: "Classificação atual",
    celula: (a) => <Selo mapa={SELO_CLASSIFICACAO} valor={a.classificacao_comercial} />,
  },
  {
    chave: "sugestao",
    titulo: "Sugestão do contrato",
    celula: (a) => a.classificacao_sugerida && <Selo mapa={SELO_CLASSIFICACAO} valor={a.classificacao_sugerida} />,
  },
];
