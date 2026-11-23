import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Carregando } from "@/components/comum/Carregando";

const esquema = z
  .object({
    senha: z.string().min(8, "Use pelo menos 8 caracteres."),
    confirmacao: z.string(),
  })
  .refine((v) => v.senha === v.confirmacao, { path: ["confirmacao"], message: "As senhas não conferem." });

type Dados = z.infer<typeof esquema>;

/** Destino do link de redefinição de senha (o Supabase abre a sessão pelo link). */
const RedefinirSenha = () => {
  const { session, carregando } = useSessao();
  const navigate = useNavigate();
  const form = useForm<Dados>({ resolver: zodResolver(esquema), defaultValues: { senha: "", confirmacao: "" } });

  const salvar = async ({ senha }: Dados) => {
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      toast.error(`Não foi possível alterar a senha: ${error.message}`);
      return;
    }
    toast.success("Senha alterada.");
    navigate("/", { replace: true });
  };

  if (carregando) return <Carregando />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Nova senha</CardTitle>
          <CardDescription>
            {session ? "Defina sua nova senha de acesso." : "Link inválido ou expirado. Solicite um novo na tela de login."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(salvar)} className="space-y-4">
                {(["senha", "confirmacao"] as const).map((nome) => (
                  <FormField
                    key={nome}
                    control={form.control}
                    name={nome}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{nome === "senha" ? "Nova senha" : "Confirme a nova senha"}</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar nova senha
                </Button>
              </form>
            </Form>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              Ir para o login
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default RedefinirSenha;
