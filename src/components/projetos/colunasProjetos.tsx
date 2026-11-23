import type { Coluna } from "@/components/comum/TabelaDados";
import { Selo } from "@/components/comum/Selo";
import type { ProjetoDetalhado } from "@/hooks/useProjetos";
import { formatDate } from "@/lib/format";
import { SELO_STATUS_PROJETO } from "@/lib/selos";

const data = (d: string | null) => (d ? formatDate(d) : "—");

export const COLUNAS_PROJETOS: Coluna<ProjetoDetalhado>[] = [
  {
    chave: "nome",
    titulo: "Projeto",
    celula: (p) => (
      <div>
        <div className="font-medium">{p.nome}</div>
        <div className="text-xs text-muted-foreground">{p.cliente?.nome}</div>
      </div>
    ),
  },
  { chave: "contrato", titulo: "Contrato", celula: (p) => p.contrato?.nome ?? "—" },
  { chave: "lider", titulo: "Líder", celula: (p) => p.lider?.nome ?? "—" },
  { chave: "inicio", titulo: "Início previsto", celula: (p) => data(p.data_inicio_prevista) },
  { chave: "fim", titulo: "Fim previsto", celula: (p) => data(p.data_fim_prevista) },
  {
    chave: "status",
    titulo: "Status",
    celula: (p) => <Selo mapa={SELO_STATUS_PROJETO} valor={p.status} />,
  },
];
