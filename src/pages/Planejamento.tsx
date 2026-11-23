import { CabecalhoPagina } from "@/components/layout/CabecalhoPagina";
import { EmConstrucao } from "@/components/layout/EmConstrucao";

const Planejamento = () => (
  <>
    <CabecalhoPagina
      titulo="Planejamento semanal"
      descricao="Grade de demandas × colaboradores e capacidade efetiva da semana."
    />
    <EmConstrucao etapa="etapa 4 da Fase 1" />
  </>
);

export default Planejamento;
