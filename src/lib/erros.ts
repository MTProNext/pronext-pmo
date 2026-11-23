/** Traduz erros do Supabase/Postgres em mensagens para o usuário (pt-BR). */

interface ErroSupabase {
  code?: string;
  message: string;
}

/** Mensagens das constraints CHECK, pelo nome da constraint. */
const CONSTRAINTS: Record<string, string> = {
  contratos_banco_horas_exige_horas: "Contrato de banco de horas exige as horas contratadas.",
  contratos_vigencia_valida: "O fim da vigência não pode ser anterior ao início.",
  projetos_datas_validas: "A data de fim prevista não pode ser anterior à de início.",
  indisponibilidades_periodo_valido: "A data final não pode ser anterior à inicial.",
  indisponibilidades_global_so_feriado: "Só feriados podem valer para todos os colaboradores.",
  configuracoes_faixas_somam_100: "As faixas de capacidade precisam somar 100%.",
  demandas_interna_sem_contrato_projeto: "Demanda interna não pode ter contrato nem projeto.",
  demandas_atividade_interna_sem_cliente: "Atividade interna não pode ter cliente.",
  demandas_estimativa_horas_check: "A estimativa não pode ser negativa.",
  planejamento_itens_horas_planejadas_check: "As horas planejadas precisam ser maiores que zero.",
  semanas_inicio_segunda: "A semana precisa começar numa segunda-feira.",
  replanejamentos_motivo_impacto: "Informe o motivo e o impacto do replanejamento.",
};

export function traduzirErro(erro: ErroSupabase): string {
  switch (erro.code) {
    case "23505":
      return "Já existe um registro com esses dados (nome duplicado).";
    case "42501":
      return "Você não tem permissão para esta ação.";
    case "23503":
      return "Registro vinculado a outro cadastro; não pode ser removido ou alterado assim.";
    case "23514": {
      const constraint = Object.keys(CONSTRAINTS).find((c) => erro.message.includes(c));
      // Sem constraint conhecida: é mensagem de trigger, já escrita em pt-BR.
      return constraint ? CONSTRAINTS[constraint] : erro.message;
    }
    default:
      return erro.message;
  }
}
