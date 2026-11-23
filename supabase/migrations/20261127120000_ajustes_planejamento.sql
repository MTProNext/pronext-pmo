-- =============================================================================
-- Ajustes da etapa 4A
-- 1. "Hoje" sempre na data de America/Sao_Paulo (hoje_brasil()).
-- 2. Replanejamentos automáticos de P1/P2 ficam pendentes até o líder completar
--    motivo e impacto; fora isso, o log é imutável.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Data de hoje no Brasil
-- -----------------------------------------------------------------------------
-- Use hoje_brasil() em toda regra que dependa de "hoje" (nunca current_date, que é UTC).
-- O ajuste pmo.agora (timestamptz) existe só para testes: não pode ser definido
-- por clientes via PostgREST.
create or replace function public.hoje_brasil()
returns date
language sql
stable
set search_path = ''
as $$
  select (
    coalesce(nullif(current_setting('pmo.agora', true), '')::timestamptz, now())
    at time zone 'America/Sao_Paulo'
  )::date
$$;

comment on function public.hoje_brasil() is
  'Data de hoje em America/Sao_Paulo. Use em toda regra que dependa de "hoje".';

alter table public.demandas alter column data_entrada set default public.hoje_brasil();

-- -----------------------------------------------------------------------------
-- 2. Replanejamentos pendentes
-- -----------------------------------------------------------------------------
alter table public.replanejamentos
  add column pendente        boolean not null default false,
  add column descricao_auto  text,
  add column completado_em   timestamptz,
  add column completado_por  uuid references public.colaboradores (id) on delete set null;

comment on column public.replanejamentos.pendente is
  'Registro automático (P1/P2) aguardando o líder completar motivo e impacto.';
comment on column public.replanejamentos.descricao_auto is
  'Descrição gerada pelo sistema para registros automáticos.';

-- Motivo e impacto passam a ser obrigatórios só quando o registro não está pendente.
alter table public.replanejamentos
  drop constraint replanejamentos_motivo_check,
  drop constraint replanejamentos_impacto_check,
  alter column motivo drop not null,
  alter column impacto drop not null,
  add constraint replanejamentos_motivo_impacto check (
    pendente or (length(trim(coalesce(motivo, ''))) > 0 and length(trim(coalesce(impacto, ''))) > 0)
  );

create index replanejamentos_pendentes_idx on public.replanejamentos (semana_id) where pendente;

-- O log é imutável. Exceções: completar um pendente (motivo, impacto e marcação de
-- conclusão) e o "set null" automático quando o item de planejamento é removido.
create or replace function public.replanejamentos_imutavel()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_ignorar text[] := array['motivo', 'impacto', 'pendente', 'completado_em', 'completado_por'];
begin
  if tg_op = 'DELETE' then
    if auth.uid() is null then
      return old;
    end if;
    raise exception 'O log de replanejamentos não pode ser excluído.' using errcode = 'insufficient_privilege';
  end if;

  -- Item de planejamento removido: a FK zera a referência.
  if new.planejamento_item_id is null and old.planejamento_item_id is not null
     and (to_jsonb(new) - 'planejamento_item_id') = (to_jsonb(old) - 'planejamento_item_id') then
    return new;
  end if;

  -- Completar um pendente.
  if old.pendente and not new.pendente
     and (to_jsonb(new) - v_ignorar) = (to_jsonb(old) - v_ignorar) then
    return new;
  end if;

  raise exception 'O log de replanejamentos não pode ser alterado (só é possível completar registros pendentes).'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger replanejamentos_imutavel
  before update or delete on public.replanejamentos
  for each row execute function public.replanejamentos_imutavel();

