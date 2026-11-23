import { Link } from "react-router-dom";
import type { Coluna } from "@/components/comum/TabelaDados";
import { Selo } from "@/components/comum/Selo";
import type { ItemPlanejamento } from "@/hooks/usePlanejamento";
import { formatCodigoDemanda, formatHours } from "@/lib/format";
import { SELO_FAIXA, SELO_PRIORIDADE } from "@/lib/selos";
import { StatusRapido } from "./StatusRapido";

const origem = (i: ItemPlanejamento) =>
  i.demanda?.cliente ? [i.demanda.cliente.nome, i.demanda.projeto?.nome].filter(Boolean).join(" · ") : "Interno";

/**
 * Colunas de "Minha semana"; o status só é editável enquanto a semana não foi revisada.
 * `apontado`: horas apontadas pela pessoa por demanda na semana.
 */
export function colunasMinhaSemana(statusEditavel: boolean, apontado: Map<string, number>): Coluna<ItemPlanejamento>[] {
  return [
    {
      chave: "demanda",
      titulo: "Demanda",
      celula: (i) => (
        <div>
          <Link to={`/backlog/${i.demanda_id}`} className="font-medium underline-offset-4 hover:underline">
            <span className="mr-2 text-xs font-normal text-muted-foreground">
              {i.demanda && formatCodigoDemanda(i.demanda.codigo)}
            </span>
            {i.demanda?.titulo}
          </Link>
          <div className="text-xs text-muted-foreground">{origem(i)}</div>
        </div>
      ),
    },
    {
      chave: "prioridade",
      titulo: "Prioridade",
      className: "whitespace-nowrap",
      celula: (i) => i.demanda && <Selo mapa={SELO_PRIORIDADE} valor={i.demanda.prioridade} />,
    },
    { chave: "faixa", titulo: "Faixa", celula: (i) => <Selo mapa={SELO_FAIXA} valor={i.faixa} /> },
    {
      chave: "horas",
      titulo: "Horas planejadas",
      alinhamento: "direita",
      celula: (i) => formatHours(Number(i.horas_planejadas)),
    },
    {
      chave: "apontado",
      titulo: "Apontado",
      alinhamento: "direita",
      celula: (i) => {
        const horas = apontado.get(i.demanda_id) ?? 0;
        return horas ? formatHours(horas) : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      chave: "status",
      titulo: "Status",
      celula: (i) =>
        i.demanda && <StatusRapido demandaId={i.demanda_id} status={i.demanda.status} desabilitado={!statusEditavel} />,
    },
  ];
}
