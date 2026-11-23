import { CabecalhoPagina } from "@/components/layout/CabecalhoPagina";
import { Carregando } from "@/components/auth/Carregando";
import { TabelaColaboradores } from "@/components/colaboradores/TabelaColaboradores";
import { useColaboradores } from "@/hooks/useColaboradores";

const Colaboradores = () => {
  const { data, isLoading, error } = useColaboradores();

  return (
    <>
      <CabecalhoPagina
        titulo="Colaboradores"
        descricao="Pessoas da operação, perfis de acesso e horas disponíveis para desenvolvimento."
      />
      {isLoading && <Carregando />}
      {error && <p className="text-destructive">Erro ao carregar colaboradores: {error.message}</p>}
      {data && <TabelaColaboradores colaboradores={data} />}
    </>
  );
};

export default Colaboradores;
