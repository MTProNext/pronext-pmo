import { NavLink, useLocation } from "react-router-dom";
import { Briefcase } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useContagemPendentes } from "@/hooks/useAprovacoes";
import { usePermissao } from "@/hooks/usePermissao";
import { useSessao } from "@/hooks/useSessao";
import { NAVEGACAO } from "./navegacao";

/** Menu lateral recolhível (modo ícone), filtrado pelo perfil do usuário. */
export function AppSidebar() {
  const { colaborador } = useSessao();
  const { pathname } = useLocation();
  const podeAprovar = usePermissao("aprovarHoras");
  const { data: pendentes } = useContagemPendentes(podeAprovar);
  if (!colaborador) return null;

  const grupos = NAVEGACAO.map((g) => ({
    ...g,
    itens: g.itens.filter((i) => i.papeis.includes(colaborador.papel)),
  })).filter((g) => g.itens.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Briefcase className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PMO ProNext</span>
                  <span className="truncate text-xs">Capacidade, horas e projetos</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo}>
            <SidebarGroupLabel>{grupo.titulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) => (
                  <SidebarMenuItem key={item.rota}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.titulo}
                      isActive={pathname === item.rota || pathname.startsWith(`${item.rota}/`)}
                    >
                      <NavLink to={item.rota}>
                        <item.icone />
                        <span>{item.titulo}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {item.rota === "/aprovacoes" && !!pendentes && (
                      <SidebarMenuBadge aria-label={`${pendentes} aguardando aprovação`}>{pendentes}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
