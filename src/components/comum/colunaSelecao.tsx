import { Checkbox } from "@/components/ui/checkbox";
import type { Coluna } from "./TabelaDados";

interface Opcoes<T> {
  dados: T[];
  chaveLinha: (linha: T) => string;
  selecionados: Set<string>;
  onChange: (selecionados: Set<string>) => void;
}

/** Primeira coluna de uma TabelaDados com seleção em lote (checkbox por linha e "todos"). */
export function colunaSelecao<T>({ dados, chaveLinha, selecionados, onChange }: Opcoes<T>): Coluna<T> {
  const todos = dados.length > 0 && dados.every((d) => selecionados.has(chaveLinha(d)));
  const alguns = !todos && dados.some((d) => selecionados.has(chaveLinha(d)));

  const alternar = (id: string, marcado: boolean) => {
    const novo = new Set(selecionados);
    if (marcado) novo.add(id);
    else novo.delete(id);
    onChange(novo);
  };

  return {
    chave: "selecao",
    className: "w-10",
    titulo: (
      <Checkbox
        aria-label="Selecionar todos"
        checked={todos ? true : alguns ? "indeterminate" : false}
        onCheckedChange={(v) => onChange(v ? new Set(dados.map(chaveLinha)) : new Set())}
      />
    ),
    celula: (linha) => (
      <Checkbox
        aria-label="Selecionar"
        checked={selecionados.has(chaveLinha(linha))}
        onCheckedChange={(v) => alternar(chaveLinha(linha), !!v)}
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };
}
