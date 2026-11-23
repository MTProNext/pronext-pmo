import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { traduzirErro } from "@/lib/erros";

interface Opcoes {
  /** Queries a recarregar após o sucesso. */
  invalidar: QueryKey[];
  /** Mensagem do toast de sucesso. */
  sucesso: string;
}

/** Mutação padrão: toast de sucesso/erro (traduzido) e invalidação das queries. */
export function useMutacao<TVariaveis>(
  executar: (variaveis: TVariaveis) => Promise<void>,
  { invalidar, sucesso }: Opcoes,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executar,
    onSuccess: () => {
      invalidar.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success(sucesso);
    },
    onError: (erro: { code?: string; message: string }) => {
      toast.error(traduzirErro(erro));
    },
  });
}
