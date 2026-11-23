-- =============================================================================
-- Fase 2, etapa 2A: apontamento de horas
-- Categorias, apontamentos, auditoria, fluxo rascunho → enviado → aprovado/devolvido,
-- classificação comercial, horas não planejadas e prazos de apontamento/envio.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Instante atual (com simulação para testes) e "hoje" no Brasil
-- -----------------------------------------------------------------------------
-- agora(): now(), ou o instante de pmo.agora (só testes; clientes não definem via PostgREST).
create or replace function public.agora()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select coalesce(nullif(current_setting('pmo.agora', true), '')::timestamptz, now())
$$;

comment on function public.agora() is
  'Instante atual. Use em regras de prazo no lugar de now() (testes podem simular com pmo.agora).';

create or replace function public.hoje_brasil()
returns date
language sql
stable
set search_path = ''
as $$
  select (public.agora() at time zone 'America/Sao_Paulo')::date
$$;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.status_apontamento as enum ('rascunho', 'enviado', 'aprovado', 'devolvido');
create type public.classificacao_comercial as enum (
  'banco_horas', 'faturavel_adicional', 'escopo_projeto', 'nao_faturavel', 'a_validar'
);

-- -----------------------------------------------------------------------------
-- Configurações de prazo
-- -----------------------------------------------------------------------------
alter table public.configuracoes
  add column prazo_registro_dias_uteis smallint not null default 1
    check (prazo_registro_dias_uteis between 0 and 5),
  add column prazo_envio_dia_semana smallint not null default 1
    check (prazo_envio_dia_semana between 1 and 7),
  add column prazo_envio_hora time not null default '12:00',
  add column inicio_controle_apontamentos date;

comment on column public.configuracoes.prazo_registro_dias_uteis is
  'Horas de um dia útil devem ser registradas até o fim do N-ésimo dia útil seguinte (padrão 1).';
comment on column public.configuracoes.prazo_envio_dia_semana is
  'Dia da semana seguinte (1 = segunda ... 7 = domingo) até o qual a semana deve ser enviada.';
comment on column public.configuracoes.prazo_envio_hora is 'Hora limite (Brasília) do envio da semana.';
comment on column public.configuracoes.inicio_controle_apontamentos is
  'Primeiro dia considerado no controle de prazo. Nulo = controle desligado.';

-- Prazos entram no bloco "faixas e alertas" (Proprietário e Líder técnico).
create or replace function public.configuracoes_guardar_colunas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_papel public.papel := public.papel_atual();
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.dia_limite_fechamento is distinct from old.dia_limite_fechamento
     and v_papel is distinct from 'proprietario'
     and v_papel is distinct from 'administrativo' then
    raise exception 'Somente Proprietário ou Administrativo podem alterar o dia-limite do fechamento.'
      using errcode = 'insufficient_privilege';
  end if;

  if (new.pct_planejado, new.pct_reserva, new.pct_interno,
      new.dias_alerta_projeto_sem_atualizacao, new.pct_alerta_contrato,
      new.prazo_registro_dias_uteis, new.prazo_envio_dia_semana, new.prazo_envio_hora,
      new.inicio_controle_apontamentos)
     is distinct from
     (old.pct_planejado, old.pct_reserva, old.pct_interno,
      old.dias_alerta_projeto_sem_atualizacao, old.pct_alerta_contrato,
      old.prazo_registro_dias_uteis, old.prazo_envio_dia_semana, old.prazo_envio_hora,
      old.inicio_controle_apontamentos)
     and v_papel is distinct from 'proprietario'
     and v_papel is distinct from 'lider_tecnico' then
    raise exception 'Somente Proprietário ou Líder técnico podem alterar faixas, alertas e prazos.'
      using errcode = 'insufficient_privilege';
  end if;

  new.updated_by := public.colaborador_atual_id();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Categorias de horas
