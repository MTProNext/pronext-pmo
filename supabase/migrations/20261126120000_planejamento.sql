-- =============================================================================
-- Etapa 4A da Fase 1: planejamento semanal (banco e regras)
-- semanas, planejamento_itens, replanejamentos, capacidade efetiva, views e
-- pendências da etapa 3 (P1/P2 e status pelo desenvolvedor alocado).
-- =============================================================================

create type public.status_semana as enum ('rascunho', 'publicada', 'confirmada', 'em_execucao', 'revisada');
create type public.faixa_capacidade as enum ('planejado', 'reserva', 'interno');
create type public.tipo_replanejamento as enum ('inclusao', 'alteracao_horas', 'remocao', 'entrada_p1_p2', 'outro');

-- Sinalizador de transação usado pelas funções avancar_semana e replanejar_item
-- para liberar as alterações que os triggers de guarda bloqueiam.
create or replace function public.alterando_planejamento()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('pmo.alterando_planejamento', true), '') = 'on'
$$;

-- -----------------------------------------------------------------------------
-- Semanas
-- -----------------------------------------------------------------------------
create table public.semanas (
  id             uuid primary key default gen_random_uuid(),
  inicio         date not null unique,
  fim            date generated always as (inicio + 4) stored,
  status         public.status_semana not null default 'rascunho',
  publicada_em   timestamptz,
  publicada_por  uuid references public.colaboradores (id) on delete set null,
  confirmada_em  timestamptz,
  confirmada_por uuid references public.colaboradores (id) on delete set null,
  iniciada_em    timestamptz,
  iniciada_por   uuid references public.colaboradores (id) on delete set null,
  revisada_em    timestamptz,
  revisada_por   uuid references public.colaboradores (id) on delete set null,
  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references public.colaboradores (id) on delete set null
                   default public.colaborador_atual_id(),
  constraint semanas_inicio_segunda check (extract(isodow from inicio) = 1)
);

comment on table public.semanas is
  'Semana de planejamento (segunda a sexta). Ciclo: rascunho → publicada → confirmada → em_execucao → revisada.';

create trigger semanas_updated_at
  before update on public.semanas
  for each row execute function public.set_updated_at();

-- Status só muda por avancar_semana(); início só muda em rascunho.
create or replace function public.semanas_guardar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or public.alterando_planejamento() then
    return new;
  end if;
  if new.status is distinct from old.status then
    raise exception 'Use as ações do planejamento (avançar semana) para mudar o status.'
      using errcode = 'check_violation';
  end if;
  if new.inicio is distinct from old.inicio and old.status <> 'rascunho' then
    raise exception 'A data da semana não pode mudar depois de publicada.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger semanas_guardar
  before update on public.semanas
  for each row execute function public.semanas_guardar();

-- -----------------------------------------------------------------------------
-- Itens do planejamento (grade colaborador × demanda)
-- -----------------------------------------------------------------------------
create table public.planejamento_itens (
  id                uuid primary key default gen_random_uuid(),
  semana_id         uuid not null references public.semanas (id) on delete cascade,
  colaborador_id    uuid not null references public.colaboradores (id),
  demanda_id        uuid not null references public.demandas (id),
  horas_planejadas  numeric(5,2) not null check (horas_planejadas > 0),
  faixa             public.faixa_capacidade not null default 'planejado',
  observacao        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references public.colaboradores (id) on delete set null
                      default public.colaborador_atual_id(),
  constraint planejamento_itens_unico unique (semana_id, colaborador_id, demanda_id)
);

create index planejamento_itens_colaborador_idx on public.planejamento_itens (colaborador_id);
create index planejamento_itens_demanda_idx on public.planejamento_itens (demanda_id);

comment on column public.planejamento_itens.faixa is
  'interno para demandas internas (automático); reserva quando a reserva é usada para item do backlog; senão planejado.';

create trigger planejamento_itens_updated_at
  before update on public.planejamento_itens
  for each row execute function public.set_updated_at();

