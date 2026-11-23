import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlterarStatusDemanda } from "@/hooks/useDemandas";
import type { Enums } from "@/integrations/supabase/types";
import { STATUS_DEMANDA_LABEL } from "@/lib/rotulos";

type Status = Enums<"status_demanda">;

/** Status que quem executa pode escolher (o banco aplica a mesma regra ao desenvolvedor). */
const STATUS_EXECUCAO: Status[] = ["planejada", "em_execucao", "bloqueada", "concluida"];

interface Props {
  demandaId: string;
  status: Status;
  desabilitado?: boolean;
}

/** Troca rápida do status da demanda, direto na lista. */
export function StatusRapido({ demandaId, status, desabilitado }: Props) {
  const alterar = useAlterarStatusDemanda();
  const opcoes = STATUS_EXECUCAO.includes(status) ? STATUS_EXECUCAO : [status, ...STATUS_EXECUCAO];

  return (
    <Select
      value={status}
      disabled={desabilitado || alterar.isPending}
      onValueChange={(novo) => alterar.mutate({ id: demandaId, status: novo as Status })}
    >
      <SelectTrigger className="h-8 w-40" aria-label="Status da demanda">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((s) => (
          <SelectItem key={s} value={s} disabled={!STATUS_EXECUCAO.includes(s)}>
            {STATUS_DEMANDA_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
