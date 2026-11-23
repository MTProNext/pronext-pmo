/** Traduz erros do Supabase/Postgres em mensagens para o usuário (pt-BR). */

interface ErroSupabase {
  code?: string;
  message: string;
}

/** Mensagens das constraints CHECK/UNIQUE, pelo nome da constraint. */
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
  apontamentos_descricao_minima: "A descrição precisa ter pelo menos 10 caracteres.",
  apontamentos_horas_check: "As horas precisam ser maiores que zero e no máximo 24.",
  apontamentos_um_por_dia: "Já existe um apontamento desta demanda neste dia.",
  categorias_hora_nome_key: "Já existe uma categoria com esse nome.",
};

const porConstraint = (mensagem: string) => {
  const constraint = Object.keys(CONSTRAINTS).find((c) => mensagem.includes(c));
  return constraint ? CONSTRAINTS[constraint] : undefined;
};

export function traduzirErro(erro: ErroSupabase): string {
  switch (erro.code) {
    case "23505":
      return porConstraint(erro.message) ?? "Já existe um registro com esses dados (nome duplicado).";
    case "42501":
      // Recusas da RLS vêm em inglês; as das funções e triggers já vêm em pt-BR.
      return /row-level security|permission denied/i.test(erro.message)
        ? "Você não tem permissão para esta ação."
        : erro.message;
    case "23503":
      return "Registro vinculado a outro cadastro; não pode ser removido ou alterado assim.";
    case "23514":
      // Sem constraint conhecida: é mensagem de trigger, já escrita em pt-BR.
      return porConstraint(erro.message) ?? erro.message;
    default:
      return erro.message;
  }
}