-- Depois de publicada, a grade só muda por replanejar_item() (motivo, responsável e impacto).
create or replace function public.planejamento_itens_guardar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status public.status_semana;
begin
  if auth.uid() is not null and not public.alterando_planejamento() then
    select s.status into v_status
    from public.semanas s
    where s.id = coalesce(new.semana_id, old.semana_id);

    if v_status <> 'rascunho' then
      raise exception 'Semana já publicada: use o replanejamento (motivo, responsável e impacto).'
        using errcode = 'check_violation';
    end if;
    if tg_op = 'UPDATE' and new.semana_id <> old.semana_id then
      raise exception 'Um item não pode mudar de semana.' using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger planejamento_itens_guardar
  before insert or update or delete on public.planejamento_itens
  for each row execute function public.planejamento_itens_guardar();

-- Colaborador precisa ter horas de desenvolvimento; demanda precisa estar aberta;
-- faixa interno é automática para demandas internas.
create or replace function public.planejamento_itens_normalizar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_demanda record;
begin
  if not exists (
    select 1 from public.colaboradores c
    where c.id = new.colaborador_id and c.ativo and c.horas_dev_semanais > 0
  ) then
    raise exception 'Só colaboradores ativos com horas de desenvolvimento podem ser alocados.'
      using errcode = 'check_violation';
  end if;

  select d.cliente_id, d.status into v_demanda from public.demandas d where d.id = new.demanda_id;

  if (tg_op = 'INSERT' or new.demanda_id <> old.demanda_id)
     and v_demanda.status in ('concluida', 'cancelada') then
    raise exception 'Demanda concluída ou cancelada não pode ser alocada.'
      using errcode = 'check_violation';
  end if;

  if v_demanda.cliente_id is null then
    new.faixa := 'interno';
  elsif new.faixa = 'interno' then
    new.faixa := 'planejado';
  end if;

  return new;
end;
$$;

create trigger planejamento_itens_normalizar
  before insert or update on public.planejamento_itens
  for each row execute function public.planejamento_itens_normalizar();

-- Alocação em semana publicada (ou posterior) passa a demanda nova/priorizada para planejada.
create or replace function public.planejamento_itens_marcar_planejada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.semanas s where s.id = new.semana_id and s.status <> 'rascunho') then
    update public.demandas
       set status = 'planejada'
     where id = new.demanda_id and status in ('nova', 'priorizada');
  end if;
  return null;
end;
$$;

create trigger planejamento_itens_marcar_planejada
  after insert or update of demanda_id on public.planejamento_itens
  for each row execute function public.planejamento_itens_marcar_planejada();

-- -----------------------------------------------------------------------------
-- Replanejamentos (log; só recebe inclusões, feitas por funções)
-- -----------------------------------------------------------------------------
create table public.replanejamentos (
  id                      uuid primary key default gen_random_uuid(),
  semana_id               uuid not null references public.semanas (id) on delete cascade,
  tipo                    public.tipo_replanejamento not null,
  demanda_id              uuid references public.demandas (id),
  planejamento_item_id    uuid references public.planejamento_itens (id) on delete set null,
  colaborador_afetado_id  uuid references public.colaboradores (id),
  horas_antes             numeric(5,2),
  horas_depois            numeric(5,2),
  motivo                  text not null check (length(trim(motivo)) > 0),
  impacto                 text not null check (length(trim(impacto)) > 0),
  responsavel_id          uuid not null references public.colaboradores (id),
  created_at              timestamptz not null default now(),
  created_by              uuid references public.colaboradores (id) on delete set null
                            default public.colaborador_atual_id()
);

create index replanejamentos_semana_idx on public.replanejamentos (semana_id);
create index replanejamentos_demanda_idx on public.replanejamentos (demanda_id);

comment on table public.replanejamentos is
  'Log de alterações relevantes após a publicação da semana. Sem update/delete.';

