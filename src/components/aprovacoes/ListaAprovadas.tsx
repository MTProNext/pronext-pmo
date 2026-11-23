import { useState } from "react";
import { DialogMotivo } from "@/components/comum/DialogMotivo";
import { TabelaDados } from "@/components/comum/TabelaDados";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { useAprovadasRecentes, useReabrirApontamento } from "@/hooks/useAprovacoes";
import { colunasAprovacao } from "./colunasAprovacao";

/** Horas aprovadas nas últimas semanas, com a opção de reabrir para correção. */
export function ListaAprovadas() {
  const { data, isLoading } = useAprovadasRecentes();
  const reabrir = useReabrirApontamento();
  const [reabrindo, setReabrindo] = useState<ApontamentoView | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Hora aprovada não é editada pelo autor. Para corrigir, reabra com o motivo: ela volta como devolvida, o autor
        corrige e reenvia. Tudo fica no histórico.
      </p>
      <TabelaDados
        colunas={colunasAprovacao({ rotulo: "Reabrir", executar: setReabrindo })}
        dados={data}
        carregando={isLoading}
        chaveLinha={(a) => a.id}
        vazio={{ titulo: "Nenhuma hora aprovada por você nas últimas semanas" }}
      />
      <DialogMotivo
        aberto={!!reabrindo}
        onAbertoChange={(aberto) => !aberto && setReabrindo(null)}
        titulo="Reabrir hora aprovada"
        descricao={reabrindo ? `${reabrindo.colaborador_nome} · ${reabrindo.demanda_titulo}` : undefined}
        rotuloSalvar="Reabrir"
        onConfirmar={(motivo) => reabrir.mutateAsync({ id: reabrindo!.id, motivo })}
      />
    </div>
  );
}
