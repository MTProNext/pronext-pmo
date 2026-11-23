import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CampoSelect } from "@/components/comum/CampoSelect";
import { useClientes } from "@/hooks/useClientes";
import { useContratos } from "@/hooks/useContratos";
import { useProjetos } from "@/hooks/useProjetos";
import type { DadosFormDemanda } from "./esquemaDemanda";

interface Props {
  form: UseFormReturn<DadosFormDemanda>;
}

/**
 * Cliente → projeto → contrato, em cascata. Sem cliente = Interno.
 * O contrato vem do projeto quando ele tem um (o banco também garante).
 */
export function CamposVinculoDemanda({ form }: Props) {
  const { data: clientes } = useClientes();
  const { data: projetos } = useProjetos();
  const { data: contratos } = useContratos();
  const [tipo, clienteId, projetoId] = form.watch(["tipo", "cliente_id", "projeto_id"]);

  const projetosDoCliente = useMemo(
    () => (projetos ?? []).filter((p) => p.cliente_id === clienteId),
    [projetos, clienteId],
  );
  const contratosDoCliente = useMemo(
    () => (contratos ?? []).filter((c) => c.cliente_id === clienteId),
    [contratos, clienteId],
  );
  const projeto = projetosDoCliente.find((p) => p.id === projetoId);

  // Atividade interna nunca tem cliente.
  useEffect(() => {
    if (tipo === "atividade_interna" && form.getValues("cliente_id")) form.setValue("cliente_id", null);
  }, [tipo, form]);

  // Trocar de cliente limpa projeto e contrato que não forem dele.
  useEffect(() => {
    if (!projetos || !contratos) return;
    const { projeto_id, contrato_id } = form.getValues();
    if (projeto_id && !projetosDoCliente.some((p) => p.id === projeto_id)) form.setValue("projeto_id", null);
    if (contrato_id && !contratosDoCliente.some((c) => c.id === contrato_id)) form.setValue("contrato_id", null);
  }, [projetos, contratos, projetosDoCliente, contratosDoCliente, form]);

  // Projeto escolhido: herda o contrato e sugere o líder do projeto.
  useEffect(() => {
    if (!projeto) return;
    if (projeto.contrato_id) form.setValue("contrato_id", projeto.contrato_id);
    if (!form.getValues("lider_id")) form.setValue("lider_id", projeto.lider_id);
  }, [projeto, form]);

  const c = form.control;
  return (
    <>
      <CampoSelect
        control={c}
        name="cliente_id"
        label="Cliente"
        rotuloNenhum="Interno (sem cliente)"
        desabilitado={tipo === "atividade_interna"}
        opcoes={(clientes ?? [])
          .filter((cl) => cl.ativo || cl.id === clienteId)
          .map((cl) => ({ valor: cl.id, rotulo: cl.nome }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          control={c}
          name="projeto_id"
          label="Projeto"
          rotuloNenhum="Sem projeto"
          desabilitado={!clienteId}
          opcoes={projetosDoCliente.map((p) => ({ valor: p.id, rotulo: p.nome }))}
        />
        <CampoSelect
          control={c}
          name="contrato_id"
          label="Contrato"
          rotuloNenhum="Sem contrato"
          desabilitado={!clienteId || !!projeto?.contrato_id}
          descricao={projeto?.contrato_id ? "Definido pelo projeto." : undefined}
          opcoes={contratosDoCliente.map((ct) => ({ valor: ct.id, rotulo: ct.nome }))}
        />
      </div>
    </>
  );
}
