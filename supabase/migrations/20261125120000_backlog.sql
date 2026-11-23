-- =============================================================================
-- Etapa 3 da Fase 1: backlog de demandas
-- =============================================================================

create type public.prioridade as enum ('p1', 'p2', 'p3', 'p4');
create type public.status_demanda as enum (
  'nova', 'priorizada', 'planejada', 'em_execucao', 'bloqueada', 'concluida', 'cancelada'
);
create type public.tipo_demanda as enum ('demanda', 'urgencia', 'correcao', 'atividade_interna');

create table public.demandas (
  id                uuid primary key default gen_random_uuid(),
  codigo            integer generated always as identity unique,
  titulo            text not null check (length(trim(titulo)) > 0),
  descricao         text,
  cliente_id        uuid references public.clientes (id),
  contrato_id       uuid references public.contratos (id),
  projeto_id        uuid references public.projetos (id),
  solicitante       text,
  data_entrada      date not null default current_date,
  prioridade        public.prioridade not null default 'p3',
  lider_id          uuid not null references public.colaboradores (id),
  estimativa_horas  numeric(7,2) check (estimativa_horas >= 0),
  status            public.status_demanda not null default 'nova',
  tipo              public.tipo_demanda not null default 'demanda',
  concluida_em      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references public.colaboradores (id) on delete set null
                      default public.colaborador_atual_id(),
  -- Demanda interna (sem cliente) não tem contrato nem projeto.
  constraint demandas_interna_sem_contrato_projeto check (
    cliente_id is not null or (contrato_id is null and projeto_id is null)
  ),
  -- Atividade interna nunca tem cliente.
  constraint demandas_atividade_interna_sem_cliente check (
    tipo <> 'atividade_interna' or cliente_id is null
  )
);

create index demandas_status_idx on public.demandas (status);
create index demandas_prioridade_idx on public.demandas (prioridade);
create index demandas_cliente_idx on public.demandas (cliente_id);
create index demandas_projeto_idx on public.demandas (projeto_id);
create index demandas_lider_idx on public.demandas (lider_id);

comment on table public.demandas is 'Backlog de demandas. cliente_id nulo = Interno.';
comment on column public.demandas.codigo is 'Número sequencial exibido como DEM-0001.';
comment on column public.demandas.estimativa_horas is 'Estimativa em horas; nulo = "a definir".';
comment on column public.demandas.lider_id is 'Único líder accountable pela demanda.';

create trigger demandas_updated_at
  before update on public.demandas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Validações e preenchimentos automáticos
-- -----------------------------------------------------------------------------
create or replace function public.demandas_validar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_projeto record;
begin
  if not public.eh_lider_tecnico_ativo(new.lider_id) then
    raise exception 'O líder da demanda precisa ser um líder técnico ativo.'
      using errcode = 'check_violation';
  end if;

  if new.contrato_id is not null and not exists (
    select 1 from public.contratos c where c.id = new.contrato_id and c.cliente_id = new.cliente_id
  ) then
    raise exception 'O contrato informado não pertence ao cliente da demanda.'
      using errcode = 'check_violation';
  end if;

  if new.projeto_id is not null then
    select p.cliente_id, p.contrato_id into v_projeto
    from public.projetos p where p.id = new.projeto_id;

    if v_projeto.cliente_id is distinct from new.cliente_id then
      raise exception 'O projeto informado não pertence ao cliente da demanda.'
        using errcode = 'check_violation';
    end if;

    -- Herda o contrato do projeto quando não informado.
    if new.contrato_id is null then
      new.contrato_id := v_projeto.contrato_id;
    elsif v_projeto.contrato_id is not null and v_projeto.contrato_id <> new.contrato_id then
      raise exception 'O contrato informado é diferente do contrato do projeto.'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Data de conclusão acompanha o status.
  if new.status = 'concluida' then
    if tg_op = 'INSERT' or old.status is distinct from 'concluida' then
      new.concluida_em := now();
    end if;
  else
    new.concluida_em := null;
  end if;

  return new;
end;
$$;

create trigger demandas_validar
  before insert or update on public.demandas
  for each row execute function public.demandas_validar();

-- -----------------------------------------------------------------------------
-- RLS
-- Todos os colaboradores ativos leem o backlog inteiro (desenvolvedor em modo leitura).
-- Proprietário e Líder técnico criam e alteram. Ninguém exclui (usar status cancelada).
-- A alteração de status pelo desenvolvedor alocado entra na etapa 4 (planejamento).
-- -----------------------------------------------------------------------------
alter table public.demandas enable row level security;

create policy "demandas: leitura por colaboradores ativos"
  on public.demandas for select to authenticated
  using (public.papel_atual() is not null);

create policy "demandas: inclusão por proprietário e líder"
  on public.demandas for insert to authenticated
  with check (public.tem_papel('proprietario', 'lider_tecnico'));

create policy "demandas: alteração por proprietário e líder"
  on public.demandas for update to authenticated
  using (public.tem_papel('proprietario', 'lider_tecnico'))
  with check (public.tem_papel('proprietario', 'lider_tecnico'));