-- -----------------------------------------------------------------------------
create table public.categorias_hora (
  id                  uuid primary key default gen_random_uuid(),
  codigo              text not null unique,
  nome                text not null check (length(trim(nome)) > 0),
  ordem               smallint not null default 0,
  fora_do_planejamento boolean not null default false,
  ativo               boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index categorias_hora_nome_key on public.categorias_hora (lower(nome));

comment on column public.categorias_hora.codigo is 'Identificador estável usado pelas regras (ex.: correcao).';
comment on column public.categorias_hora.fora_do_planejamento is
  'Horas desta categoria (ex.: Gestão, Reunião dos líderes) nunca contam como "não planejadas".';

create trigger categorias_hora_updated_at
  before update on public.categorias_hora
  for each row execute function public.set_updated_at();

insert into public.categorias_hora (codigo, nome, ordem, fora_do_planejamento) values
  ('desenvolvimento',   'Desenvolvimento',   1, false),
  ('analise',           'Análise',           2, false),
  ('reuniao',           'Reunião',           3, true),
  ('testes',            'Testes',            4, false),
  ('correcao',          'Correção',          5, false),
  ('documentacao',      'Documentação',      6, false),
  ('gestao',            'Gestão',            7, true),
  ('atividade_interna', 'Atividade interna', 8, false);

-- -----------------------------------------------------------------------------
-- Apontamentos
-- -----------------------------------------------------------------------------
create table public.apontamentos (
  id                          uuid primary key default gen_random_uuid(),
  colaborador_id              uuid not null references public.colaboradores (id)
                                default public.colaborador_atual_id(),
  data                        date not null,
  demanda_id                  uuid not null references public.demandas (id),
  cliente_id                  uuid references public.clientes (id),
  contrato_id                 uuid references public.contratos (id),
  projeto_id                  uuid references public.projetos (id),
  categoria_id                uuid not null references public.categorias_hora (id),
  descricao                   text not null,
  horas                       numeric(4,2) not null check (horas > 0 and horas <= 24),
  classificacao_comercial     public.classificacao_comercial not null default 'a_validar',
  classificacao_validada_em   timestamptz,
  classificacao_validada_por  uuid references public.colaboradores (id) on delete set null,
  status                      public.status_apontamento not null default 'rascunho',
  primeiro_envio_em           timestamptz,
  enviado_em                  timestamptz,
  aprovado_em                 timestamptz,
  aprovado_por                uuid references public.colaboradores (id) on delete set null,
  devolvido_em                timestamptz,
  devolvido_por               uuid references public.colaboradores (id) on delete set null,
  motivo_devolucao            text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  created_by                  uuid references public.colaboradores (id) on delete set null
                                default public.colaborador_atual_id(),
  constraint apontamentos_um_por_dia unique (colaborador_id, demanda_id, data),
  constraint apontamentos_descricao_minima check (length(trim(descricao)) >= 10)
);

create index apontamentos_colaborador_data_idx on public.apontamentos (colaborador_id, data);
create index apontamentos_demanda_idx on public.apontamentos (demanda_id);
create index apontamentos_status_idx on public.apontamentos (status);
create index apontamentos_projeto_idx on public.apontamentos (projeto_id);
create index apontamentos_contrato_idx on public.apontamentos (contrato_id);

comment on table public.apontamentos is
  'Horas apontadas: uma linha por colaborador, demanda e dia. Vínculos copiados da demanda.';
comment on column public.apontamentos.created_at is
  'Momento do registro (base do prazo diário); definido pelo banco, não pelo cliente.';
comment on column public.apontamentos.primeiro_envio_em is
  'Primeiro envio (base do prazo semanal); não muda em reenvios após devolução.';

create trigger apontamentos_updated_at
  before update on public.apontamentos
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Funções de apoio
-- -----------------------------------------------------------------------------
-- Gancho do fechamento mensal (Fase 3). Na Fase 2 nenhum período está fechado.
create or replace function public.periodo_fechado(p_data date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select false
$$;

comment on function public.periodo_fechado(date) is
  'Fase 3: true quando o mês da data estiver fechado. Na Fase 2 sempre false.';

-- Sinalizador das funções do fluxo (passam pelo guarda de colunas).
create or replace function public.alterando_apontamento()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('pmo.alterando_apontamento', true), '') = 'on'
$$;

-- Quem pode aprovar: líder direto do colaborador ou líder da demanda; horas de líder
-- por outro líder ou pelo Proprietário. Nunca as próprias.
create or replace function public.pode_aprovar(p_colaborador_id uuid, p_demanda_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p_colaborador_id <> public.colaborador_atual_id()
       and (
         (public.tem_papel('lider_tecnico')
           and (c.lider_id = public.colaborador_atual_id()
                or d.lider_id = public.colaborador_atual_id()
                or c.papel = 'lider_tecnico'))
         or (public.tem_papel('proprietario') and c.papel = 'lider_tecnico')
       )
    from public.colaboradores c, public.demandas d
    where c.id = p_colaborador_id and d.id = p_demanda_id
  ), false)
