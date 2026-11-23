import type { Enums } from "@/integrations/supabase/types";

export type Papel = Enums<"papel">;

export const PAPEL_LABEL: Record<Papel, string> = {
  proprietario: "Proprietário",
  lider_tecnico: "Líder técnico",
  desenvolvedor: "Desenvolvedor",
  administrativo: "Administrativo",
};

export const SENIORIDADE_LABEL: Record<Enums<"senioridade">, string> = {
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
};

/** Rota inicial de cada perfil após o login. */
export const ROTA_INICIAL: Record<Papel, string> = {
  desenvolvedor: "/minha-semana",
  lider_tecnico: "/planejamento",
  proprietario: "/planejamento",
  administrativo: "/cadastros/colaboradores",
};
