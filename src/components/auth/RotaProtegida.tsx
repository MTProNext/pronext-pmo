import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessao } from "@/hooks/useSessao";
import { ROTA_INICIAL, type Papel } from "@/lib/papeis";
import { Carregando } from "@/components/comum/Carregando";

interface Props {
  /** Perfis que podem acessar. Omitido = qualquer colaborador ativo. */
  papeis?: Papel[];
}

/**
 * Controle de navegação por perfil. É só interface: a segurança real
 * dos dados está nas políticas RLS do banco.
 */
export function RotaProtegida({ papeis }: Props) {
  const { session, colaborador, carregando } = useSessao();
  const location = useLocation();

  if (carregando) return <Carregando />;
  if (!session) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  if (!colaborador) return <Navigate to="/acesso-nao-configurado" replace />;
  if (papeis && !papeis.includes(colaborador.papel)) {
    return <Navigate to={ROTA_INICIAL[colaborador.papel]} replace />;
  }
  return <Outlet />;
}