$$;

-- Sugestão de classificação comercial pelo contrato (a decisão é do Adm./Proprietário).
create or replace function public.classificacao_sugerida(p_demanda_id uuid)
returns public.classificacao_comercial
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when d.cliente_id is null then 'nao_faturavel'::public.classificacao_comercial
    when coalesce(ct.tipo, cp.tipo) in ('banco_horas', 'sustentacao') then 'banco_horas'
    when coalesce(ct.tipo, cp.tipo) = 'escopo_fechado' or d.projeto_id is not null then 'escopo_projeto'
    else 'a_validar'
  end
  from public.demandas d
  left join public.contratos ct on ct.id = d.contrato_id
  left join public.projetos p on p.id = d.projeto_id
  left join public.contratos cp on cp.id = p.contrato_id
  where d.id = p_demanda_id
$$;

revoke execute on function public.pode_aprovar(uuid, uuid) from anon;
revoke execute on function public.classificacao_sugerida(uuid) from anon;

-- -----------------------------------------------------------------------------
-- Triggers de apontamentos
-- -----------------------------------------------------------------------------
-- Guarda: o autor só cria rascunho e só edita/exclui rascunho ou devolvido, mexendo em
-- data, demanda, categoria, descrição e horas. O resto só pelas funções do fluxo.
create or replace function public.apontamentos_guardar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_livres text[] := array['data', 'demanda_id', 'categoria_id', 'descricao', 'horas',
                           'cliente_id', 'contrato_id', 'projeto_id', 'updated_at'];
begin
  if public.periodo_fechado(coalesce(new.data, old.data))
     or (tg_op = 'UPDATE' and public.periodo_fechado(old.data)) then
    raise exception 'O mês deste apontamento já foi fechado.' using errcode = 'check_violation';
  end if;

  if auth.uid() is null or public.alterando_apontamento() then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    if new.colaborador_id is distinct from public.colaborador_atual_id() then
      raise exception 'Cada pessoa aponta apenas as próprias horas.' using errcode = 'insufficient_privilege';
    end if;
    if new.status <> 'rascunho' or new.classificacao_comercial <> 'a_validar'
       or new.aprovado_por is not null or new.classificacao_validada_por is not null then
      raise exception 'Apontamento novo começa como rascunho, "a validar" e sem aprovação.'
        using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if old.colaborador_id is distinct from public.colaborador_atual_id() then
    raise exception 'Cada pessoa altera apenas os próprios apontamentos.' using errcode = 'insufficient_privilege';
  end if;
  if old.status not in ('rascunho', 'devolvido') then
    raise exception 'Apontamento enviado ou aprovado não pode ser alterado pelo autor.'
      using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' and (to_jsonb(new) - v_livres) is distinct from (to_jsonb(old) - v_livres) then
    raise exception 'Só data, demanda, categoria, descrição e horas podem ser alteradas.'
      using errcode = 'insufficient_privilege';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger apontamentos_guardar
  before insert or update or delete on public.apontamentos
  for each row execute function public.apontamentos_guardar();

-- Copia cliente/contrato/projeto da demanda (histórico estável).
create or replace function public.apontamentos_preencher()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.demanda_id is distinct from old.demanda_id then
    select d.cliente_id, d.contrato_id, d.projeto_id
      into new.cliente_id, new.contrato_id, new.projeto_id
    from public.demandas d where d.id = new.demanda_id;
  end if;
  return new;
end;
$$;

create trigger apontamentos_preencher
  before insert or update on public.apontamentos
  for each row execute function public.apontamentos_preencher();

