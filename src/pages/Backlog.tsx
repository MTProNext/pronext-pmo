import { Construction } from "lucide-react";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";

const Backlog = () => (
  <Pagina titulo="Backlog de demandas" descricao="Demandas registradas, prioridades e responsáveis.">
    <SecaoCard>
      <EstadoVazio
        icone={Construction}
        titulo="Tela em construção"
        descricao="Disponível na etapa 3 da Fase 1 (backlog)."
      />
    </SecaoCard>
  </Pagina>
);

export default Backlog;
