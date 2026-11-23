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
import Colaboradores from "@/pages/cadastros/Colaboradores";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import MinhaSemana from "@/pages/MinhaSemana";
import NotFound from "@/pages/NotFound";
import Planejamento from "@/pages/Planejamento";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

/** Rotas internas: cada uma protegida pelos papéis definidos no menu. */
const ROTAS = [
  { caminho: "/minha-semana", pagina: <MinhaSemana /> },
  { caminho: "/planejamento", pagina: <Planejamento /> },
  { caminho: "/backlog", pagina: <Backlog /> },
  { caminho: "/cadastros/colaboradores", pagina: <Colaboradores /> },
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
            <Route path="/acesso-nao-configurado" element={<AcessoNaoConfigurado />} />
            <Route element={<RotaProtegida />}>
              <Route element={<AppLayout />}>
                {ROTAS.map(({ caminho, pagina }) => (
                  <Route
                    key={caminho}
                    element={<RotaProtegida papeis={papeisDaRota(caminho)} />}
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
