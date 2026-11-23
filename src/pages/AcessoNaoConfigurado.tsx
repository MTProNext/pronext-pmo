import { Navigate } from "react-router-dom";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Usuário autenticado sem colaborador ativo vinculado ao seu e-mail. */
const AcessoNaoConfigurado = () => {
  const { session, colaborador, sair } = useSessao();

  if (!session) return <Navigate to="/login" replace />;
  if (colaborador) return <Navigate to="/" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acesso não configurado</CardTitle>
          <CardDescription>
            O e-mail {session.user.email} não está vinculado a um colaborador ativo. Peça ao
            Administrativo para cadastrar você.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={sair}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AcessoNaoConfigurado;