-- -----------------------------------------------------------------------------
-- Funções auxiliares de visibilidade e alocação
-- -----------------------------------------------------------------------------
-- Rascunho só é visível para Proprietário e Líder técnico.
create or replace function public.semana_visivel(p_semana_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.semanas s
    where s.id = p_semana_id
      and public.papel_atual() is not null
      and (s.status <> 'rascunho' or public.tem_papel('proprietario', 'lider_tecnico'))
  )
$$;

-- O usuário está alocado na demanda numa semana publicada, confirmada ou em execução?
create or replace function public.alocado_na_demanda(p_demanda_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.planejamento_itens i
    join public.semanas s on s.id = i.semana_id
    where i.demanda_id = p_demanda_id
      and i.colaborador_id = public.colaborador_atual_id()
      and s.status in ('publicada', 'confirmada', 'em_execucao')
  )
$$;

revoke execute on function public.semana_visivel(uuid) from anon;
revoke execute on function public.alocado_na_demanda(uuid) from anon;

-- -----------------------------------------------------------------------------
-- Ações: avançar semana e replanejar item
-- -----------------------------------------------------------------------------
create or replace function public.avancar_semana(p_semana_id uuid)
returns public.status_semana
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atual public.status_semana;
  v_proximo public.status_semana;
  v_eu uuid := public.colaborador_atual_id();
begin
  if not public.tem_papel('lider_tecnico') then
    raise exception 'Somente líderes técnicos avançam o ciclo da semana.'
      using errcode = 'insufficient_privilege';
  end if;

  select status into v_atual from public.semanas where id = p_semana_id for update;
  if not found then
    raise exception 'Semana não encontrada.' using errcode = 'no_data_found';
  end if;

  v_proximo := case v_atual
    when 'rascunho' then 'publicada'
    when 'publicada' then 'confirmada'
    when 'confirmada' then 'em_execucao'
    when 'em_execucao' then 'revisada'
  end;
  if v_proximo is null then
    raise exception 'A semana já foi revisada; não há próximo passo.' using errcode = 'check_violation';
  end if;

  perform set_config('pmo.alterando_planejamento', 'on', true);
  update public.semanas set
    status         = v_proximo,
    publicada_em   = case when v_proximo = 'publicada' then now() else publicada_em end,
    publicada_por  = case when v_proximo = 'publicada' then v_eu else publicada_por end,
    confirmada_em  = case when v_proximo = 'confirmada' then now() else confirmada_em end,
    confirmada_por = case when v_proximo = 'confirmada' then v_eu else confirmada_por end,
    iniciada_em    = case when v_proximo = 'em_execucao' then now() else iniciada_em end,
    iniciada_por   = case when v_proximo = 'em_execucao' then v_eu else iniciada_por end,
    revisada_em    = case when v_proximo = 'revisada' then now() else revisada_em end,
    revisada_por   = case when v_proximo = 'revisada' then v_eu else revisada_por end
  where id = p_semana_id;
  perform set_config('pmo.alterando_planejamento', 'off', true);

  -- Ao publicar, demandas alocadas que estavam novas/priorizadas passam a planejadas.
  if v_proximo = 'publicada' then
    update public.demandas d
       set status = 'planejada'
     where d.status in ('nova', 'priorizada')
       and exists (select 1 from public.planejamento_itens i
                   where i.semana_id = p_semana_id and i.demanda_id = d.id);
  end if;

  return v_proximo;
end;
$$;

comment on function public.avancar_semana(uuid) is
  'Avança o ciclo da semana (rascunho → publicada → confirmada → em_execucao → revisada). Só líder técnico.';

