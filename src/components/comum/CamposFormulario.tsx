import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/** Props comuns aos campos de formulário (FormField do shadcn + react-hook-form). */
export interface CampoBaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  descricao?: string;
  desabilitado?: boolean;
}

export function CampoTexto<T extends FieldValues>({
  control,
  name,
  label,
  descricao,
  desabilitado,
  placeholder,
}: CampoBaseProps<T> & { placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} placeholder={placeholder} disabled={desabilitado} />
          </FormControl>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CampoTextoLongo<T extends FieldValues>({
  control,
  name,
  label,
  descricao,
  desabilitado,
}: CampoBaseProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value ?? ""} rows={3} disabled={desabilitado} />
          </FormControl>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Número decimal. Campo vazio vira null (ex.: "a definir"). */
export function CampoNumero<T extends FieldValues>({
  control,
  name,
  label,
  descricao,
  desabilitado,
  sufixo,
  passo = 0.5,
}: CampoBaseProps<T> & { sufixo?: string; passo?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                type="number"
                inputMode="decimal"
                step={passo}
                min={0}
                disabled={desabilitado}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            {sufixo && <span className="text-sm text-muted-foreground">{sufixo}</span>}
          </div>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CampoSwitch<T extends FieldValues>({
  control,
  name,
  label,
  descricao,
  desabilitado,
}: CampoBaseProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            {descricao && <FormDescription>{descricao}</FormDescription>}
          </div>
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={desabilitado} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
