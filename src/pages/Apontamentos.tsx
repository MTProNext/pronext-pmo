import { useSearchParams } from "react-router-dom";
import { Pagina } from "@/components/comum/Pagina";
import { ConteudoApontamentos } from "@/components/apontamentos/ConteudoApontamentos";
import { NavegacaoSemana } from "@/components/planejamento/NavegacaoSemana";
import { useSessao } from "@/hooks/useSessao";
import { ehSegunda, formatSemana, inicioSemanaAtual } from "@/lib/semana";

/** /apontamentos?semana=aaaa-mm-dd — apontamento semanal das próprias horas. */
const Apontamentos = () => {
  const { colaborador } = useSessao();
  const [params, setParams] = useSearchParams();
  const parametro = params.get("semana") ?? undefined;
  const inicio = ehSegunda(parametro) ? parametro : inicioSemanaAtual();

  return (
    <Pagina
      titulo="Apontamentos"
      descricao={`Suas horas de ${formatSemana(inicio)}. Registre cada dia útil até o fim do dia útil seguinte e envie a semana até o prazo.`}
      acoes={<NavegacaoSemana inicio={inicio} onChange={(i) => setParams({ semana: i })} />}
    >
      {colaborador && <ConteudoApontamentos key={inicio} colaborador={colaborador} inicio={inicio} />}
    </Pagina>
  );
};

export default Apontamentos;
