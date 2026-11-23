-- =============================================================================
-- Etapa 1 da Fase 1: base de acesso
-- Enums de pessoas, colaboradores (perfil ligado ao Auth), funções auxiliares
-- de RLS, configurações (linha única) e políticas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.papel as enum (
  'proprietario',
  'lider_tecnico',
  'desenvolvedor',
  'administrativo'
);

create type public.senioridade as enum (
  'junior',
  'pleno',
  'senior',
  'especialista'
);

-- -----------------------------------------------------------------------------
-- Utilitário: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Colaboradores (cadastro de pessoas + perfil de acesso)
-- -----------------------------------------------------------------------------
create table public.colaboradores (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references auth.users (id) on delete set null,
  nome                text not null check (length(trim(nome)) > 0),
  email               text not null,
  papel               public.papel not null,
  lider_id            uuid references public.colaboradores (id) on delete set null,
  jornada_semanal     numeric(5,2) not null default 40 check (jornada_semanal >= 0),
  horas_dev_semanais  numeric(5,2) not null default 0 check (horas_dev_semanais >= 0),
  senioridade         public.senioridade,
  competencias        text[] not null default '{}',
  ativo               boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint colaboradores_horas_dev_ate_jornada check (horas_dev_semanais <= jornada_semanal),
  constraint colaboradores_lider_nao_e_si_mesmo check (lider_id is null or lider_id <> id)
);

create unique index colaboradores_email_key on public.colaboradores (lower(email));
create index colaboradores_lider_idx on public.colaboradores (lider_id);

comment on table public.colaboradores is
  'Pessoas da operação. papel define o perfil de acesso; user_id liga ao Supabase Auth (opcional).';
comment on column public.colaboradores.horas_dev_semanais is
  'Horas semanais disponíveis para desenvolvimento (dev 40, líder 26, demais 0).';
comment on column public.colaboradores.lider_id is
  'Líder técnico direto; define a equipe do líder.';

create trigger colaboradores_updated_at
  before update on public.colaboradores
  for each row execute function public.set_updated_at();

-- lider_id precisa apontar para um líder técnico
create or replace function public.colaboradores_validar_lider()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.lider_id is not null and not exists (
    select 1 from public.colaboradores c
    where c.id = new.lider_id and c.papel = 'lider_tecnico'
  ) then
    raise exception 'O líder informado precisa ter o papel de líder técnico.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger colaboradores_validar_lider
  before insert or update of lider_id on public.colaboradores
  for each row execute function public.colaboradores_validar_lider();

-- -----------------------------------------------------------------------------
-- Vínculo automático entre auth.users e colaboradores pelo e-mail
-- -----------------------------------------------------------------------------
-- Colaborador criado depois do usuário: procura o usuário pelo e-mail.
create or replace function public.colaboradores_vincular_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null then
    select u.id into new.user_id
    from auth.users u
    where lower(u.email) = lower(new.email);
  end if;
  return new;
end;
$$;

create trigger colaboradores_vincular_usuario
  before insert or update of email on public.colaboradores
  for each row execute function public.colaboradores_vincular_usuario();

-- Usuário criado depois do colaborador: liga ao colaborador com o mesmo e-mail.
create or replace function public.vincular_colaborador_ao_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.colaboradores
     set user_id = new.id
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$;

create trigger on_auth_user_created_vincular_colaborador
  after insert on auth.users
  for each row execute function public.vincular_colaborador_ao_usuario();

-- -----------------------------------------------------------------------------
-- Funções auxiliares de RLS (security definer evita recursão nas políticas)
-- -----------------------------------------------------------------------------
create or replace function public.papel_atual()
returns public.papel
language sql
stable
security definer
set search_path = ''
as $$
  select c.papel
  from public.colaboradores c
  where c.user_id = auth.uid() and c.ativo
$$;

create or replace function public.colaborador_atual_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.colaboradores c
  where c.user_id = auth.uid() and c.ativo
$$;