-- Completa motivo e impacto de um registro pendente. Só líder técnico.
create or replace function public.completar_replanejamento(p_id uuid, p_motivo text, p_impacto text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pendente boolean;
begin
  if not public.tem_papel('lider_tecnico') then
    raise exception 'Somente líderes técnicos completam replanejamentos.' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(trim(p_motivo), '') = '' or coalesce(trim(p_impacto), '') = '' then
    raise exception 'Informe o motivo e o impacto do replanejamento.' using errcode = 'check_violation';
  end if;

  select pendente into v_pendente from public.replanejamentos where id = p_id for update;
  if v_pendente is null then
    raise exception 'Replanejamento não encontrado.' using errcode = 'no_data_found';
  elsif not v_pendente then
    raise exception 'Este replanejamento já foi completado.' using errcode = 'check_violation';
  end if;

  update public.replanejamentos
     set motivo = trim(p_motivo),
         impacto = trim(p_impacto),
         pendente = false,
         completado_em = now(),
         completado_por = public.colaborador_atual_id()
   where id = p_id;
end;
$$;

comment on function public.completar_replanejamento(uuid, text, text) is
  'Completa motivo e impacto de um replanejamento pendente (gerado por P1/P2). Só líder técnico.';

revoke execute on function public.completar_replanejamento(uuid, text, text) from anon;

-- Registro automático de P1/P2: pendente, com descrição do sistema e "hoje" no Brasil.
create or replace function public.demandas_registrar_p1_p2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.prioridade not in ('p1', 'p2') or new.status in ('concluida', 'cancelada') then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.prioridade in ('p1', 'p2') then
    return null;
  end if;

  insert into public.replanejamentos (semana_id, tipo, demanda_id, pendente, descricao_auto, responsavel_id)
  select s.id,
         'entrada_p1_p2',
         new.id,
         true,
         case when tg_op = 'INSERT' then 'Entrada de demanda ' else 'Demanda elevada para ' end
           || case new.prioridade when 'p1' then 'P1 · Crítica' else 'P2 · Alta' end
           || ' durante a semana. '
           || case new.prioridade
                when 'p1' then 'Líder avalia na hora e define a resposta.'
                else 'Líder avalia impacto e reprogramação.'
              end,
         new.lider_id
  from public.semanas s
  where s.status in ('publicada', 'confirmada', 'em_execucao')
    and s.fim >= public.hoje_brasil();

  return null;
end;
$$;

-- A view de resumo passa a contar também os pendentes.
create or replace view public.v_resumo_semana
with (security_invoker = true)
as
with totais as (
  select
    s.id, s.inicio, s.fim, s.status,
    coalesce(sum(v.capacidade_efetiva), 0)                     as capacidade_total,
    coalesce(sum(v.horas_planejado), 0)                        as horas_planejado,
    coalesce(sum(v.horas_reserva), 0)                          as horas_reserva,
    coalesce(sum(v.horas_interno), 0)                          as horas_interno,
    coalesce(sum(v.horas_planejadas), 0)                       as horas_planejadas,
    count(*) filter (where v.excede_capacidade)                as colaboradores_acima_capacidade
  from public.semanas s
  left join public.v_capacidade_colaborador_semana v on v.semana_id = s.id
  group by s.id
)
select
  t.id                                                         as semana_id,
  t.inicio,
  t.fim,
  t.status,
  t.capacidade_total,
  cfg.pct_planejado,
  cfg.pct_reserva,
  cfg.pct_interno,
  round(t.capacidade_total * cfg.pct_planejado / 100, 2)       as limite_planejado,
  round(t.capacidade_total * cfg.pct_reserva / 100, 2)         as limite_reserva,
  round(t.capacidade_total * cfg.pct_interno / 100, 2)         as limite_interno,
  t.horas_planejado,
  t.horas_reserva,
  t.horas_interno,
  t.horas_planejadas,
  case when t.capacidade_total > 0
    then round(t.horas_planejadas / t.capacidade_total * 100, 1) end as ocupacao_pct,
  t.horas_planejado > round(t.capacidade_total * cfg.pct_planejado / 100, 2) as alerta_planejado,
  t.horas_reserva   > round(t.capacidade_total * cfg.pct_reserva / 100, 2)   as alerta_reserva,
  t.horas_interno   > round(t.capacidade_total * cfg.pct_interno / 100, 2)   as alerta_interno,
  t.colaboradores_acima_capacidade,
  (select count(*) from public.replanejamentos r where r.semana_id = t.id)                as replanejamentos,
  (select count(*) from public.replanejamentos r where r.semana_id = t.id and r.pendente) as replanejamentos_pendentes
from totais t
cross join public.configuracoes cfg;
