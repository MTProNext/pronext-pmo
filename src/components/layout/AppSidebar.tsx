import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSessao } from "@/hooks/useSessao";
import { PAPEL_LABEL } from "@/lib/papeis";
import { NAVEGACAO } from "./navegacao";

export function AppSidebar() {
  const { colaborador, sair } = useSessao();
  if (!colaborador) return null;

  const grupos = NAVEGACAO.map((g) => ({
    ...g,
    itens: g.itens.filter((i) => i.papeis.includes(colaborador.papel)),
  })).filter((g) => g.itens.length > 0);

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <span className="text-lg font-semibold">PMO ProNext</span>
      </SidebarHeader>
      <SidebarContent>
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo}>
            <SidebarGroupLabel>{grupo.titulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) => (
                  <SidebarMenuItem key={item.rota}>
                    <NavLink to={item.rota}>
                      {({ isActive }) => (
                        <SidebarMenuButton isActive={isActive}>
                          <item.icone />
                          <span>{item.titulo}</span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-3">
        <div className="text-sm font-medium">{colaborador.nome}</div>
        <div className="text-xs text-muted-foreground">{PAPEL_LABEL[colaborador.papel]}</div>
        <button
          onClick={sair}
          className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
