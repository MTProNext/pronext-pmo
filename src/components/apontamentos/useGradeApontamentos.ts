import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAlocacoesPessoa,
  useApontamentosSemana,
  useAtualizarApontamentos,
  useSalvarCelula,
  type ApontamentoView,
} from "@/hooks/useApontamentos";
import { useCategorias } from "@/hooks/useCategorias";
import { lerHoras } from "@/lib/format";
import { EDITAVEL, montarLinhas, type LinhaApontamento, type LinhaExtra } from "./montarLinhas";

/** Estado e ações da grade de apontamento de uma pessoa numa semana. */
export function useGradeApontamentos(colaboradorId: string | undefined, inicio: string) {
  const apontamentos = useApontamentosSemana(colaboradorId, inicio);
  const alocacoes = useAlocacoesPessoa(colaboradorId, inicio);
  const { data: categorias = [] } = useCategorias();
  const salvarCelula = useSalvarCelula();
  const atualizar = useAtualizarApontamentos();

  const [extras, setExtras] = useState<LinhaExtra[]>([]);
  const [ajustes, setAjustes] = useState(new Map<string, { descricao?: string; categoriaId?: string }>());

  const linhas = useMemo(
    () =>
      montarLinhas({
        apontamentos: apontamentos.data ?? [],
        alocacoes: alocacoes.data ?? [],
        extras,
        ajustes,
        categorias,
      }),
    [apontamentos.data, alocacoes.data, extras, ajustes, categorias],
  );

  const ajustar = (demandaId: string, ajuste: { descricao?: string; categoriaId?: string }) =>
    setAjustes((atual) => new Map(atual).set(demandaId, { ...atual.get(demandaId), ...ajuste }));

  const editaveis = (linha: LinhaApontamento) =>
    [...linha.celulas.values()].filter((ap) => EDITAVEL.includes(ap.status));

  /** Grava as horas de uma célula. Retorna false quando o valor é recusado. */
  const salvarHoras = (linha: LinhaApontamento, dia: string, texto: string) => {
    const horas = lerHoras(texto);
    const ap = linha.celulas.get(dia);
    if (horas !== null && (Number.isNaN(horas) || horas > 24)) {
      toast.error("Informe horas válidas, por exemplo 1,5.");
      return false;
    }
    if (horas === null || horas === 0) {
      if (ap) salvarCelula.mutate({ id: ap.id, horas: null });
      return true;
    }
    if (ap) {
      salvarCelula.mutate({ id: ap.id, horas });
      return true;
    }
    if (linha.descricao.trim().length < 10) {
      toast.error("Preencha a descrição da linha (mínimo 10 caracteres) antes de lançar horas.");
      return false;
    }
    salvarCelula.mutate({
      horas,
      novo: { data: dia, demanda_id: linha.demanda.id, categoria_id: linha.categoriaId!, descricao: linha.descricao, horas },
    });
    return true;
  };

  /** Nova descrição da linha: aplica aos dias editáveis que usavam a descrição anterior. */
  const salvarDescricaoLinha = (linha: LinhaApontamento, descricao: string) => {
    ajustar(linha.demanda.id, { descricao });
    if (descricao.length < 10) return;
    const ids = editaveis(linha).filter((ap) => ap.descricao === linha.descricao).map((ap) => ap.id);
    atualizar.mutate({ ids, dados: { descricao } });
  };

  const salvarCategoriaLinha = (linha: LinhaApontamento, categoriaId: string) => {
    ajustar(linha.demanda.id, { categoriaId });
    atualizar.mutate({ ids: editaveis(linha).map((ap) => ap.id), dados: { categoria_id: categoriaId } });
  };

  const salvarDescricaoDia = (ap: ApontamentoView, descricao: string) =>
    atualizar.mutate({ ids: [ap.id], dados: { descricao } });

  const adicionarLinhas = (novas: LinhaExtra[]) => setExtras((atual) => [...atual, ...novas]);

  return {
    linhas,
    apontamentos: apontamentos.data ?? [],
    categorias,
    carregando: apontamentos.isLoading || alocacoes.isLoading,
    salvarHoras,
    salvarDescricaoLinha,
    salvarCategoriaLinha,
    salvarDescricaoDia,
    adicionarLinhas,
    /** Limpa linhas incluídas e ajustes ao trocar de semana. */
    reiniciar: () => {
      setExtras([]);
      setAjustes(new Map());
    },
  };
}