-- Inclui, altera (p_horas > 0) ou remove (p_horas nulo ou 0) uma alocação de semana
-- publicada/confirmada/em execução, registrando o replanejamento. Retorna o id do registro.
create or replace function public.replanejar_item(
  p_semana_id uuid,
  p_colaborador_id uuid,
  p_demanda_id uuid,
  p_horas numeric,
  p_motivo text,
  p_impacto text,
  p_faixa public.faixa_capacidade default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.status_semana;
  v_item public.planejamento_itens;
  v_item_id uuid;
  v_tipo public.tipo_replanejamento;
  v_antes numeric;
  v_depois numeric;
  v_registro uuid;
begin
  if not public.tem_papel('lider_tecnico') then
    raise exception 'Somente líderes técnicos replanejam a semana.' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(trim(p_motivo), '') = '' or coalesce(trim(p_impacto), '') = '' then
    raise exception 'Informe o motivo e o impacto do replanejamento.' using errcode = 'check_violation';
  end if;
  if p_horas < 0 then
    raise exception 'As horas não podem ser negativas.' using errcode = 'check_violation';
  end if;

  select status into v_status from public.semanas where id = p_semana_id;
  if v_status is null then
    raise exception 'Semana não encontrada.' using errcode = 'no_data_found';
  elsif v_status = 'rascunho' then
    raise exception 'Semana em rascunho: edite a grade diretamente, sem replanejamento.'
      using errcode = 'check_violation';
  elsif v_status = 'revisada' then
    raise exception 'Semana revisada não pode ser replanejada.' using errcode = 'check_violation';
  end if;

  select * into v_item from public.planejamento_itens
  where semana_id = p_semana_id and colaborador_id = p_colaborador_id and demanda_id = p_demanda_id;

  perform set_config('pmo.alterando_planejamento', 'on', true);

  if coalesce(p_horas, 0) = 0 then
    if v_item.id is null then
      raise exception 'Não há alocação para remover.' using errcode = 'check_violation';
    end if;
    delete from public.planejamento_itens where id = v_item.id;
    v_tipo := 'remocao';
    v_antes := v_item.horas_planejadas;
    v_depois := 0;
    v_item_id := null;
  elsif v_item.id is null then
    insert into public.planejamento_itens (semana_id, colaborador_id, demanda_id, horas_planejadas, faixa)
    values (p_semana_id, p_colaborador_id, p_demanda_id, p_horas, coalesce(p_faixa, 'planejado'))
    returning id into v_item_id;
    v_tipo := 'inclusao';
    v_antes := 0;
    v_depois := p_horas;
  else
    update public.planejamento_itens
       set horas_planejadas = p_horas, faixa = coalesce(p_faixa, faixa)
     where id = v_item.id;
    v_tipo := 'alteracao_horas';
    v_antes := v_item.horas_planejadas;
    v_depois := p_horas;
    v_item_id := v_item.id;
  end if;

  perform set_config('pmo.alterando_planejamento', 'off', true);

  insert into public.replanejamentos
    (semana_id, tipo, demanda_id, planejamento_item_id, colaborador_afetado_id,
     horas_antes, horas_depois, motivo, impacto, responsavel_id)
  values
    (p_semana_id, v_tipo, p_demanda_id, v_item_id, p_colaborador_id,
     v_antes, v_depois, trim(p_motivo), trim(p_impacto), public.colaborador_atual_id())
  returning id into v_registro;

  return v_registro;
end;
$$;

comment on function public.replanejar_item(uuid, uuid, uuid, numeric, text, text, public.faixa_capacidade) is
  'Replaneja uma alocação de semana publicada: inclui, altera (horas > 0) ou remove (0/nulo). Só líder técnico.';

revoke execute on function public.avancar_semana(uuid) from anon;
revoke execute on function public.replanejar_item(uuid, uuid, uuid, numeric, text, text, public.faixa_capacidade) from anon;

-- -----------------------------------------------------------------------------
-- Pendências da etapa 3
-- -----------------------------------------------------------------------------
-- Entrada (ou elevação) de P1/P2 com semana publicada, confirmada ou em execução
-- gera um registro de replanejamento para o líder responsável avaliar.
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

  insert into public.replanejamentos (semana_id, tipo, demanda_id, motivo, impacto, responsavel_id)
  select s.id,
         'entrada_p1_p2',
         new.id,
         case when tg_op = 'INSERT' then 'Entrada de demanda ' else 'Demanda elevada para ' end
           || case new.prioridade when 'p1' then 'P1 · Crítica' else 'P2 · Alta' end
           || ' durante a semana.',
         case new.prioridade
           when 'p1' then 'A avaliar pelo líder responsável: resposta imediata.'
           else 'A avaliar pelo líder responsável: impacto e reprogramação.'
         end,
         new.lider_id
  from public.semanas s
  where s.status in ('publicada', 'confirmada', 'em_execucao')
    and s.fim >= current_date;

  return null;
end;
$$;

create trigger demandas_registrar_p1_p2
  after insert or update of prioridade on public.demandas
  for each row execute function public.demandas_registrar_p1_p2();

-- Desenvolvedor alocado altera apenas o status (e não para nova, priorizada ou cancelada).
create or replace function public.demandas_guardar_desenvolvedor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.papel_atual() is distinct from 'desenvolvedor' then
    return new;
  end if;
  if (to_jsonb(new) - array['status', 'updated_at', 'concluida_em'])
     is distinct from (to_jsonb(old) - array['status', 'updated_at', 'concluida_em']) then
    raise exception 'O desenvolvedor altera apenas o status da demanda.'
      using errcode = 'insufficient_privilege';
  end if;
  if new.status not in ('planejada', 'em_execucao', 'bloqueada', 'concluida') then
    raise exception 'O desenvolvedor pode mover a demanda apenas para Planejada, Em execução, Bloqueada ou Concluída.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger demandas_guardar_desenvolvedor
  before update on public.demandas
  for each row execute function public.demandas_guardar_desenvolvedor();

create policy "demandas: desenvolvedor alocado altera o status"
  on public.demandas for update to authenticated
  using (public.tem_papel('desenvolvedor') and public.alocado_na_demanda(id))
  with check (public.tem_papel('desenvolvedor') and public.alocado_na_demanda(id));

-- -----------------------------------------------------------------------------
-- Capacidade efetiva
-- -----------------------------------------------------------------------------
-- Horas da jornada indisponíveis nos dias úteis da semana. Sobreposições no mesmo
-- dia (ex.: férias + feriado) não somam: vale a maior, limitada a um dia de jornada.
create or replace function public.horas_indisponiveis(p_colaborador_id uuid, p_inicio date)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(por_dia), 0)
  from (
    select least(max(coalesce(i.horas_por_dia, c.jornada_semanal / 5)), c.jornada_semanal / 5) as por_dia
    from public.colaboradores c
    cross join generate_series(p_inicio::timestamp, (p_inicio + 4)::timestamp, interval '1 day') as d (dia)
    join public.indisponibilidades i
      on d.dia::date between i.data_inicio and i.data_fim
     and (i.colaborador_id is null or i.colaborador_id = c.id)
    where c.id = p_colaborador_id
      and extract(isodow from d.dia) < 6
    group by d.dia, c.jornada_semanal
  ) dias
