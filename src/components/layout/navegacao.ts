import {
  Building2,
  CalendarCheck,
  CalendarOff,
  CalendarRange,
  FileText,
  FolderKanban,
  ListTodo,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Papel } from "@/lib/papeis";

/** Perfis de gestão: veem cadastros e configurações (o que cada um edita está em lib/permissoes.ts). */
const GESTAO: Papel[] = ["proprietario", "lider_tecnico", "administrativo"];

export interface ItemNavegacao {
  titulo: string;
  rota: string;
  icone: LucideIcon;
  papeis: Papel[];
}

export interface GrupoNavegacao {
  titulo: string;
  itens: ItemNavegacao[];
}

/** Menu lateral. Os papéis de cada item também protegem a rota em App.tsx. */
export const NAVEGACAO: GrupoNavegacao[] = [
  {
    titulo: "Operação",
    itens: [
      {
        titulo: "Minha semana",
        rota: "/minha-semana",
        icone: CalendarCheck,
        papeis: ["desenvolvedor", "lider_tecnico"],
      },
      {
        titulo: "Planejamento",
        rota: "/planejamento",
        icone: CalendarRange,
        papeis: ["lider_tecnico", "proprietario", "administrativo"],
      },
      {
        titulo: "Backlog",
        rota: "/backlog",
        icone: ListTodo,
        papeis: ["lider_tecnico", "proprietario", "administrativo", "desenvolvedor"],
      },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      {
        titulo: "Colaboradores",
        rota: "/cadastros/colaboradores",
        icone: Users,
        papeis: GESTAO,
      },
      { titulo: "Clientes", rota: "/cadastros/clientes", icone: Building2, papeis: GESTAO },
      { titulo: "Contratos", rota: "/cadastros/contratos", icone: FileText, papeis: GESTAO },
      { titulo: "Projetos", rota: "/cadastros/projetos", icone: FolderKanban, papeis: GESTAO },
      {
        titulo: "Indisponibilidades",
        rota: "/cadastros/indisponibilidades",
        icone: CalendarOff,
        papeis: GESTAO,
      },
    ],
  },
  {
    titulo: "Administração",
    itens: [{ titulo: "Configurações", rota: "/configuracoes", icone: Settings, papeis: GESTAO }],
  },
];

/** Papéis permitidos em uma rota do menu. */
export const papeisDaRota = (rota: string): Papel[] =>
  NAVEGACAO.flatMap((g) => g.itens).find((i) => i.rota === rota)?.papeis ?? [];

/** Grupo e item do menu correspondentes ao caminho atual (inclui sub-rotas, ex.: /backlog/123). */
export function encontrarNavegacao(caminho: string) {
  for (const grupo of NAVEGACAO) {
    const item = grupo.itens.find((i) => caminho === i.rota || caminho.startsWith(`${i.rota}/`));
    if (item) return { grupo, item };
  }
  return null;
}
