import { CalendarX2 } from "lucide-react";
import { Selo } from "@/components/comum/Selo";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { useSemanasNaoEnviadas } from "@/hooks/useAprovacoes";
import { formatDataHora } from "@/lib/format";
import type { SituacaoPrazo } from "@/lib/rotulos";
import { formatSemana } from "@/lib/semana";
import { SELO_SITUACAO_PRAZO } from "@/lib/selos";

/** Quem ainda não enviou semanas já encerradas (últimas 4 semanas). */
export function BlocoSemanaNaoEnviada() {
  const { data } = useSemanasNaoEnviadas();
  if (!data || data.length === 0) return null;

  const porSemana = new Map<string, typeof data>();
  for (const linha of data) {
    const chave = linha.semana_inicio!;
    porSemana.set(chave, [...(porSemana.get(chave) ?? []), linha]);
  }

  return (
    <SecaoCard
      titulo="Semana não enviada"
      descricao="Pessoas com semana encerrada ainda não enviada para aprovação (faltam dias sem horas ou apontamentos em rascunho)."
    >
      <div className="space-y-4">
        {[...porSemana.entries()].map(([semana, pessoas]) => (
          <div key={semana} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarX2 className="h-4 w-4 text-muted-foreground" />
              Semana de {formatSemana(semana)}
              <span className="font-normal text-muted-foreground">
                · prazo {pessoas[0].prazo_envio && formatDataHora(pessoas[0].prazo_envio)}
              </span>
            </div>
            <ul className="divide-y rounded-md border text-sm">
              {pessoas.map((p) => (
                <li key={p.colaborador_id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <span className="font-medium">{p.colaborador_nome}</span>
                  <span className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    {!!p.dias_sem_registro && <span>{p.dias_sem_registro} dia(s) sem horas</span>}
                    {!!p.apontamentos_nao_enviados && <span>{p.apontamentos_nao_enviados} em rascunho</span>}
                    <Selo mapa={SELO_SITUACAO_PRAZO} valor={p.situacao as SituacaoPrazo} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SecaoCard>
  );
}
