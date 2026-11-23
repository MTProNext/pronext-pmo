import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CampoSwitch, CampoTexto } from "@/components/comum/CamposFormulario";
import { FormularioDialog } from "@/components/comum/FormularioDialog";
import { useSalvarCliente, type Cliente } from "@/hooks/useClientes";

const esquema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  documento: z.string().trim().optional(),
  contato: z.string().trim().optional(),
  ativo: z.boolean(),
});

type Dados = z.infer<typeof esquema>;

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** Cliente em edição; null para novo. */
  cliente: Cliente | null;
}

export function FormularioCliente({ aberto, onAbertoChange, cliente }: Props) {
  const salvar = useSalvarCliente();
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    if (aberto) {
      form.reset({
        nome: cliente?.nome ?? "",
        documento: cliente?.documento ?? "",
        contato: cliente?.contato ?? "",
        ativo: cliente?.ativo ?? true,
      });
    }
  }, [aberto, cliente, form]);

  const onSalvar = async (v: Dados) => {
    await salvar.mutateAsync({
      id: cliente?.id,
      dados: { nome: v.nome, documento: v.documento || null, contato: v.contato || null, ativo: v.ativo },
    });
    onAbertoChange(false);
  };

  return (
    <FormularioDialog
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={cliente ? "Editar cliente" : "Novo cliente"}
      form={form}
      onSalvar={onSalvar}
    >
      <CampoTexto control={form.control} name="nome" label="Nome" />
      <CampoTexto control={form.control} name="documento" label="Documento" placeholder="CNPJ (opcional)" />
      <CampoTexto
        control={form.control}
        name="contato"
        label="Contato"
        placeholder="Nome e e-mail ou telefone (opcional)"
      />
      <CampoSwitch
        control={form.control}
        name="ativo"
        label="Cliente ativo"
        descricao="Clientes inativos não aparecem nas novas demandas e contratos."
      />
    </FormularioDialog>
  );
}
