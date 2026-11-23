import type { Coluna } from "@/components/comum/TabelaDados";
import { Selo } from "@/components/comum/Selo";
import type { ContratoComCliente } from "@/hooks/useContratos";
import { formatHours, formatMoeda, formatPeriodo } from "@/lib/format";
import { PERIODICIDADE_LABEL, TIPO_CONTRATO_LABEL } from "@/lib/rotulos";
import { SELO_STATUS_CONTRATO } from "@/lib/selos";

const horas = (c: ContratoComCliente) =>
  c.horas_contratadas === null
    ? "—"
    : `${formatHours(c.horas_contratadas)} ${PERIODICIDADE_LABEL[c.periodicidade_horas].toLowerCase()}`;

/** Colunas da lista de contratos; a de valor/hora só entra para quem pode vê-la. */
export function colunasContratos(valores?: Map<string, number>): Coluna<ContratoComCliente>[] {
  const colunas: Coluna<ContratoComCliente>[] = [
    {
      chave: "nome",
      titulo: "Contrato",
      celula: (c) => (
        <div>
          <div className="font-medium">{c.nome}</div>
          <div className="text-xs text-muted-foreground">{c.cliente?.nome}</div>
        </div>
      ),
    },
    { chave: "tipo", titulo: "Tipo", celula: (c) => TIPO_CONTRATO_LABEL[c.tipo] },
    { chave: "horas", titulo: "Horas contratadas", celula: horas },
    {
      chave: "vigencia",
      titulo: "Vigência",
      celula: (c) => formatPeriodo(c.vigencia_inicio, c.vigencia_fim),
    },
  ];

  if (valores) {
    colunas.push({
      chave: "valor",
      titulo: "Valor/hora",
      alinhamento: "direita",
      celula: (c) => {
        const valor = valores.get(c.id);
        return valor === undefined ? "—" : formatMoeda(valor);
      },
    });
  }

  colunas.push({
    chave: "status",
    titulo: "Status",
    celula: (c) => <Selo mapa={SELO_STATUS_CONTRATO} valor={c.status} />,
  });
  return colunas;
}
