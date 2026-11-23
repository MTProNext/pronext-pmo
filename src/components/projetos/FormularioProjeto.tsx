import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CampoData } from "@/components/comum/CampoData";
import { CampoTexto } from "@/components/comum/CamposFormulario";
import { CampoSelect } from "@/components/comum/CampoSelect";
import { FormularioSheet } from "@/components/comum/FormularioSheet";
import { useClientes } from "@/hooks/useClientes";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useContratos } from "@/hooks/useContratos";
import { useSalvarProjeto, type ProjetoDetalhado } from "@/hooks/useProjetos";
import { opcoesDe, STATUS_PROJETO_LABEL } from "@/lib/rotulos";
import { enumDe } from "@/lib/validacao";

const esquema = z
  .object({
    cliente_id: z.string().min(1, "Selecione o cliente."),
    contrato_id: z.string().nullable(),
    nome: z.string().trim().min(1, "Informe o nome do projeto."),
    lider_id: z.string().min(1, "Selecione o líder responsável."),
    status: enumDe(STATUS_PROJETO_LABEL),
    data_inicio_prevista: z.string().nullable(),
    data_fim_prevista: z.string().nullable(),
  })
  .refine(
    (v) => !v.data_inicio_prevista || !v.data_fim_prevista || v.data_fim_prevista >= v.data_inicio_prevista,
    { path: ["data_fim_prevista"], message: "O fim não pode ser anterior ao início." },
  );

type Dados = z.infer<typeof esquema>;

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  projeto: ProjetoDetalhado | null;
}

export function FormularioProjeto({ aberto, onAbertoChange, projeto }: Props) {
  const { data: clientes } = useClientes();
  const { data: contratos } = useContratos();
  const { data: colaboradores } = useColaboradores();
  const salvar = useSalvarProjeto();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });
  const clienteId = form.watch("cliente_id");

  useEffect(() => {
    if (!aberto) return;
    form.reset({
      cliente_id: projeto?.cliente_id ?? "",
      contrato_id: projeto?.contrato_id ?? null,
      nome: projeto?.nome ?? "",
      lider_id: projeto?.lider_id ?? "",
      status: projeto?.status ?? "nao_iniciado",
      data_inicio_prevista: projeto?.data_inicio_prevista ?? null,
      data_fim_prevista: projeto?.data_fim_prevista ?? null,
    });
  }, [aberto, projeto, form]);

  // Contrato precisa ser do cliente escolhido (também validado por trigger no banco).
  const contratosDoCliente = useMemo(
    () => (contratos ?? []).filter((c) => c.cliente_id === clienteId),
    [contratos, clienteId],
  );
  useEffect(() => {
    const contratoId = form.getValues("contrato_id");
    if (contratoId && contratos && !contratosDoCliente.some((c) => c.id === contratoId)) {
      form.setValue("contrato_id", null);
    }
  }, [contratos, contratosDoCliente, form]);

  const opcoesClientes = (clientes ?? [])
    .filter((c) => c.ativo || c.id === projeto?.cliente_id)
    .map((c) => ({ valor: c.id, rotulo: c.nome }));
  const opcoesLideres = (colaboradores ?? [])
    .filter((c) => c.papel === "lider_tecnico" && (c.ativo || c.id === projeto?.lider_id))
    .map((c) => ({ valor: c.id, rotulo: c.nome }));

  const onSalvar = async (dados: Dados) => {
    await salvar.mutateAsync({ id: projeto?.id, dados });
    onAbertoChange(false);
  };

  const c = form.control;
  return (
    <FormularioSheet
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={projeto ? "Editar projeto" : "Novo projeto"}
      descricao="Cadastro mínimo. A ficha completa do projeto vem na Fase 2."
      form={form}
      onSalvar={onSalvar}
    >
      <CampoSelect control={c} name="cliente_id" label="Cliente" opcoes={opcoesClientes} />
      <CampoSelect
        control={c}
        name="contrato_id"
        label="Contrato"
        rotuloNenhum="Sem contrato"
        desabilitado={!clienteId}
        opcoes={contratosDoCliente.map((ct) => ({ valor: ct.id, rotulo: ct.nome }))}
      />
      <CampoTexto control={c} name="nome" label="Nome do projeto" />
      <CampoSelect
        control={c}
        name="lider_id"
        label="Líder responsável"
        descricao="Um único líder accountable pelo projeto."
        opcoes={opcoesLideres}
      />
      <CampoSelect control={c} name="status" label="Status" opcoes={opcoesDe(STATUS_PROJETO_LABEL)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoData control={c} name="data_inicio_prevista" label="Início previsto" opcional />
        <CampoData control={c} name="data_fim_prevista" label="Fim previsto" opcional />
      </div>
    </FormularioSheet>
  );
}
