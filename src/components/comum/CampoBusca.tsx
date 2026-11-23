import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

/** Campo de busca textual para a barra de filtros. */
export function CampoBusca({ valor, onChange, placeholder = "Buscar..." }: Props) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