-- Regras de dado: data não futura, demanda não cancelada, pessoa que aponta, 24h por dia,
-- momento do registro definido pelo banco.
create or replace function public.apontamentos_validar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total numeric;
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.created_at := public.agora();
    else
      new.created_at := old.created_at;
    end if;
  end if;

  if (tg_op = 'INSERT' or new.data is distinct from old.data) and new.data > public.hoje_brasil() then
    raise exception 'Não é possível apontar horas em data futura.' using errcode = 'check_violation';
  end if;

  if tg_op = 'INSERT' or new.demanda_id is distinct from old.demanda_id then
    if exists (select 1 from public.demandas d where d.id = new.demanda_id and d.status = 'cancelada') then
      raise exception 'Demanda cancelada não recebe apontamentos.' using errcode = 'check_violation';
    end if;
  end if;

  if not exists (
    select 1 from public.colaboradores c
    where c.id = new.colaborador_id and c.papel in ('desenvolvedor', 'lider_tecnico')
  ) then
    raise exception 'Apenas desenvolvedores e líderes técnicos apontam horas.' using errcode = 'check_violation';
  end if;

  select coalesce(sum(a.horas), 0) + new.horas into v_total
  from public.apontamentos a
  where a.colaborador_id = new.colaborador_id and a.data = new.data and a.id <> new.id;
  if v_total > 24 then
    raise exception 'O total do dia passaria de 24 horas.' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger apontamentos_validar
  before insert or update on public.apontamentos
  for each row execute function public.apontamentos_validar();

-- -----------------------------------------------------------------------------
-- Auditoria
-- -----------------------------------------------------------------------------
create table public.apontamentos_auditoria (
  id                bigint generated always as identity primary key,
  apontamento_id    uuid not null,
  colaborador_id    uuid not null,
  operacao          text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  campos_alterados  text[] not null default '{}',
  antes             jsonb,
  depois            jsonb,
  motivo            text,
  alterado_por      uuid references public.colaboradores (id) on delete set null,
  alterado_em       timestamptz not null default now()
);

create index apontamentos_auditoria_apontamento_idx on public.apontamentos_auditoria (apontamento_id);

comment on table public.apontamentos_auditoria is
  'Histórico de todas as alterações de apontamentos (gravado por trigger; só leitura).';

create or replace function public.apontamentos_auditar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_depois jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_campos text[];
begin
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(k order by k), '{}') into v_campos
    from jsonb_object_keys(v_depois) k
    where k <> 'updated_at' and v_depois -> k is distinct from v_antes -> k;
    if v_campos = '{}' then
      return null;
    end if;
  end if;

  insert into public.apontamentos_auditoria
    (apontamento_id, colaborador_id, operacao, campos_alterados, antes, depois, motivo, alterado_por, alterado_em)
  values
    (coalesce(new.id, old.id), coalesce(new.colaborador_id, old.colaborador_id), tg_op,
     coalesce(v_campos, '{}'), v_antes, v_depois,
     nullif(current_setting('pmo.motivo_auditoria', true), ''),
     public.colaborador_atual_id(), public.agora());
  return null;
end;
$$;

create trigger apontamentos_auditar
  after insert or update or delete on public.apontamentos
  for each row execute function public.apontamentos_auditar();

