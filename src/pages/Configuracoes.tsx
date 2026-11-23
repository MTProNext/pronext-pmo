import { Skeleton } from "@/components/ui/skeleton";
import { Pagina } from "@/components/comum/Pagina";
import { FormFaixasAlertas } from "@/components/configuracoes/FormFaixasAlertas";
import { FormFechamento } from "@/components/configuracoes/FormFechamento";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { usePermissao } from "@/hooks/usePermissao";

const Configuracoes = () => {
  const { data: config, isLoading, error } = useConfiguracoes();
  const podeFaixas = usePermissao("editarFaixasEAlertas");
  const podeFechamento = usePermissao("editarFechamento");

  return (
    <Pagina titulo="Configurações" descricao="Parâmetros globais do PMO.">
      {error && <p className="text-sm text-destructive">Erro ao carregar configurações: {error.message}</p>}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {config && (
        <div className="space-y-6">
          <FormFaixasAlertas config={config} podeEditar={podeFaixas} />
          <FormFechamento config={config} podeEditar={podeFechamento} />
        </div>
      )}
    </Pagina>
  );
};

export default Configuracoes;
