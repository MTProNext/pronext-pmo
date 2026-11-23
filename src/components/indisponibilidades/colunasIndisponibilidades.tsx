import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Coluna } from "@/components/comum/TabelaDados";
import type { IndisponibilidadeDetalhada } from "@/hooks/useIndisponibilidades";
import { formatHours, formatPeriodo } from "@/lib/format";
import { TIPO_INDISPONIBILIDADE_LABEL } from "@/lib/rotulos";

type Linha = IndisponibilidadeDetalhada;

/** Colunas da lista; a coluna de exclusão só entra quando há permissão. */
export function colunasIndisponibilidades(onExcluir?: (linha: Linha) => void): Coluna<Linha>[] {
  const colunas: Coluna<Linha>[] = [
    {
      chave: "colaborador",
      titulo: "Colaborador",
      celula: (i) =>
        i.colaborador ? (
          <span className="font-medium">{i.colaborador.nome}</span>
        ) : (
          <div>
            <div className="font-medium">Todos (global)</div>
            {i.localidade && <div className="text-xs text-muted-foreground">{i.localidade}</div>}
          </div>
        ),
    },
    {
      chave: "tipo",
      titulo: "Tipo",
      celula: (i) => <Badge variant="outline">{TIPO_INDISPONIBILIDADE_LABEL[i.tipo]}</Badge>,
    },
    { chave: "periodo", titulo: "Período", celula: (i) => formatPeriodo(i.data_inicio, i.data_fim) },
    {
      chave: "horas",
      titulo: "Horas/dia",
      celula: (i) => (i.horas_por_dia === null ? "Dia inteiro" : formatHours(i.horas_por_dia)),
    },
    { chave: "descricao", titulo: "Descrição", celula: (i) => i.descricao ?? "—" },
  ];

  if (onExcluir) {
    colunas.push({
      chave: "acoes",
      titulo: "",
      alinhamento: "direita",
      celula: (i) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir"
          onClick={(e) => {
            e.stopPropagation();
            onExcluir(i);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    });
  }
  return colunas;
}
