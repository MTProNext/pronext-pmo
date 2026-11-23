import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RotaProtegida } from "@/components/auth/RotaProtegida";
import { AppLayout } from "@/components/layout/AppLayout";
import { papeisDaRota } from "@/components/layout/navegacao";
import { SessaoProvider } from "@/hooks/useSessao";
import AcessoNaoConfigurado from "@/pages/AcessoNaoConfigurado";
import Backlog from "@/pages/Backlog";
import Clientes from "@/pages/cadastros/Clientes";
import Colaboradores from "@/pages/cadastros/Colaboradores";
import Contratos from "@/pages/cadastros/Contratos";
import Indisponibilidades from "@/pages/cadastros/Indisponibilidades";
import Projetos from "@/pages/cadastros/Projetos";
import Configuracoes from "@/pages/Configuracoes";
import DemandaDetalhe from "@/pages/DemandaDetalhe";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import MinhaSemana from "@/pages/MinhaSemana";
import NotFound from "@/pages/NotFound";
import Planejamento from "@/pages/Planejamento";
import RedefinirSenha from "@/pages/RedefinirSenha";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

/**
 * Rotas internas, protegidas pelos papéis do item de menu (`menu`, padrão = o próprio caminho).
 * Sub-rotas (ex.: detalhe) usam `menu` para herdar os papéis da tela principal.
 */
const ROTAS: { caminho: string; pagina: JSX.Element; menu?: string }[] = [
  { caminho: "/minha-semana", pagina: <MinhaSemana /> },
  { caminho: "/planejamento", pagina: <Planejamento /> },
  { caminho: "/backlog", pagina: <Backlog /> },
  { caminho: "/backlog/:id", pagina: <DemandaDetalhe />, menu: "/backlog" },
  { caminho: "/cadastros/colaboradores", pagina: <Colaboradores /> },
  { caminho: "/cadastros/clientes", pagina: <Clientes /> },
  { caminho: "/cadastros/contratos", pagina: <Contratos /> },
  { caminho: "/cadastros/projetos", pagina: <Projetos /> },
  { caminho: "/cadastros/indisponibilidades", pagina: <Indisponibilidades /> },
  { caminho: "/configuracoes", pagina: <Configuracoes /> },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessaoProvider>
      <TooltipProvider>
        <Toaster richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/acesso-nao-configurado" element={<AcessoNaoConfigurado />} />
            <Route element={<RotaProtegida />}>
              <Route element={<AppLayout />}>
                {ROTAS.map(({ caminho, pagina, menu }) => (
                  <Route
                    key={caminho}
                    element={<RotaProtegida papeis={papeisDaRota(menu ?? caminho)} />}
                  >
                    <Route path={caminho} element={pagina} />
                  </Route>
                ))}
              </Route>
            </Route>
            {/* Adicione rotas acima da rota coringa "*" */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SessaoProvider>
  </QueryClientProvider>
);

export default App;
