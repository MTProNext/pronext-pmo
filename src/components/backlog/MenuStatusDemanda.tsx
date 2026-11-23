import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmacaoDialog } from "@/components/comum/ConfirmacaoDialog";
import { useAlterarStatusDemanda, type DemandaDetalhada } from "@/hooks/useDemandas";
import type { Enums } from "@/integrations/supabase/types";
import { STATUS_DEMANDA_LABEL } from "@/lib/rotulos";

type Status = Enums<"status_demanda">;

/** Troca rápida de status; cancelar pede confirmação. */
export function MenuStatusDemanda({ demanda }: { demanda: DemandaDetalhada }) {
  const alterar = useAlterarStatusDemanda();
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);

  const escolher = (status: Status) => {
    if (status === "cancelada") setConfirmarCancelamento(true);
    else alterar.mutate({ id: demanda.id, status });
  };

  const opcoes = (Object.keys(STATUS_DEMANDA_LABEL) as Status[]).filter((s) => s !== demanda.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={alterar.isPending}>
            Alterar status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mover para</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {opcoes.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => escolher(s)}
              className={s === "cancelada" ? "text-destructive focus:text-destructive" : undefined}
            >
              {STATUS_DEMANDA_LABEL[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmacaoDialog
        aberto={confirmarCancelamento}
        onAbertoChange={setConfirmarCancelamento}
        titulo="Cancelar demanda?"
        descricao="A demanda sai do backlog em aberto. Ela pode ser reaberta depois mudando o status."
        rotuloConfirmar="Cancelar demanda"
        rotuloCancelar="Voltar"
        destrutivo
        onConfirmar={() => alterar.mutate({ id: demanda.id, status: "cancelada" })}
      />
    </>
  );
}
