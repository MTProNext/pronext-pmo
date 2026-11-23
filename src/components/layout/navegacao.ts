import { CalendarCheck, CalendarRange, ListTodo, Users, type LucideIcon } from "lucide-react";
import type { Papel } from "@/lib/papeis";

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
        papeis: ["proprietario", "administrativo", "lider_tecnico"],
      },
    ],
  },
];

/** Papéis permitidos em uma rota do menu. */
export const papeisDaRota = (rota: string): Papel[] =>
  NAVEGACAO.flatMap((g) => g.itens).find((i) => i.rota === rota)?.papeis ?? [];
