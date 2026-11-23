import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CampoData } from "@/components/comum/CampoData";
import { CampoNumero, CampoSwitch, CampoTexto } from "@/components/comum/CamposFormulario";
import { CampoSelect } from "@/components/comum/CampoSelect";
import { FormularioDialog } from "@/components/comum/FormularioDialog";
import { useColaboradores } from "@/hooks/useColaboradores";
import {
  useSalvarIndisponibilidade,
  type IndisponibilidadeDetalhada,
} from "@/hooks/useIndisponibilidades";
import { opcoesDe, TIPO_INDISPONIBILIDADE_LABEL } from "@/lib/rotulos";
import { enumDe } from "@/lib/validacao";

const esquema = z
  .object({
    colaborador_id: z.string().nullable(),
    tipo: enumDe(TIPO_INDISPONIBILIDADE_LABEL),
    data_inicio: z.string({ required_error: "Informe a data inicial." }).min(1),
    data_fim: z.string({ required_error: "Informe a data final." }).min(1),
    dia_inteiro: z.boolean(),
    horas_por_dia: z.number().gt(0).max(24).nullable(),
    descricao: z.string().optional(),
    localidade: z.string().optional(),
  })
  .refine((v) => v.colaborador_id !== null || v.tipo === "feriado", {
    path: ["tipo"],
    message: "Só feriados podem valer para todos os colaboradores.",
  })
  .refine((v) => v.data_fim >= v.data_inicio, {
    path: ["data_fim"],
    message: "A data final não pode ser anterior à inicial.",
  })
  .refine((v) => v.dia_inteiro || v.horas_por_dia !== null, {
    path: ["horas_por_dia"],
    message: "Informe as horas indisponíveis por dia.",
  });

type Dados = z.infer<typeof esquema>;

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  indisponibilidade: IndisponibilidadeDetalhada | null;
}

export function FormularioIndisponibilidade({ aberto, onAbertoChange, indisponibilidade: ind }: Props) {
  const { data: colaboradores } = useColaboradores();
  const salvar = useSalvarIndisponibilidade();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });
  const diaInteiro = form.watch("dia_inteiro");

  useEffect(() => {
    if (!aberto) return;
    form.reset({
      colaborador_id: ind ? ind.colaborador_id : null,
      tipo: ind?.tipo ?? "feriado",
      data_inicio: ind?.data_inicio,
      data_fim: ind?.data_fim,
      dia_inteiro: ind ? ind.horas_por_dia === null : true,
      horas_por_dia: ind?.horas_por_dia ?? null,
      descricao: ind?.descricao ?? "",
      localidade: ind?.localidade ?? "",
    });
  }, [aberto, ind, form]);

  const opcoesColaboradores = (colaboradores ?? [])
    .filter((c) => c.ativo || c.id === ind?.colaborador_id)
    .map((c) => ({ valor: c.id, rotulo: c.nome }));

  const onSalvar = async ({ dia_inteiro, horas_por_dia, descricao, localidade, ...v }: Dados) => {
    await salvar.mutateAsync({
      id: ind?.id,
      dados: {
        ...v,
        horas_por_dia: dia_inteiro ? null : horas_por_dia,
        descricao: descricao || null,
        localidade: localidade || null,
      },
    });
    onAbertoChange(false);
  };

  const c = form.control;
  return (
    <FormularioDialog
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={ind ? "Editar indisponibilidade" : "Nova indisponibilidade"}
      descricao="Reduz a capacidade efetiva nos dias úteis do período."
      form={form}
      onSalvar={onSalvar}
    >
      <CampoSelect
        control={c}
        name="colaborador_id"
        label="Colaborador"
        rotuloNenhum="Todos (feriado global)"
        opcoes={opcoesColaboradores}
      />
      <CampoSelect control={c} name="tipo" label="Tipo" opcoes={opcoesDe(TIPO_INDISPONIBILIDADE_LABEL)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoData control={c} name="data_inicio" label="De" />
        <CampoData control={c} name="data_fim" label="Até" />
      </div>
      <CampoSwitch
        control={c}
        name="dia_inteiro"
        label="Dia inteiro"
        descricao="Desligue para meio período ou ausência parcial."
      />
      {!diaInteiro && (
        <CampoNumero control={c} name="horas_por_dia" label="Horas indisponíveis por dia" sufixo="h" />
      )}
      <CampoTexto control={c} name="descricao" label="Descrição" placeholder="Ex.: Férias, consulta médica" />
      <CampoTexto
        control={c}
        name="localidade"
        label="Localidade"
        placeholder="Para feriados: Nacional, SP, São José dos Campos..."
      />
    </FormularioDialog>
  );
}
