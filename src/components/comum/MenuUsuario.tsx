import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessao } from "@/hooks/useSessao";
import { PAPEL_LABEL } from "@/lib/papeis";

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** Menu do usuário no cabeçalho: nome, perfil e sair. */
export function MenuUsuario() {
  const { colaborador, sair } = useSessao();
  if (!colaborador) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{iniciais(colaborador.nome)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{colaborador.nome}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{colaborador.nome}</div>
          <div className="text-xs text-muted-foreground">{PAPEL_LABEL[colaborador.papel]}</div>
          <div className="text-xs text-muted-foreground">{colaborador.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={sair}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
