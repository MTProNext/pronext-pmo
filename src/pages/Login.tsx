import { Navigate, useLocation, useNavigate } from "react-router-dom";
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

const esquema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

type Dados = z.infer<typeof esquema>;

const Login = () => {
  const { session } = useSessao();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { de?: string } | null)?.de ?? "/";

  const form = useForm<Dados>({
    resolver: zodResolver(esquema),
    defaultValues: { email: "", senha: "" },
  });

  if (session) return <Navigate to={destino} replace />;

  const entrar = async ({ email, senha }: Dados) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha inválidos."
          : `Não foi possível entrar: ${error.message}`,
      );
      return;
    }
    navigate(destino, { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">PMO ProNext</CardTitle>
          <CardDescription>Entre com seu e-mail e senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(entrar)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;
