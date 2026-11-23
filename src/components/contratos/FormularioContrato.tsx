import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CampoData } from "@/components/comum/CampoData";
import { CampoNumero, CampoTexto, CampoTextoLongo } from "@/components/comum/CamposFormulario";
import { CampoSelect } from "@/components/comum/CampoSelect";
import { FormularioSheet } from "@/components/comum/FormularioSheet";
import { useClientes } from "@/hooks/useClientes";
import { useSalvarContrato, type ContratoComCliente } from "@/hooks/useContratos";
import {
  opcoesDe,
  PERIODICIDADE_LABEL,
  STATUS_CONTRATO_LABEL,
  TIPO_CONTRATO_LABEL,
} from "@/lib/rotulos";
import { enumDe } from "@/lib/validacao";

const esquema = z
  .object({
    cliente_id: z.string().min(1, "Selecione o cliente."),
    nome: z.string().trim().min(1, "Informe o nome do contrato."),
    tipo: enumDe(TIPO_CONTRATO_LABEL),
    horas_contratadas: z.number().min(0).nullable(),
    periodicidade_horas: enumDe(PERIODICIDADE_LABEL),
    vigencia_inicio: z.string({ required_error: "Informe o início da vigência." }).min(1),
    vigencia_fim: z.string().nullable(),
    status: enumDe(STATUS_CONTRATO_LABEL),
    valor_hora: z.number().min(0).nullable(),
    observacoes: z.string().optional(),
  })
  .refine((v) => v.tipo !== "banco_horas" || v.horas_contratadas !== null, {
    path: ["horas_contratadas"],
    message: "Banco de horas exige as horas contratadas.",
  })
  .refine((v) => !v.vigencia_fim || v.vigencia_fim >= v.vigencia_inicio, {
    path: ["vigencia_fim"],
    message: "O fim não pode ser anterior ao início.",
  });

type Dados = z.infer<typeof esquema>;

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  contrato: ContratoComCliente | null;
  /** Valor/hora atual; undefined quando o usuário não tem acesso aos valores. */
  valorHora: number | null | undefined;
  podeVerValor: boolean;
}

export function FormularioContrato({ aberto, onAbertoChange, contrato, valorHora, podeVerValor }: Props) {
  const { data: clientes } = useClientes();
  const salvar = useSalvarContrato();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    if (!aberto) return;
    form.reset({
      cliente_id: contrato?.cliente_id ?? "",
      nome: contrato?.nome ?? "",
      tipo: contrato?.tipo ?? "banco_horas",
      horas_contratadas: contrato?.horas_contratadas ?? null,
      periodicidade_horas: contrato?.periodicidade_horas ?? "total",
      vigencia_inicio: contrato?.vigencia_inicio,
      vigencia_fim: contrato?.vigencia_fim ?? null,
      status: contrato?.status ?? "ativo",
      valor_hora: valorHora ?? null,
      observacoes: contrato?.observacoes ?? "",
    });
  }, [aberto, contrato, valorHora, form]);

  const opcoesClientes = (clientes ?? [])
    .filter((c) => c.ativo || c.id === contrato?.cliente_id)
    .map((c) => ({ valor: c.id, rotulo: c.nome }));

  const onSalvar = async ({ valor_hora, observacoes, ...v }: Dados) => {
    await salvar.mutateAsync({
      id: contrato?.id,
      dados: { ...v, observacoes: observacoes || null },
      valorHora: podeVerValor ? valor_hora : undefined,
    });
    onAbertoChange(false);
  };

  const c = form.control;
  return (
    <FormularioSheet
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={contrato ? "Editar contrato" : "Novo contrato"}
      descricao="Horas contratadas alimentam o saldo do contrato (Fase 3)."
      form={form}
      onSalvar={onSalvar}
    >
      <CampoSelect control={c} name="cliente_id" label="Cliente" opcoes={opcoesClientes} />
      <CampoTexto control={c} name="nome" label="Nome do contrato" placeholder="Ex.: Banco de horas 2027" />
      <CampoSelect control={c} name="tipo" label="Tipo" opcoes={opcoesDe(TIPO_CONTRATO_LABEL)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoNumero control={c} name="horas_contratadas" label="Horas contratadas" sufixo="h" />
        <CampoSelect
          control={c}
          name="periodicidade_horas"
          label="Periodicidade"
          opcoes={opcoesDe(PERIODICIDADE_LABEL)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoData control={c} name="vigencia_inicio" label="Início da vigência" />
        <CampoData control={c} name="vigencia_fim" label="Fim da vigência" opcional />
      </div>
      <CampoSelect control={c} name="status" label="Status" opcoes={opcoesDe(STATUS_CONTRATO_LABEL)} />
      {podeVerValor && (
        <CampoNumero
          control={c}
          name="valor_hora"
          label="Valor/hora (R$)"
          passo={0.01}
          descricao="Opcional. Visível só para Proprietário e Administrativo."
        />
      )}
      <CampoTextoLongo control={c} name="observacoes" label="Observações" />
    </FormularioSheet>
  );
}
