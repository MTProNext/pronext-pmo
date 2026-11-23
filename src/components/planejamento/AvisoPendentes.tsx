import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Replanejamento } from "@/hooks/usePlanejamento";
import { formatCodigoDemanda, formatDataHora } from "@/lib/format";
import { DialogCompletarReplanejamento } from "./DialogCompletarReplanejamento";

interface Props {
  replanejamentos: Replanejamento[];
  /** Líder técnico pode completar; os demais só veem o aviso. */
  podeCompletar: boolean;
}

/** Aviso de replanejamentos automáticos (P1/P2) aguardando motivo e impacto. */
export function AvisoPendentes({ replanejamentos, podeCompletar }: Props) {
  const [completando, setCompletando] = useState<Replanejamento | null>(null);
  const pendentes = replanejamentos.filter((r) => r.pendente);
  if (pendentes.length === 0) return null;

  return (
    <>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {pendentes.length === 1
            ? "1 replanejamento aguardando motivo e impacto"
            : `${pendentes.length} replanejamentos aguardando motivo e impacto`}
        </AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-2">
            {pendentes.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{r.demanda ? `${formatCodigoDemanda(r.demanda.codigo)} · ${r.demanda.titulo}` : "Demanda"}</strong>
                  {" — "}
                  {r.descricao_auto} ({formatDataHora(r.created_at)}, responsável: {r.responsavel?.nome})
                </span>
                {podeCompletar ? (
                  <Button size="sm" variant="outline" onClick={() => setCompletando(r)}>
                    Completar
                  </Button>
                ) : (
                  <span className="text-xs">Aguardando o líder técnico</span>
                )}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
      <DialogCompletarReplanejamento replanejamento={completando} onFechar={() => setCompletando(null)} />
    </>
  );
}
