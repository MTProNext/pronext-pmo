import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CampoTextoLongo } from "./CamposFormulario";
import { FormularioDialog } from "./FormularioDialog";

const esquema = z.object({ motivo: z.string().trim().min(5, "Explique o motivo (mínimo 5 caracteres).") });
type Dados = z.infer<typeof esquema>;

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  titulo: string;
  descricao?: string;
  rotuloSalvar: string;
  onConfirmar: (motivo: string) => Promise<void>;
}

/** Diálogo que pede um motivo obrigatório (devolver, reabrir, rejeitar...). */
export function DialogMotivo({ aberto, onAbertoChange, titulo, descricao, rotuloSalvar, onConfirmar }: Props) {
  const form = useForm<Dados>({ resolver: zodResolver(esquema), defaultValues: { motivo: "" } });

  useEffect(() => {
    if (aberto) form.reset({ motivo: "" });
  }, [aberto, form]);

  return (
    <FormularioDialog
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={titulo}
      descricao={descricao}
      form={form}
      rotuloSalvar={rotuloSalvar}
      onSalvar={async ({ motivo }) => {
        await onConfirmar(motivo);
        onAbertoChange(false);
      }}
    >
      <CampoTextoLongo control={form.control} name="motivo" label="Motivo" descricao="O autor verá este motivo." />
    </FormularioDialog>
  );
}
