import { useState } from "react";
import { CalendarCheck, CheckCheck, Play, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmacaoDialog } from "@/components/comum/ConfirmacaoDialog";
import { useAvancarSemana } from "@/hooks/useAcoesPlanejamento";
import type { Semana } from "@/hooks/usePlanejamento";
import type { Enums } from "@/integrations/supabase/types";

interface Passo {
  rotulo: string;
  icone: LucideIcon;
  titulo: string;
  descricao: string;
}

/** Próximo passo do ciclo para cada status (revisada não tem próximo). */
const PROXIMO: Partial<Record<Enums<"status_semana">, Passo>> = {
  rascunho: {
    rotulo: "Publicar semana",
    icone: Send,
    titulo: "Publicar a semana?",
    descricao:
      "A programação fica visível para toda a equipe. Depois disso, qualquer alteração na grade exige replanejamento com motivo e impacto.",
  },
  publicada: {
    rotulo: "Confirmar semana",
    icone: CalendarCheck,
    titulo: "Confirmar a semana?",
    descricao: "Confirma o planejamento publicado na segunda-feira.",
  },
  confirmada: {
    rotulo: "Iniciar execução",
    icone: Play,
    titulo: "Iniciar a execução?",
    descricao: "Marca a semana como em execução.",
  },
  em_execucao: {
    rotulo: "Marcar como revisada",
    icone: CheckCheck,
    titulo: "Encerrar e revisar a semana?",
    descricao: "Depois de revisada, a semana não aceita mais replanejamentos.",
  },
};

/** Botão do próximo passo do ciclo de vida (só para quem planeja). */
export function AcoesSemana({ semana }: { semana: Semana }) {
  const avancar = useAvancarSemana();
  const [confirmando, setConfirmando] = useState(false);
  const passo = PROXIMO[semana.status];
  if (!passo) return null;

  return (
    <>
      <Button onClick={() => setConfirmando(true)} disabled={avancar.isPending}>
        <passo.icone className="mr-2 h-4 w-4" />
        {passo.rotulo}
      </Button>
      <ConfirmacaoDialog
        aberto={confirmando}
        onAbertoChange={setConfirmando}
        titulo={passo.titulo}
        descricao={passo.descricao}
        rotuloConfirmar={passo.rotulo}
        onConfirmar={() => avancar.mutate(semana.id)}
      />
    </>
  );
}
