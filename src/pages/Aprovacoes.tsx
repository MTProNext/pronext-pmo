import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { BlocoSemanaNaoEnviada } from "@/components/aprovacoes/BlocoSemanaNaoEnviada";
import { ListaAprovadas } from "@/components/aprovacoes/ListaAprovadas";
import { ListaPendentes } from "@/components/aprovacoes/ListaPendentes";
import { usePendentesAprovacao } from "@/hooks/useAprovacoes";

/** /aprovacoes — líder (equipe e demandas) e Proprietário (horas de líderes). */
const Aprovacoes = () => {
  const { data } = usePendentesAprovacao();

  return (
    <Pagina
      titulo="Aprovações de horas"
      descricao="Valide atividade, esforço e classificação. Você aprova horas da sua equipe e das suas demandas, nunca as suas."
    >
      <BlocoSemanaNaoEnviada />
      <SecaoCard>
        <Tabs defaultValue="pendentes">
          <TabsList>
            <TabsTrigger value="pendentes">Aguardando aprovação ({data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="aprovadas">Aprovadas recentes</TabsTrigger>
          </TabsList>
          <TabsContent value="pendentes" className="mt-4">
            <ListaPendentes />
          </TabsContent>
          <TabsContent value="aprovadas" className="mt-4">
            <ListaAprovadas />
          </TabsContent>
        </Tabs>
      </SecaoCard>
    </Pagina>
  );
};

export default Aprovacoes;