$$;

-- Capacidade efetiva = horas de desenvolvimento − indisponibilidades da semana.
-- Quem tem horas_dev < jornada (líderes) perde proporcionalmente:
-- desconto = horas indisponíveis × horas_dev / jornada.
create or replace function public.capacidade_efetiva(p_colaborador_id uuid, p_semana_inicio date)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    0,
    round(
      c.horas_dev_semanais
      - case when c.jornada_semanal > 0
          then public.horas_indisponiveis(c.id, p_semana_inicio) * c.horas_dev_semanais / c.jornada_semanal
          else 0 end,
      2
    )
  )
  from public.colaboradores c
  where c.id = p_colaborador_id
$$;

comment on function public.capacidade_efetiva(uuid, date) is
  'Horas de desenvolvimento − indisponibilidades da semana (proporcional para quem tem horas_dev < jornada).';

-- -----------------------------------------------------------------------------
-- Views (security_invoker: respeitam a RLS de quem consulta)
-- -----------------------------------------------------------------------------
create view public.v_capacidade_colaborador_semana
with (security_invoker = true)
as
select
  s.id                                   as semana_id,
  s.inicio                               as semana_inicio,
  s.status                               as semana_status,
  c.id                                   as colaborador_id,
  c.nome                                 as colaborador_nome,
  c.papel,
  c.lider_id,
  c.horas_dev_semanais,
  round(c.horas_dev_semanais - k.capacidade, 2)        as horas_indisponiveis,
  k.capacidade                           as capacidade_efetiva,
  coalesce(p.planejado, 0)               as horas_planejado,
  coalesce(p.reserva, 0)                 as horas_reserva,
  coalesce(p.interno, 0)                 as horas_interno,
  coalesce(p.total, 0)                   as horas_planejadas,
  case when k.capacidade > 0 then round(coalesce(p.total, 0) / k.capacidade * 100, 1) end as ocupacao_pct,
  coalesce(p.total, 0) > k.capacidade    as excede_capacidade