create or replace function public.tem_papel(variadic papeis public.papel[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.papel_atual() = any (papeis), false)
$$;

-- O usuário atual é líder direto do colaborador informado?
create or replace function public.lidera(p_colaborador_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.colaboradores c
    where c.id = p_colaborador_id
      and c.lider_id = public.colaborador_atual_id()
  )
$$;

revoke execute on function public.papel_atual() from anon;
revoke execute on function public.colaborador_atual_id() from anon;
revoke execute on function public.tem_papel(public.papel[]) from anon;
revoke execute on function public.lidera(uuid) from anon;

-- -----------------------------------------------------------------------------
-- Configurações (linha única)
-- -----------------------------------------------------------------------------
create table public.configuracoes (
  id                                   boolean primary key default true check (id),
  pct_planejado                        numeric(5,2) not null default 70 check (pct_planejado between 0 and 100),
  pct_reserva                          numeric(5,2) not null default 20 check (pct_reserva between 0 and 100),
  pct_interno                          numeric(5,2) not null default 10 check (pct_interno between 0 and 100),
  dia_limite_fechamento                smallint not null default 5 check (dia_limite_fechamento between 1 and 28),
  dias_alerta_projeto_sem_atualizacao  smallint not null default 7 check (dias_alerta_projeto_sem_atualizacao > 0),
  pct_alerta_contrato                  numeric(5,2) not null default 80 check (pct_alerta_contrato between 0 and 100),
  updated_at                           timestamptz not null default now(),
  updated_by                           uuid references public.colaboradores (id) on delete set null,
  constraint configuracoes_faixas_somam_100 check (pct_planejado + pct_reserva + pct_interno = 100)
);

comment on table public.configuracoes is 'Configurações globais do PMO (linha única, id = true).';
comment on column public.configuracoes.dia_limite_fechamento is
  'Dia do mês seguinte até o qual o mês pode ser fechado. Só Proprietário e Administrativo alteram.';

insert into public.configuracoes (id) values (true);

create trigger configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- Guarda por coluna: faixas e alertas (Proprietário, Líder técnico);
-- dia_limite_fechamento (Proprietário, Administrativo).
-- Sem usuário autenticado (migrations, seed, service role) não há restrição.
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
      new.dias_alerta_projeto_sem_atualizacao, new.pct_alerta_contrato)
     is distinct from
     (old.pct_planejado, old.pct_reserva, old.pct_interno,
      old.dias_alerta_projeto_sem_atualizacao, old.pct_alerta_contrato)
     and v_papel is distinct from 'proprietario'
     and v_papel is distinct from 'lider_tecnico' then
    raise exception 'Somente Proprietário ou Líder técnico podem alterar faixas de capacidade e alertas.'
      using errcode = 'insufficient_privilege';
  end if;

  new.updated_by := public.colaborador_atual_id();
  return new;
end;
$$;

create trigger configuracoes_guardar_colunas
  before update on public.configuracoes
  for each row execute function public.configuracoes_guardar_colunas();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.colaboradores enable row level security;
alter table public.configuracoes enable row level security;

-- colaboradores: todo colaborador ativo lê; Proprietário e Administrativo gravam.
create policy "colaboradores: leitura por colaboradores ativos"
  on public.colaboradores for select
  to authenticated
  using (public.papel_atual() is not null);

create policy "colaboradores: inclusão por proprietário e administrativo"
  on public.colaboradores for insert
  to authenticated
  with check (public.tem_papel('proprietario', 'administrativo'));

create policy "colaboradores: alteração por proprietário e administrativo"
  on public.colaboradores for update
  to authenticated
  using (public.tem_papel('proprietario', 'administrativo'))
  with check (public.tem_papel('proprietario', 'administrativo'));

-- configuracoes: todos leem; alteram Proprietário, Líder e Administrativo
-- (o trigger configuracoes_guardar_colunas restringe as colunas de cada um).
create policy "configuracoes: leitura por colaboradores ativos"
  on public.configuracoes for select
  to authenticated
  using (public.papel_atual() is not null);

create policy "configuracoes: alteração por proprietário, líder e administrativo"
  on public.configuracoes for update
  to authenticated
  using (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo'))
  with check (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo'));
