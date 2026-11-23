import { Construction } from "lucide-react";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { Pagina } from "@/components/comum/Pagina";
import { SecaoCard } from "@/components/comum/SecaoCard";

const MinhaSemana = () => (
  <Pagina titulo="Minha semana" descricao="Sua programação da semana publicada.">
    <SecaoCard>
      <EstadoVazio
        icone={Construction}
        titulo="Tela em construção"
        descricao="Disponível na etapa 4 da Fase 1 (planejamento semanal)."
      />
    </SecaoCard>
  </Pagina>
);

export default MinhaSemana;
