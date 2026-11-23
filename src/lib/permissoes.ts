import type { Papel } from "./papeis";

/**
 * Espelho das políticas RLS, usado só para mostrar/ocultar botões e campos.
 * A regra que vale é a do banco (supabase/migrations).
 */
export const PERMISSOES = {
  editarClientes: ["proprietario", "administrativo", "lider_tecnico"],
  editarContratos: ["proprietario", "administrativo"],
  verValoresContratos: ["proprietario", "administrativo"],
  editarProjetos: ["proprietario", "lider_tecnico"],
  editarIndisponibilidades: ["proprietario", "lider_tecnico", "administrativo"],
  editarDemandas: ["proprietario", "lider_tecnico"],
  editarFaixasEAlertas: ["proprietario", "lider_tecnico"],
  editarFechamento: ["proprietario", "administrativo"],
} satisfies Record<string, Papel[]>;

export type Acao = keyof typeof PERMISSOES;

export const pode = (papel: Papel | undefined, acao: Acao) =>
  !!papel && (PERMISSOES[acao] as Papel[]).includes(papel);
