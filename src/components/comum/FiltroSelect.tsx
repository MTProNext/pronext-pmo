import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TODOS = "todos";

export interface OpcaoFiltro {
  valor: string;
  rotulo: string;
}

interface Props {
  valor: string;
  onChange: (valor: string) => void;
  opcoes: OpcaoFiltro[];
  /** Rótulo da opção que desliga o filtro (valor TODOS). */
  rotuloTodos: string;
}

/** Filtro de seleção única. O valor TODOS significa "sem filtro". */
export function FiltroSelect({ valor, onChange, opcoes, rotuloTodos }: Props) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{rotuloTodos}</SelectItem>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
