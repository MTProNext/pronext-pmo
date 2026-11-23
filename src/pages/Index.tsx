import { Navigate } from "react-router-dom";
import { useSessao } from "@/hooks/useSessao";
import { ROTA_INICIAL } from "@/lib/papeis";
import { Carregando } from "@/components/comum/Carregando";

/** Rota "/": redireciona para a tela inicial do perfil. */
const Index = () => {
  const { session, colaborador, carregando } = useSessao();

  if (carregando) return <Carregando />;
  if (!session) return <Navigate to="/login" replace />;
  if (!colaborador) return <Navigate to="/acesso-nao-configurado" replace />;
  return <Navigate to={ROTA_INICIAL[colaborador.papel]} replace />;
};

export default Index;
