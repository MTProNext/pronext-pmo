-- =============================================================================
-- Etapa 2 da Fase 1: cadastros
-- clientes, contratos, contratos_valores, projetos (mínimo) e indisponibilidades.
-- configuracoes já existe (etapa 1), com o trigger de guarda por coluna.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.tipo_contrato as enum ('banco_horas', 'escopo_fechado', 'sustentacao', 'outro');
create type public.periodicidade_horas as enum ('total', 'mensal');
create type public.status_contrato as enum ('ativo', 'suspenso', 'encerrado');
create type public.status_projeto as enum (
  'nao_iniciado', 'em_descoberta', 'planejamento', 'em_execucao',
  'em_homologacao', 'bloqueado', 'concluido', 'cancelado'
);
create type public.tipo_indisponibilidade as enum ('ferias', 'feriado', 'ausencia', 'treinamento', 'outra');

-- -----------------------------------------------------------------------------
-- Auxiliar: o colaborador é um líder técnico ativo?
-- -----------------------------------------------------------------------------
create or replace function public.eh_lider_tecnico_ativo(p_colaborador_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.colaboradores c
    where c.id = p_colaborador_id and c.papel = 'lider_tecnico' and c.ativo
  )
$$;

revoke execute on function public.eh_lider_tecnico_ativo(uuid) from anon;

-- -----------------------------------------------------------------------------
-- Clientes
-- -----------------------------------------------------------------------------
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(trim(nome)) > 0),
  documento   text,
  contato     text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.colaboradores (id) on delete set null
                default public.colaborador_atual_id()
);

create unique index clientes_nome_key on public.clientes (lower(nome));

comment on table public.clientes is 'Clientes da ProNext.';
comment on column public.clientes.documento is 'CNPJ ou outro documento (opcional).';

create trigger clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Contratos
-- -----------------------------------------------------------------------------
create table public.contratos (
  id                   uuid primary key default gen_random_uuid(),
  cliente_id           uuid not null references public.clientes (id),
  nome                 text not null check (length(trim(nome)) > 0),
  tipo                 public.tipo_contrato not null,
  horas_contratadas    numeric(8,2) check (horas_contratadas >= 0),
  periodicidade_horas  public.periodicidade_horas not null default 'total',
  vigencia_inicio      date not null,
  vigencia_fim         date,
  status               public.status_contrato not null default 'ativo',
  observacoes          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid references public.colaboradores (id) on delete set null
                         default public.colaborador_atual_id(),
  constraint contratos_vigencia_valida check (vigencia_fim is null or vigencia_fim >= vigencia_inicio),
  constraint contratos_banco_horas_exige_horas check (tipo <> 'banco_horas' or horas_contratadas is not null)
);

create unique index contratos_cliente_nome_key on public.contratos (cliente_id, lower(nome));
create index contratos_cliente_idx on public.contratos (cliente_id);

comment on table public.contratos is 'Contratos por cliente. Valor/hora fica em contratos_valores (acesso restrito).';
comment on column public.contratos.horas_contratadas is
  'Horas contratadas; por mês quando periodicidade_horas = mensal, senão na vigência toda.';

create trigger contratos_updated_at
  before update on public.contratos
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Valores dos contratos (1:1). Separado para esconder o valor/hora via RLS.
-- -----------------------------------------------------------------------------
create table public.contratos_valores (
  contrato_id  uuid primary key references public.contratos (id) on delete cascade,
  valor_hora   numeric(12,2) not null check (valor_hora >= 0),
  updated_at   timestamptz not null default now()
);

comment on table public.contratos_valores is 'Valor/hora do contrato. Visível só para Proprietário e Administrativo.';

create trigger contratos_valores_updated_at
  before update on public.contratos_valores
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Projetos (versão mínima; a ficha completa vem na Fase 2)
-- -----------------------------------------------------------------------------
create table public.projetos (
  id                    uuid primary key default gen_random_uuid(),
  cliente_id            uuid not null references public.clientes (id),
  contrato_id           uuid references public.contratos (id),
  nome                  text not null check (length(trim(nome)) > 0),
  lider_id              uuid not null references public.colaboradores (id),
  status                public.status_projeto not null default 'nao_iniciado',
  data_inicio_prevista  date,
  data_fim_prevista     date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references public.colaboradores (id) on delete set null
                          default public.colaborador_atual_id(),
  constraint projetos_datas_validas check (
    data_fim_prevista is null or data_inicio_prevista is null or data_fim_prevista >= data_inicio_prevista
  )
);

create unique index projetos_cliente_nome_key on public.projetos (cliente_id, lower(nome));
create index projetos_cliente_idx on public.projetos (cliente_id);
create index projetos_lider_idx on public.projetos (lider_id);

comment on table public.projetos is 'Projetos (versão mínima). lider_id é o único líder accountable.';

create trigger projetos_updated_at
  before update on public.projetos
  for each row execute function public.set_updated_at();

