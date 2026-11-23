import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  /** Rótulo do botão que fecha sem confirmar (use "Voltar" quando a ação também se chama "Cancelar..."). */
  rotuloCancelar?: string;
  /** Destaca o botão como ação destrutiva (cancelar, inativar...). */
  destrutivo?: boolean;
  onConfirmar: () => void;
}

/** Confirmação antes de ações irreversíveis ou relevantes. */
export function ConfirmacaoDialog({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  rotuloConfirmar = "Confirmar",
  rotuloCancelar = "Cancelar",
  destrutivo,
  onConfirmar,
}: Props) {
  return (
    <AlertDialog open={aberto} onOpenChange={onAbertoChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{rotuloCancelar}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className={destrutivo ? buttonVariants({ variant: "destructive" }) : undefined}
          >
            {rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
