import type { Coluna } from "@/components/comum/TabelaDados";
import { Selo } from "@/components/comum/Selo";
import type { DemandaDaLista } from "@/hooks/useDemandas";
import { formatCodigoDemanda, formatDate } from "@/lib/format";
import { TIPO_DEMANDA_LABEL } from "@/lib/rotulos";
import { SELO_PRIORIDADE, SELO_STATUS_DEMANDA } from "@/lib/selos";
import { Estimativa } from "./Estimativa";

/** "Cliente · Projeto" ou "Interno". */
const origemDemanda = (d: DemandaDaLista) =>
  d.cliente ? [d.cliente.nome, d.projeto?.nome].filter(Boolean).join(" · ") : "Interno";

export const COLUNAS_DEMANDAS: Coluna<DemandaDaLista>[] = [
  {
    chave: "codigo",
    titulo: "Código",
    className: "whitespace-nowrap",
    celula: (d) => <span className="text-muted-foreground">{formatCodigoDemanda(d.codigo)}</span>,
  },
  {
    chave: "titulo",
    titulo: "Demanda",
    celula: (d) => (
      <div>
        <div className="font-medium">{d.titulo}</div>
        <div className="text-xs text-muted-foreground">{origemDemanda(d)}</div>
      </div>
    ),
  },
  {
    chave: "prioridade",
    titulo: "Prioridade",
    className: "whitespace-nowrap",
    celula: (d) => <Selo mapa={SELO_PRIORIDADE} valor={d.prioridade} />,
  },
  { chave: "tipo", titulo: "Tipo", celula: (d) => TIPO_DEMANDA_LABEL[d.tipo] },
  { chave: "lider", titulo: "Líder", celula: (d) => d.lider?.nome ?? "—" },
  {
    chave: "estimativa",
    titulo: "Estimativa",
    alinhamento: "direita",
    celula: (d) => <Estimativa horas={d.estimativa_horas} />,
  },
  {
    chave: "status",
    titulo: "Status",
    className: "whitespace-nowrap",
    celula: (d) => <Selo mapa={SELO_STATUS_DEMANDA} valor={d.status} />,
  },
  { chave: "entrada", titulo: "Entrada", celula: (d) => formatDate(d.data_entrada) },
];
