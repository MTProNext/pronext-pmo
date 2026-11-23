import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

/** Formulário curto em Dialog (react-hook-form + zod). Use para cadastros simples. */
export function FormularioDialog<T extends FieldValues>({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  form,
  onSalvar,
  rotuloSalvar,
  children,
}: Props<T>) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSalvar)} className="space-y-4">
            {children}
            <DialogFooter>
              <BotoesFormulario
                enviando={form.formState.isSubmitting}
                onCancelar={() => onAbertoChange(false)}
                rotuloSalvar={rotuloSalvar}
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