-- -----------------------------------------------------------------------------
-- Funções do fluxo
-- -----------------------------------------------------------------------------
-- Autor envia rascunhos e devolvidos. Retorna quantos foram enviados.
create or replace function public.enviar_apontamentos(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qtd integer;
begin
  if exists (
    select 1 from public.apontamentos a
    where a.id = any (p_ids)
      and (a.colaborador_id is distinct from public.colaborador_atual_id()
           or a.status not in ('rascunho', 'devolvido'))
  ) then
    raise exception 'Só é possível enviar os próprios apontamentos em rascunho ou devolvidos.'
      using errcode = 'check_violation';
  end if;

  perform set_config('pmo.alterando_apontamento', 'on', true);
  update public.apontamentos
     set status = 'enviado',
         enviado_em = public.agora(),
         primeiro_envio_em = coalesce(primeiro_envio_em, public.agora())
   where id = any (p_ids);
  get diagnostics v_qtd = row_count;
  perform set_config('pmo.alterando_apontamento', 'off', true);
  return v_qtd;
end;
$$;

-- Aprovador aprova enviados. Classificação: a informada, ou a sugestão do sistema
-- (p_usar_sugestao), sem mexer em classificação já validada pelo comercial.
create or replace function public.aprovar_apontamentos(
  p_ids uuid[],
  p_classificacao public.classificacao_comercial default null,
  p_usar_sugestao boolean default true
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qtd integer;
begin
  if exists (
    select 1 from public.apontamentos a
    where a.id = any (p_ids)
      and (a.status <> 'enviado' or not public.pode_aprovar(a.colaborador_id, a.demanda_id))
  ) then
    raise exception 'Há apontamentos que você não pode aprovar (próprios, de fora da sua equipe/demandas ou não enviados).'
      using errcode = 'insufficient_privilege';
  end if;

  perform set_config('pmo.alterando_apontamento', 'on', true);
  update public.apontamentos a
     set status = 'aprovado',
         aprovado_em = public.agora(),
         aprovado_por = public.colaborador_atual_id(),
         classificacao_comercial = case
           when a.classificacao_validada_em is not null then a.classificacao_comercial
           when p_classificacao is not null then p_classificacao
           when p_usar_sugestao then public.classificacao_sugerida(a.demanda_id)
           else a.classificacao_comercial
         end
   where a.id = any (p_ids);
  get diagnostics v_qtd = row_count;
  perform set_config('pmo.alterando_apontamento', 'off', true);
  return v_qtd;
end;
$$;

-- Devolve um enviado (motivo obrigatório).
create or replace function public.devolver_apontamento(p_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Informe o motivo da devolução.' using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from public.apontamentos a
    where a.id = p_id and a.status = 'enviado' and public.pode_aprovar(a.colaborador_id, a.demanda_id)
  ) then
    raise exception 'Você não pode devolver este apontamento (ou ele não está enviado).'
      using errcode = 'insufficient_privilege';
  end if;

  perform set_config('pmo.alterando_apontamento', 'on', true);
  perform set_config('pmo.motivo_auditoria', trim(p_motivo), true);
  update public.apontamentos
     set status = 'devolvido', devolvido_em = public.agora(),
         devolvido_por = public.colaborador_atual_id(), motivo_devolucao = trim(p_motivo)
   where id = p_id;
  perform set_config('pmo.motivo_auditoria', '', true);
  perform set_config('pmo.alterando_apontamento', 'off', true);
end;
$$;

-- Reabre um aprovado para correção pelo autor (motivo obrigatório; fica na auditoria).
create or replace function public.reabrir_apontamento(p_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Informe o motivo da reabertura.' using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from public.apontamentos a
    where a.id = p_id and a.status = 'aprovado' and public.pode_aprovar(a.colaborador_id, a.demanda_id)
  ) then
    raise exception 'Você não pode reabrir este apontamento (ou ele não está aprovado).'
      using errcode = 'insufficient_privilege';
  end if;

  perform set_config('pmo.alterando_apontamento', 'on', true);
  perform set_config('pmo.motivo_auditoria', trim(p_motivo), true);
  update public.apontamentos
     set status = 'devolvido', aprovado_em = null, aprovado_por = null,
         devolvido_em = public.agora(), devolvido_por = public.colaborador_atual_id(),
         motivo_devolucao = trim(p_motivo)
   where id = p_id;
  perform set_config('pmo.motivo_auditoria', '', true);
  perform set_config('pmo.alterando_apontamento', 'off', true);
end;
$$;

-- Classificação comercial. Líder (aprovador) sugere em enviados/aprovados não validados;
-- Administrativo e Proprietário classificam e validam horas aprovadas.
create or replace function public.classificar_apontamentos(
  p_ids uuid[],
  p_classificacao public.classificacao_comercial,
  p_validar boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comercial boolean := public.tem_papel('administrativo', 'proprietario');
  v_qtd integer;
begin
  if p_validar and not v_comercial then
    raise exception 'Somente Administrativo ou Proprietário validam a classificação comercial.'
      using errcode = 'insufficient_privilege';
  end if;
  if p_validar and p_classificacao = 'a_validar' then
    raise exception 'Escolha uma classificação para validar.' using errcode = 'check_violation';
  end if;

  if v_comercial then
    if exists (select 1 from public.apontamentos a where a.id = any (p_ids) and a.status <> 'aprovado') then
      raise exception 'A classificação comercial é definida sobre horas aprovadas.' using errcode = 'check_violation';
    end if;
  elsif exists (
    select 1 from public.apontamentos a
    where a.id = any (p_ids)
      and (a.status not in ('enviado', 'aprovado')
           or a.classificacao_validada_em is not null
           or not public.pode_aprovar(a.colaborador_id, a.demanda_id))
  ) then
    raise exception 'Você só pode sugerir classificação para horas que aprova e que ainda não foram validadas.'
      using errcode = 'insufficient_privilege';
  end if;

  perform set_config('pmo.alterando_apontamento', 'on', true);
  update public.apontamentos
     set classificacao_comercial = p_classificacao,
         classificacao_validada_em = case when p_validar then public.agora() else classificacao_validada_em end,
         classificacao_validada_por = case when p_validar then public.colaborador_atual_id() else classificacao_validada_por end
   where id = any (p_ids);
  get diagnostics v_qtd = row_count;
  perform set_config('pmo.alterando_apontamento', 'off', true);
  return v_qtd;
end;
$$;

revoke execute on function public.enviar_apontamentos(uuid[]) from anon;
revoke execute on function public.aprovar_apontamentos(uuid[], public.classificacao_comercial, boolean) from anon;
revoke execute on function public.devolver_apontamento(uuid, text) from anon;
revoke execute on function public.reabrir_apontamento(uuid, text) from anon;
revoke execute on function public.classificar_apontamentos(uuid[], public.classificacao_comercial, boolean) from anon;

-- -----------------------------------------------------------------------------
-- Prazos
-- -----------------------------------------------------------------------------
-- Horas indisponíveis num dia (maior indisponibilidade do dia, limitada à jornada diária).
create or replace function public.horas_indisponiveis_dia(p_colaborador_id uuid, p_dia date)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    least(max(coalesce(i.horas_por_dia, c.jornada_semanal / 5)), max(c.jornada_semanal / 5)),
    0)
  from public.colaboradores c
  join public.indisponibilidades i
    on p_dia between i.data_inicio and i.data_fim
   and (i.colaborador_id is null or i.colaborador_id = c.id)
  where c.id = p_colaborador_id
$$;

-- Dia útil da pessoa: segunda a sexta, sem indisponibilidade de dia inteiro (feriado, férias...).
create or replace function public.eh_dia_util(p_colaborador_id uuid, p_dia date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select extract(isodow from p_dia) < 6
     and public.horas_indisponiveis_dia(p_colaborador_id, p_dia)
         < (select c.jornada_semanal / 5 from public.colaboradores c where c.id = p_colaborador_id)
$$;

-- Limite para registrar as horas de um dia: fim (Brasília) do N-ésimo dia útil seguinte.
create or replace function public.prazo_registro(p_colaborador_id uuid, p_dia date)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_faltam integer;
  v_dia date := p_dia;
begin
  select prazo_registro_dias_uteis into v_faltam from public.configuracoes;
  -- Avança até o N-ésimo dia útil seguinte (limite de 60 dias para férias longas).
  while v_faltam > 0 and v_dia < p_dia + 60 loop
    v_dia := v_dia + 1;
    if public.eh_dia_util(p_colaborador_id, v_dia) then
      v_faltam := v_faltam - 1;
    end if;
  end loop;
  -- Fim desse dia em Brasília = início do dia seguinte.
  return (v_dia + 1)::timestamp at time zone 'America/Sao_Paulo';
end;
$$;

-- Limite para enviar a semana: dia/hora configurados da semana seguinte (Brasília).
create or replace function public.prazo_envio_semana(p_segunda date)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_segunda + 7 + (c.prazo_envio_dia_semana - 1))::timestamp + c.prazo_envio_hora)
         at time zone 'America/Sao_Paulo'
  from public.configuracoes c
$$;

-- -----------------------------------------------------------------------------
-- Views
-- -----------------------------------------------------------------------------
-- Apontamento + semana, planejamento e permissão de aprovação.
create view public.v_apontamentos
with (security_invoker = true)
as
select
  a.*,
  date_trunc('week', a.data)::date                       as semana_inicio,
  c.nome                                                 as colaborador_nome,
  d.codigo                                               as demanda_codigo,
  d.titulo                                               as demanda_titulo,
  d.tipo                                                 as demanda_tipo,
  cl.nome                                                as cliente_nome,
  ct.nome                                                as contrato_nome,
  pr.nome                                                as projeto_nome,
  cat.nome                                               as categoria_nome,
  cat.fora_do_planejamento,
  coalesce(pl.horas, 0)                                  as horas_planejadas_semana,
  (pl.horas is null and not cat.fora_do_planejamento)    as nao_planejada,
  public.pode_aprovar(a.colaborador_id, a.demanda_id)    as pode_aprovar,
  public.classificacao_sugerida(a.demanda_id)            as classificacao_sugerida
from public.apontamentos a
join public.colaboradores c on c.id = a.colaborador_id
join public.demandas d on d.id = a.demanda_id
join public.categorias_hora cat on cat.id = a.categoria_id
left join public.clientes cl on cl.id = a.cliente_id
left join public.contratos ct on ct.id = a.contrato_id
left join public.projetos pr on pr.id = a.projeto_id
left join lateral (
  select sum(i.horas_planejadas) as horas
  from public.planejamento_itens i
  join public.semanas s on s.id = i.semana_id
  where s.inicio = date_trunc('week', a.data)::date
    and s.status <> 'rascunho'
    and i.colaborador_id = a.colaborador_id
    and i.demanda_id = a.demanda_id
) pl on true;

comment on view public.v_apontamentos is
  'Apontamentos com nomes, semana, horas planejadas e nao_planejada (sem alocação na semana publicada).';

-- Totais por pessoa e semana.
create view public.v_horas_semana_colaborador
with (security_invoker = true)
as
select
  a.colaborador_id,
  a.colaborador_nome,
  a.semana_inicio,
  sum(a.horas)                                                   as horas_apontadas,
  coalesce(sum(a.horas) filter (where a.status = 'rascunho'), 0)  as horas_rascunho,
  coalesce(sum(a.horas) filter (where a.status = 'enviado'), 0)   as horas_enviadas,
  coalesce(sum(a.horas) filter (where a.status = 'aprovado'), 0)  as horas_aprovadas,
  coalesce(sum(a.horas) filter (where a.status = 'devolvido'), 0) as horas_devolvidas,
  coalesce(sum(a.horas) filter (where a.nao_planejada), 0)        as horas_nao_planejadas,
  (select coalesce(sum(i.horas_planejadas), 0)
     from public.planejamento_itens i
     join public.semanas s on s.id = i.semana_id
    where s.inicio = a.semana_inicio and s.status <> 'rascunho'
      and i.colaborador_id = a.colaborador_id)                  as horas_planejadas
from public.v_apontamentos a
group by a.colaborador_id, a.colaborador_nome, a.semana_inicio;

-- Prazo diário: cada dia útil (desde o início do controle até hoje) de cada pessoa.
create view public.v_prazo_apontamento_dia
with (security_invoker = true)
as
with dias as (
  select p.id as colaborador_id, p.nome as colaborador_nome, d::date as dia
  from public.colaboradores p
  cross join public.configuracoes cfg
  cross join generate_series(cfg.inicio_controle_apontamentos::timestamp,
                             public.hoje_brasil()::timestamp, interval '1 day') d
  where cfg.inicio_controle_apontamentos is not null
    and p.ativo
    and p.papel in ('desenvolvedor', 'lider_tecnico')
    and (public.tem_papel('proprietario', 'lider_tecnico') or p.id = public.colaborador_atual_id())
    and public.eh_dia_util(p.id, d::date)
)
select
  dias.colaborador_id,
  dias.colaborador_nome,
  dias.dia,
  date_trunc('week', dias.dia)::date                     as semana_inicio,
  coalesce(r.horas, 0)                                   as horas_registradas,
  r.primeiro_registro_em,
  pz.prazo,
  r.primeiro_registro_em is null                         as sem_registro,
  case
    when r.primeiro_registro_em is not null and r.primeiro_registro_em < pz.prazo then 'no_prazo'
    when r.primeiro_registro_em is not null then 'atrasado'
    when public.agora() >= pz.prazo then 'atrasado'
    else 'pendente'
  end                                                    as situacao
from dias
cross join lateral (select public.prazo_registro(dias.colaborador_id, dias.dia) as prazo) pz
left join lateral (
  select sum(a.horas) as horas, min(a.created_at) as primeiro_registro_em
  from public.apontamentos a
  where a.colaborador_id = dias.colaborador_id and a.data = dias.dia
) r on true;

comment on view public.v_prazo_apontamento_dia is
  'Cada dia útil por pessoa: no_prazo (primeiro registro antes do prazo), atrasado ou pendente.';

-- Prazo semanal: semana enviada (todos os apontamentos enviados ao menos uma vez) até o limite.
create view public.v_prazo_apontamento_semana
with (security_invoker = true)
as
with por_semana as (
  select
    colaborador_id,
    colaborador_nome,
    semana_inicio,
    count(*)                                         as dias_uteis,
    count(*) filter (where situacao = 'no_prazo')    as dias_no_prazo,
    count(*) filter (where situacao = 'atrasado')    as dias_atrasados,
    count(*) filter (where situacao = 'pendente')    as dias_pendentes,
    count(*) filter (where sem_registro)             as dias_sem_registro
  from public.v_prazo_apontamento_dia
  group by colaborador_id, colaborador_nome, semana_inicio
)
select
  s.*,
  pz.prazo                                                      as prazo_envio,
  coalesce(e.total, 0)                                          as apontamentos,
  coalesce(e.nao_enviados, 0)                                   as apontamentos_nao_enviados,
  e.enviada_em,
  ec.enviada,
  case
    when ec.enviada then case when e.enviada_em <= pz.prazo then 'no_prazo' else 'atrasado' end
    when public.agora() > pz.prazo then 'atrasado'
    else 'pendente'
  end                                                           as situacao
from por_semana s
cross join lateral (select public.prazo_envio_semana(s.semana_inicio) as prazo) pz
left join lateral (
  select count(*) as total,
         count(*) filter (where a.primeiro_envio_em is null) as nao_enviados,
         max(a.primeiro_envio_em) as enviada_em
  from public.apontamentos a
  where a.colaborador_id = s.colaborador_id
    and a.data between s.semana_inicio and s.semana_inicio + 6
) e on true
-- Semana enviada = já chegou à sexta, todo dia útil tem registro e tudo foi enviado ao menos uma vez.
cross join lateral (
  select public.hoje_brasil() >= s.semana_inicio + 4
     and s.dias_sem_registro = 0
     and coalesce(e.total, 0) > 0
     and e.nao_enviados = 0 as enviada
) ec;

comment on view public.v_prazo_apontamento_semana is
  'Envio da semana por pessoa: no_prazo, atrasado ou pendente, com contagem dos dias.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.categorias_hora enable row level security;
alter table public.apontamentos enable row level security;
alter table public.apontamentos_auditoria enable row level security;

create policy "categorias_hora: leitura"
  on public.categorias_hora for select to authenticated
  using (public.papel_atual() is not null);

create policy "categorias_hora: inclusão por proprietário e líder"
  on public.categorias_hora for insert to authenticated
  with check (public.tem_papel('proprietario', 'lider_tecnico'));

create policy "categorias_hora: alteração por proprietário e líder"
  on public.categorias_hora for update to authenticated
  using (public.tem_papel('proprietario', 'lider_tecnico'))
  with check (public.tem_papel('proprietario', 'lider_tecnico'));

-- apontamentos: autor vê os seus; Proprietário e Líder veem todos; Administrativo, os aprovados.
create policy "apontamentos: leitura"
  on public.apontamentos for select to authenticated
  using (
    colaborador_id = public.colaborador_atual_id()
    or public.tem_papel('proprietario', 'lider_tecnico')
    or (public.tem_papel('administrativo') and status = 'aprovado')
  );

create policy "apontamentos: autor inclui"
  on public.apontamentos for insert to authenticated
  with check (public.tem_papel('desenvolvedor', 'lider_tecnico') and colaborador_id = public.colaborador_atual_id());

create policy "apontamentos: autor altera"
  on public.apontamentos for update to authenticated
  using (colaborador_id = public.colaborador_atual_id())
  with check (colaborador_id = public.colaborador_atual_id());

create policy "apontamentos: autor exclui rascunho ou devolvido"
  on public.apontamentos for delete to authenticated
  using (colaborador_id = public.colaborador_atual_id() and status in ('rascunho', 'devolvido'));

create policy "apontamentos_auditoria: leitura"
  on public.apontamentos_auditoria for select to authenticated
  using (colaborador_id = public.colaborador_atual_id() or public.tem_papel('proprietario', 'lider_tecnico'));
