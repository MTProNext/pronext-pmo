import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CampoTexto } from "@/components/comum/CamposFormulario";
import { FormularioDialog } from "@/components/comum/FormularioDialog";

const esquema = z.object({ email: z.string().trim().email() });
type Dados = z.infer<typeof esquema>;

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  emailInicial: string;
}

/** Envia o e-mail de redefinição de senha (link leva a /redefinir-senha). */
export function EsqueciSenhaDialog({ aberto, onAbertoChange, emailInicial }: Props) {
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    if (aberto) form.reset({ email: emailInicial });
  }, [aberto, emailInicial, form]);

  const enviar = async ({ email }: Dados) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) {
      toast.error(`Não foi possível enviar o e-mail: ${error.message}`);
      return;
    }
    toast.success("Se o e-mail estiver cadastrado, você receberá o link para criar uma nova senha.");
    onAbertoChange(false);
  };

  return (
    <FormularioDialog
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo="Esqueci a senha"
      descricao="Informe seu e-mail para receber o link de redefinição."
      form={form}
      onSalvar={enviar}
      rotuloSalvar="Enviar link"
    >
      <CampoTexto control={form.control} name="email" label="E-mail" />
    </FormularioDialog>
  );
}
