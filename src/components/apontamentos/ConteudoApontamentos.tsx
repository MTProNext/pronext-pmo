import { useMemo, useState } from "react";
import { CopyPlus, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ConfirmacaoDialog } from "@/components/comum/ConfirmacaoDialog";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { SecaoCard } from "@/components/comum/SecaoCard";
import {
  useDemandasSemanaAnterior,
  useEnviarApontamentos,
  usePrazosDias,
  type ApontamentoView,
} from "@/hooks/useApontamentos";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { useDemandas } from "@/hooks/useDemandas";
import type { Colaborador } from "@/hooks/useSessao";
import { addDaysISO, formatNumero, paraDataISO, parseData } from "@/lib/format";
import { AvisosApontamento } from "./AvisosApontamento";
import { DialogAdicionarDemanda } from "./DialogAdicionarDemanda";
import { GradeApontamentos, type MarcaDia } from "./GradeApontamentos";
import { EDITAVEL, type LinhaExtra } from "./montarLinhas";
import { SheetHistorico } from "./SheetHistorico";
import { useGradeApontamentos } from "./useGradeApontamentos";

interface Props {
  colaborador: Colaborador;
  inicio: string;
}

/** Grade, avisos e ações de apontamento de uma semana (remontado a cada semana). */
export function ConteudoApontamentos({ colaborador, inicio }: Props) {
  const grade = useGradeApontamentos(colaborador.id, inicio);
  const { data: config } = useConfiguracoes();
  const { data: prazos } = usePrazosDias(colaborador.id, inicio, addDaysISO(inicio, 6));
  const { data: anterior } = useDemandasSemanaAnterior(colaborador.id, inicio);
  const { data: demandas } = useDemandas();
  const enviar = useEnviarApontamentos();

  const [fimDeSemana, setFimDeSemana] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [confirmandoEnvio, setConfirmandoEnvio] = useState(false);
  const [historico, setHistorico] = useState<ApontamentoView | null>(null);

  const hoje = paraDataISO(new Date());
  const temFimDeSemana = grade.apontamentos.some((ap) => parseData(ap.data).getDay() % 6 === 0);
  const dias = Array.from({ length: fimDeSemana || temFimDeSemana ? 7 : 5 }, (_, i) => addDaysISO(inicio, i));

  // Marcas dos dias: útil passado sem horas, ou folga (dia de semana fora dos dias úteis da pessoa).
  const marcas = useMemo(() => {
    const porDia = new Map((prazos ?? []).map((p) => [p.dia, p]));
    const controle = config?.inicio_controle_apontamentos;
    return new Map<string, MarcaDia>(
      dias.map((dia) => {
        const prazo = porDia.get(dia);
        if (prazo) return [dia, prazo.sem_registro && dia < hoje ? "sem_horas" : null];
        const util = parseData(dia).getDay() % 6 !== 0;
        return [dia, util && controle && dia >= controle && dia <= hoje ? "folga" : null];
      }),
    );
  }, [prazos, config, dias, hoje]);

  const paraEnviar = grade.apontamentos.filter((ap) => EDITAVEL.includes(ap.status));
  const horasParaEnviar = paraEnviar.reduce((s, ap) => s + Number(ap.horas), 0);
  const diasSemHoras = dias.filter((d) => marcas.get(d) === "sem_horas");

  const copiarSemanaAnterior = () => {
    const naGrade = new Set(grade.linhas.map((l) => l.demanda.id));
    const novas: LinhaExtra[] = [];
    for (const ap of anterior ?? []) {
      const d = demandas?.find((x) => x.id === ap.demanda_id);
      if (!d || naGrade.has(d.id) || d.status === "cancelada" || d.status === "concluida") continue;
      naGrade.add(d.id);
      novas.push({
        demanda: {
          id: d.id,
          codigo: d.codigo,
          titulo: d.titulo,
          tipo: d.tipo,
          cliente_id: d.cliente_id,
          origem: d.cliente ? [d.cliente.nome, d.projeto?.nome].filter(Boolean).join(" · ") : "Interno",
        },
        categoriaId: ap.categoria_id,
        descricao: ap.descricao,
      });
    }
    grade.adicionarLinhas(novas);
  };

  if (grade.carregando) return <Skeleton className="h-72 w-full" />;

  return (
    <div className="space-y-6">
      <AvisosApontamento
        devolvidos={grade.apontamentos.filter((ap) => ap.status === "devolvido")}
        diasSemHoras={diasSemHoras}
      />
      <SecaoCard
        titulo="Horas da semana"
        descricao="Digite as horas e use Tab para ir ao próximo dia; tudo é salvo como rascunho ao sair da célula. Descrição e categoria da linha valem para todos os dias (o ícone em cada célula permite uma descrição própria do dia)."
        acoes={
          <>
            <div className="flex items-center gap-2">
              <Switch id="fim-de-semana" checked={fimDeSemana} onCheckedChange={setFimDeSemana} />
              <Label htmlFor="fim-de-semana">Sábado e domingo</Label>
            </div>
            <Button variant="outline" onClick={copiarSemanaAnterior} disabled={!anterior?.length}>
              <CopyPlus className="mr-2 h-4 w-4" />
              Copiar linhas da semana anterior
            </Button>
            <Button variant="outline" onClick={() => setAdicionando(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar demanda
            </Button>
            <Button onClick={() => setConfirmandoEnvio(true)} disabled={paraEnviar.length === 0 || enviar.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Enviar semana ({paraEnviar.length})
            </Button>
          </>
        }
      >
        {grade.linhas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma demanda nesta semana"
            descricao="Não há alocação publicada para você. Use “Adicionar demanda” ou “Copiar linhas da semana anterior”."
          />
        ) : (
          <GradeApontamentos
            dias={dias}
            linhas={grade.linhas}
            marcas={marcas}
            jornadaDia={Number(colaborador.jornada_semanal) / 5}
            categorias={grade.categorias}
            onHoras={grade.salvarHoras}
            onDescricaoLinha={grade.salvarDescricaoLinha}
            onCategoriaLinha={grade.salvarCategoriaLinha}
            onDescricaoDia={grade.salvarDescricaoDia}
            onHistorico={setHistorico}
          />
        )}
      </SecaoCard>

      <DialogAdicionarDemanda
        aberto={adicionando}
        onAbertoChange={setAdicionando}
        jaNaGrade={new Set(grade.linhas.map((l) => l.demanda.id))}
        onAdicionar={(demanda) => grade.adicionarLinhas([{ demanda }])}
      />
      <ConfirmacaoDialog
        aberto={confirmandoEnvio}
        onAbertoChange={setConfirmandoEnvio}
        titulo="Enviar a semana para aprovação?"
        descricao={`${paraEnviar.length} apontamento(s), ${formatNumero(horasParaEnviar)}h. Depois de enviados, só o líder pode devolvê-los para correção.${
          diasSemHoras.length ? ` Atenção: ${diasSemHoras.length} dia(s) útil(eis) sem horas.` : ""
        }`}
        rotuloConfirmar="Enviar"
        onConfirmar={() => enviar.mutate(paraEnviar.map((ap) => ap.id))}
      />
      <SheetHistorico apontamento={historico} onFechar={() => setHistorico(null)} />
    </div>
  );
}
