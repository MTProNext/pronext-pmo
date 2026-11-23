import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistoricoApontamento, type ApontamentoView } from "@/hooks/useApontamentos";
import { formatDataHora, formatDate, formatCodigoDemanda } from "@/lib/format";
import { STATUS_APONTAMENTO_LABEL } from "@/lib/rotulos";

const OPERACAO: Record<string, string> = { INSERT: "Criado", UPDATE: "Alterado", DELETE: "Excluído" };

/** Campos exibidos no histórico (os demais são técnicos). */
const CAMPOS: Record<string, string> = {
  horas: "Horas",
  descricao: "Descrição",
  status: "Status",
  categoria_id: "Categoria",
  data: "Data",
  demanda_id: "Demanda",
  classificacao_comercial: "Classificação",
  motivo_devolucao: "Motivo da devolução",
};

const valor = (campo: string, v: unknown) => {
  if (v === null || v === undefined) return "—";
  if (campo === "status") return STATUS_APONTAMENTO_LABEL[v as keyof typeof STATUS_APONTAMENTO_LABEL] ?? String(v);
  if (campo.endsWith("_id")) return "(outra)";
  return String(v);
};

interface Props {
  apontamento: ApontamentoView | null;
  onFechar: () => void;
}

/** Histórico de alterações (auditoria) de um apontamento. */
export function SheetHistorico({ apontamento: ap, onFechar }: Props) {
  const { data, isLoading } = useHistoricoApontamento(ap?.id);

  return (
    <Sheet open={!!ap} onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Histórico do apontamento</SheetTitle>
          {ap && (
            <SheetDescription>
              {formatDate(ap.data)} · {formatCodigoDemanda(ap.demanda_codigo)} {ap.demanda_titulo}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {data?.map((h) => {
            const antes = (h.antes ?? {}) as Record<string, unknown>;
            const depois = (h.depois ?? {}) as Record<string, unknown>;
            const campos = h.campos_alterados.filter((c) => CAMPOS[c]);
            return (
              <div key={h.id} className="space-y-1 rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{OPERACAO[h.operacao]}</Badge>
                  <span className="text-muted-foreground">
                    {formatDataHora(h.alterado_em)} · {h.autor?.nome ?? "Sistema"}
                  </span>
                </div>
                {h.motivo && <p className="font-medium">Motivo: {h.motivo}</p>}
                {campos.map((c) => (
                  <p key={c}>
                    <span className="text-muted-foreground">{CAMPOS[c]}:</span> {valor(c, antes[c])} → {valor(c, depois[c])}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
