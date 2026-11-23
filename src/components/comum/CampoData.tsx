import type { FieldValues } from "react-hook-form";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, paraDataISO, parseData } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampoBaseProps } from "./CamposFormulario";

/** Data em Popover + Calendar. O valor do formulário é "aaaa-mm-dd" ou null. */
export function CampoData<T extends FieldValues>({
  control,
  name,
  label,
  descricao,
  desabilitado,
  opcional,
}: CampoBaseProps<T> & { opcional?: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <div className="flex gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    disabled={desabilitado}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? formatDate(field.value) : "dd/mm/aaaa"}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={field.value ? parseData(field.value) : undefined}
                  defaultMonth={field.value ? parseData(field.value) : undefined}
                  onSelect={(d) => field.onChange(d ? paraDataISO(d) : null)}
                />
              </PopoverContent>
            </Popover>
            {opcional && field.value && !desabilitado && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Limpar data"
                onClick={() => field.onChange(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
