import { Link } from "react-router-dom";
import { Gauge, History, Users, UserX } from "lucide-react";
import { Indicador } from "@/components/comum/Indicador";
import type { CapacidadePessoa, ResumoSemana } from "@/hooks/usePlanejamento";
import { formatHours, formatPct } from "@/lib/format";

interface Props {
  resumo: ResumoSemana;
  pessoas: CapacidadePessoa[];
  inicio: string;
}

export function IndicadoresSemana({ resumo, pessoas, inicio }: Props) {
  const acima = pessoas.filter((p) => p.excede_capacidade);
  const pendentes = resumo.replanejamentos_pendentes ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Indicador
        rotulo="Capacidade efetiva"
        icone={Users}
        valor={formatHours(resumo.capacidade_total ?? 0)}
        descricao={`${pessoas.length} pessoas, já descontadas as indisponibilidades`}
      />
      <Indicador
        rotulo="Horas planejadas"
        icone={Gauge}
        valor={formatHours(resumo.horas_planejadas ?? 0)}
        descricao={`Ocupação planejada: ${formatPct(resumo.ocupacao_pct)}`}
      />
      <Indicador
        rotulo="Acima da capacidade"
        icone={UserX}
        alerta={acima.length > 0}
        valor={acima.length}
        descricao={acima.length ? acima.map((p) => p.colaborador_nome).join(", ") : "Ninguém sobrecarregado"}
      />
      <Indicador
        rotulo="Replanejamentos"
        icone={History}
        alerta={pendentes > 0}
        valor={resumo.replanejamentos ?? 0}
        descricao={
          <Link to={`/planejamento/${inicio}/replanejamentos`} className="underline-offset-4 hover:underline">
            {pendentes > 0 ? `${pendentes} pendente(s) · ver log` : "Ver log da semana"}
          </Link>
        }
      />
    </div>
  );
}
