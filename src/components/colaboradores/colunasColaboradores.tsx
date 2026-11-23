import { Badge } from "@/components/ui/badge";
import type { Coluna } from "@/components/comum/TabelaDados";
import { Selo } from "@/components/comum/Selo";
import type { ColaboradorComLider } from "@/hooks/useColaboradores";
import { formatHours } from "@/lib/format";
import { PAPEL_LABEL, SENIORIDADE_LABEL } from "@/lib/papeis";
import { SELO_SITUACAO } from "@/lib/selos";

export const COLUNAS_COLABORADORES: Coluna<ColaboradorComLider>[] = [
  {
    chave: "nome",
    titulo: "Nome",
    celula: (c) => (
      <div>
        <div className="font-medium">{c.nome}</div>
        <div className="text-xs text-muted-foreground">{c.email}</div>
      </div>
    ),
  },
  { chave: "papel", titulo: "Papel", celula: (c) => PAPEL_LABEL[c.papel] },
  { chave: "lider", titulo: "Líder", celula: (c) => c.lider?.nome ?? "—" },
  {
    chave: "jornada",
    titulo: "Jornada",
    alinhamento: "direita",
    celula: (c) => formatHours(c.jornada_semanal),
  },
  {
    chave: "horas_dev",
    titulo: "Horas dev",
    alinhamento: "direita",
    celula: (c) => formatHours(c.horas_dev_semanais),
  },
  {
    chave: "senioridade",
    titulo: "Senioridade",
    celula: (c) => (c.senioridade ? SENIORIDADE_LABEL[c.senioridade] : "—"),
  },
  {
    chave: "competencias",
    titulo: "Competências",
    celula: (c) => (
      <div className="flex flex-wrap gap-1">
        {c.competencias.map((comp) => (
          <Badge key={comp} variant="outline">
            {comp}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    chave: "situacao",
    titulo: "Situação",
    celula: (c) => <Selo mapa={SELO_SITUACAO} valor={c.ativo ? "ativo" : "inativo"} />,
  },
];
