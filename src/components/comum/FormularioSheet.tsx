import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { BotoesFormulario } from "./BotoesFormulario";

interface Props<T extends FieldValues> {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  titulo: string;
  descricao?: string;
  form: UseFormReturn<T>;
  onSalvar: (dados: T) => Promise<void> | void;
  rotuloSalvar?: string;
  /** Campos do formulário (FormField do shadcn). */
  children: ReactNode;
}

/** Formulário longo em Sheet lateral (react-hook-form + zod). Use para registros com muitos campos. */
export function FormularioSheet<T extends FieldValues>({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  form,
  onSalvar,
  rotuloSalvar,
  children,
}: Props<T>) {
  // Erros de gravação já viram toast no hook de mutação; o formulário continua aberto.
  const salvarComSeguranca = async (dados: T) => {
    try {
      await onSalvar(dados);
    } catch {
      /* mensagem já exibida */
    }
  };

  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{titulo}</SheetTitle>
          {descricao && <SheetDescription>{descricao}</SheetDescription>}
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(salvarComSeguranca)} className="mt-6 space-y-4">
            {children}
            <SheetFooter className="gap-2 pt-2">
              <BotoesFormulario
                enviando={form.formState.isSubmitting}
                onCancelar={() => onAbertoChange(false)}
                rotuloSalvar={rotuloSalvar}
              />
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