from public.semanas s
cross join public.colaboradores c
cross join lateral (select public.capacidade_efetiva(c.id, s.inicio) as capacidade) k
left join lateral (
  select
    sum(i.horas_planejadas) filter (where i.faixa = 'planejado') as planejado,
    sum(i.horas_planejadas) filter (where i.faixa = 'reserva')   as reserva,
    sum(i.horas_planejadas) filter (where i.faixa = 'interno')   as interno,
    sum(i.horas_planejadas)                                       as total
  from public.planejamento_itens i
  where i.semana_id = s.id and i.colaborador_id = c.id
) p on true
where c.horas_dev_semanais > 0
  and (c.ativo or p.total is not null)
  and (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo')
       or c.id = public.colaborador_atual_id());

comment on view public.v_capacidade_colaborador_semana is
  'Capacidade efetiva, horas planejadas por faixa e ocupação (planejadas ÷ capacidade) por colaborador e semana.';

create view public.v_resumo_semana
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
  (select count(*) from public.replanejamentos r where r.semana_id = t.id)   as replanejamentos
from totais t
cross join public.configuracoes cfg;

comment on view public.v_resumo_semana is
  'Totais da semana: capacidade, limites das faixas (configuracoes), horas por faixa, ocupação e alertas.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.semanas enable row level security;
alter table public.planejamento_itens enable row level security;
alter table public.replanejamentos enable row level security;

-- semanas: rascunho só para Proprietário e Líder; demais veem publicada ou posterior.
create policy "semanas: leitura conforme status"
  on public.semanas for select to authenticated
  using (
    public.papel_atual() is not null
    and (status <> 'rascunho' or public.tem_papel('proprietario', 'lider_tecnico'))
  );

create policy "semanas: líder cria em rascunho"
  on public.semanas for insert to authenticated
  with check (public.tem_papel('lider_tecnico') and status = 'rascunho');

create policy "semanas: líder altera (status só por avancar_semana)"
  on public.semanas for update to authenticated
  using (public.tem_papel('lider_tecnico'))
  with check (public.tem_papel('lider_tecnico'));

create policy "semanas: líder exclui rascunho"
  on public.semanas for delete to authenticated
  using (public.tem_papel('lider_tecnico') and status = 'rascunho');

-- planejamento_itens: gestão lê tudo o que vê; desenvolvedor lê os seus.
create policy "planejamento_itens: leitura"
  on public.planejamento_itens for select to authenticated
  using (
    public.semana_visivel(semana_id)
    and (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo')
         or colaborador_id = public.colaborador_atual_id())
  );

create policy "planejamento_itens: líder inclui"
  on public.planejamento_itens for insert to authenticated
  with check (public.tem_papel('lider_tecnico'));

create policy "planejamento_itens: líder altera"
  on public.planejamento_itens for update to authenticated
  using (public.tem_papel('lider_tecnico'))
  with check (public.tem_papel('lider_tecnico'));

create policy "planejamento_itens: líder exclui"
  on public.planejamento_itens for delete to authenticated
  using (public.tem_papel('lider_tecnico'));

-- replanejamentos: só leitura (gravação pelas funções).
create policy "replanejamentos: leitura"
  on public.replanejamentos for select to authenticated
  using (
    public.semana_visivel(semana_id)
    and (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo')
         or colaborador_afetado_id = public.colaborador_atual_id())
  );
