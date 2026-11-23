import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/comum/EstadoVazio";

const NotFound = () => (
  <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <EstadoVazio
      icone={FileQuestion}
      titulo="Página não encontrada"
      descricao="O endereço acessado não existe."
      acao={
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      }
    />
  </main>
);

export default NotFound;
