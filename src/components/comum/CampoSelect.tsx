import type { FieldValues } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CampoBaseProps } from "./CamposFormulario";

/** Valor interno da opção "nenhum" (o Select do Radix não aceita string vazia). */
const NENHUM = "__nenhum__";

interface Props<T extends FieldValues> extends CampoBaseProps<T> {
  opcoes: { valor: string; rotulo: string }[];
  placeholder?: string;
  /** Se informado, adiciona uma opção que grava null (ex.: "Sem contrato"). */
  rotuloNenhum?: string;
}

/** Select de formulário. Com rotuloNenhum, o campo aceita null. */
export function CampoSelect<T extends FieldValues>({
  control,
  name,
  label,
  descricao,
  desabilitado,
  opcoes,
  placeholder = "Selecione",
  rotuloNenhum,
}: Props<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value ?? (rotuloNenhum ? NENHUM : "")}
            onValueChange={(v) => field.onChange(v === NENHUM ? null : v)}
            disabled={desabilitado}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {rotuloNenhum && <SelectItem value={NENHUM}>{rotuloNenhum}</SelectItem>}
              {opcoes.map((o) => (
                <SelectItem key={o.valor} value={o.valor}>
                  {o.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