-- Líder precisa ser líder técnico ativo; contrato precisa ser do mesmo cliente.
create or replace function public.projetos_validar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.eh_lider_tecnico_ativo(new.lider_id) then
    raise exception 'O líder do projeto precisa ser um líder técnico ativo.'
      using errcode = 'check_violation';
  end if;

  if new.contrato_id is not null and not exists (
    select 1 from public.contratos c
    where c.id = new.contrato_id and c.cliente_id = new.cliente_id
  ) then
    raise exception 'O contrato informado não pertence ao cliente do projeto.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger projetos_validar
  before insert or update of lider_id, contrato_id, cliente_id on public.projetos
  for each row execute function public.projetos_validar();

-- -----------------------------------------------------------------------------
-- Indisponibilidades
-- -----------------------------------------------------------------------------
create table public.indisponibilidades (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid references public.colaboradores (id) on delete cascade,
  tipo            public.tipo_indisponibilidade not null,
  data_inicio     date not null,
  data_fim        date not null,
  horas_por_dia   numeric(4,2) check (horas_por_dia > 0 and horas_por_dia <= 24),
  descricao       text,
  localidade      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references public.colaboradores (id) on delete set null
                    default public.colaborador_atual_id(),
  constraint indisponibilidades_periodo_valido check (data_fim >= data_inicio),
  constraint indisponibilidades_global_so_feriado check (colaborador_id is not null or tipo = 'feriado')
);

create index indisponibilidades_colaborador_idx on public.indisponibilidades (colaborador_id);
create index indisponibilidades_periodo_idx on public.indisponibilidades (data_inicio, data_fim);

comment on table public.indisponibilidades is
  'Férias, feriados, ausências e treinamentos. colaborador_id nulo = global (só feriados).';
comment on column public.indisponibilidades.horas_por_dia is
  'Horas indisponíveis por dia útil. Nulo = dia inteiro (jornada semanal ÷ 5).';
comment on column public.indisponibilidades.localidade is
  'Abrangência informativa do feriado (Nacional, SP, São José dos Campos...).';

create trigger indisponibilidades_updated_at
  before update on public.indisponibilidades
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.clientes enable row level security;
alter table public.contratos enable row level security;
alter table public.contratos_valores enable row level security;
alter table public.projetos enable row level security;
alter table public.indisponibilidades enable row level security;

-- clientes: todos leem; Proprietário, Administrativo e Líder gravam.
create policy "clientes: leitura por colaboradores ativos"
  on public.clientes for select to authenticated
  using (public.papel_atual() is not null);

create policy "clientes: inclusão por proprietário, administrativo e líder"
  on public.clientes for insert to authenticated
  with check (public.tem_papel('proprietario', 'administrativo', 'lider_tecnico'));

create policy "clientes: alteração por proprietário, administrativo e líder"
  on public.clientes for update to authenticated
  using (public.tem_papel('proprietario', 'administrativo', 'lider_tecnico'))
  with check (public.tem_papel('proprietario', 'administrativo', 'lider_tecnico'));

-- contratos: todos leem; Proprietário e Administrativo gravam.
create policy "contratos: leitura por colaboradores ativos"
  on public.contratos for select to authenticated
  using (public.papel_atual() is not null);

create policy "contratos: inclusão por proprietário e administrativo"
  on public.contratos for insert to authenticated
  with check (public.tem_papel('proprietario', 'administrativo'));

create policy "contratos: alteração por proprietário e administrativo"
  on public.contratos for update to authenticated
  using (public.tem_papel('proprietario', 'administrativo'))
  with check (public.tem_papel('proprietario', 'administrativo'));

-- contratos_valores: só Proprietário e Administrativo (leitura e escrita).
create policy "contratos_valores: acesso de proprietário e administrativo"
  on public.contratos_valores for all to authenticated
  using (public.tem_papel('proprietario', 'administrativo'))
  with check (public.tem_papel('proprietario', 'administrativo'));

-- projetos: todos leem; Proprietário e Líder gravam.
create policy "projetos: leitura por colaboradores ativos"
  on public.projetos for select to authenticated
  using (public.papel_atual() is not null);

create policy "projetos: inclusão por proprietário e líder"
  on public.projetos for insert to authenticated
  with check (public.tem_papel('proprietario', 'lider_tecnico'));

create policy "projetos: alteração por proprietário e líder"
  on public.projetos for update to authenticated
  using (public.tem_papel('proprietario', 'lider_tecnico'))
  with check (public.tem_papel('proprietario', 'lider_tecnico'));

-- indisponibilidades: gestão por Proprietário, Líder e Administrativo;
-- desenvolvedor lê as suas e as globais.
create policy "indisponibilidades: leitura"
  on public.indisponibilidades for select to authenticated
  using (
    public.tem_papel('proprietario', 'lider_tecnico', 'administrativo')
    or (
      public.papel_atual() is not null
      and (colaborador_id is null or colaborador_id = public.colaborador_atual_id())
    )
  );

create policy "indisponibilidades: inclusão por gestão"
  on public.indisponibilidades for insert to authenticated
  with check (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo'));

create policy "indisponibilidades: alteração por gestão"
  on public.indisponibilidades for update to authenticated
  using (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo'))
  with check (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo'));

create policy "indisponibilidades: exclusão por gestão"
  on public.indisponibilidades for delete to authenticated
  using (public.tem_papel('proprietario', 'lider_tecnico', 'administrativo'));
