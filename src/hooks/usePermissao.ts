import { pode, type Acao } from "@/lib/permissoes";
import { useSessao } from "./useSessao";

/** O usuário logado pode executar a ação? (só interface; a RLS decide de fato) */
export function usePermissao(acao: Acao) {
  const { colaborador } = useSessao();
  return pode(colaborador?.papel, acao);
}
