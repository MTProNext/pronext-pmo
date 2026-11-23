-- =============================================================================
-- Seed do ambiente local. Aplicado por `npm run db:reset` depois das migrations.
-- Dados fictícios. Senha de todos os usuários de teste: Teste@123
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Colaboradores: Proprietário, Administrativo, 2 líderes e 5 desenvolvedores
-- -----------------------------------------------------------------------------
insert into public.colaboradores
  (id, nome, email, papel, lider_id, jornada_semanal, horas_dev_semanais, senioridade, competencias)
values
  ('00000000-0000-4000-a000-000000000001', 'Paulo Almeida',  'proprietario@example.com', 'proprietario',   null, 40, 0,  null,           '{}'),
  ('00000000-0000-4000-a000-000000000002', 'Carla Mendes',   'administrativo@example.com', 'administrativo', null, 40, 0,  null,           '{}'),
  ('00000000-0000-4000-a000-000000000011', 'Rafael Souza',   'lider1@example.com', 'lider_tecnico',  null, 40, 26, 'especialista', '{React,Node,Postgres,Arquitetura}'),
  ('00000000-0000-4000-a000-000000000012', 'Juliana Costa',  'lider2@example.com', 'lider_tecnico',  null, 40, 26, 'especialista', '{.NET,SQL Server,Integrações}');

insert into public.colaboradores
  (id, nome, email, papel, lider_id, jornada_semanal, horas_dev_semanais, senioridade, competencias)
values
  ('00000000-0000-4000-a000-000000000021', 'Bruno Lima',     'dev1@example.com', 'desenvolvedor', '00000000-0000-4000-a000-000000000011', 40, 40, 'senior', '{React,TypeScript}'),
  ('00000000-0000-4000-a000-000000000022', 'Fernanda Rocha', 'dev2@example.com', 'desenvolvedor', '00000000-0000-4000-a000-000000000011', 40, 40, 'pleno',  '{React,Node}'),
  ('00000000-0000-4000-a000-000000000023', 'Diego Martins',  'dev3@example.com', 'desenvolvedor', '00000000-0000-4000-a000-000000000011', 40, 40, 'junior', '{TypeScript,Testes}'),
  ('00000000-0000-4000-a000-000000000024', 'Aline Ferreira', 'dev4@example.com', 'desenvolvedor', '00000000-0000-4000-a000-000000000012', 40, 40, 'senior', '{.NET,SQL Server}'),
  ('00000000-0000-4000-a000-000000000025', 'Thiago Ribeiro', 'dev5@example.com', 'desenvolvedor', '00000000-0000-4000-a000-000000000012', 40, 40, 'pleno',  '{.NET,Integrações}');

-- -----------------------------------------------------------------------------
-- Usuários de teste (Supabase Auth). O trigger on_auth_user_created_vincular_colaborador
-- liga cada usuário ao colaborador de mesmo e-mail.
-- -----------------------------------------------------------------------------
with usuarios (id, email) as (
  values
    ('00000000-0000-4000-b000-000000000001'::uuid, 'proprietario@example.com'),
    ('00000000-0000-4000-b000-000000000002'::uuid, 'administrativo@example.com'),
    ('00000000-0000-4000-b000-000000000011'::uuid, 'lider1@example.com'),
    ('00000000-0000-4000-b000-000000000012'::uuid, 'lider2@example.com'),
    ('00000000-0000-4000-b000-000000000021'::uuid, 'dev1@example.com'),
    ('00000000-0000-4000-b000-000000000022'::uuid, 'dev2@example.com'),
    ('00000000-0000-4000-b000-000000000023'::uuid, 'dev3@example.com'),
    ('00000000-0000-4000-b000-000000000024'::uuid, 'dev4@example.com'),
    ('00000000-0000-4000-b000-000000000025'::uuid, 'dev5@example.com')
),
novos as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  )
  select
    '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
    extensions.crypt('Teste@123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', '', '', '', '', ''
  from usuarios u
  returning id, email
)
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select n.id::text, n.id,
       jsonb_build_object('sub', n.id::text, 'email', n.email, 'email_verified', true),
       'email', now(), now(), now()
from novos n;

-- =============================================================================
-- Etapa 2: cadastros
-- =============================================================================

-- Clientes
insert into public.clientes (id, nome, documento, contato) values
  ('00000000-0000-4000-c000-000000000001', 'Cliente A', '11.111.111/0001-11', 'Marina Prado (marina@clientea.example.com)'),
  ('00000000-0000-4000-c000-000000000002', 'Cliente B', '22.222.222/0001-22', 'Otávio Reis (otavio@clienteb.example.com)');

-- Contratos (um de cada tipo + um encerrado)
insert into public.contratos
  (id, cliente_id, nome, tipo, horas_contratadas, periodicidade_horas, vigencia_inicio, vigencia_fim, status, observacoes)
values
  ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-c000-000000000001',
   'Banco de horas 2027', 'banco_horas', 400, 'total', '2027-01-01', '2027-12-31', 'ativo', null),
  ('00000000-0000-4000-d000-000000000002', '00000000-0000-4000-c000-000000000001',
   'Sustentação mensal', 'sustentacao', 40, 'mensal', '2026-07-01', null, 'ativo', 'Suporte e correções do sistema legado.'),
  ('00000000-0000-4000-d000-000000000003', '00000000-0000-4000-c000-000000000002',
   'Projeto C - escopo fechado', 'escopo_fechado', 600, 'total', '2026-11-01', '2027-04-30', 'ativo', null),
  ('00000000-0000-4000-d000-000000000004', '00000000-0000-4000-c000-000000000002',
   'Consultoria avulsa', 'outro', null, 'total', '2026-10-01', null, 'ativo', 'Horas sob demanda, sem franquia.'),
  ('00000000-0000-4000-d000-000000000005', '00000000-0000-4000-c000-000000000002',
   'Banco de horas 2026', 'banco_horas', 200, 'total', '2026-01-01', '2026-10-31', 'encerrado', null);

insert into public.contratos_valores (contrato_id, valor_hora) values
  ('00000000-0000-4000-d000-000000000001', 180),
  ('00000000-0000-4000-d000-000000000002', 150),
  ('00000000-0000-4000-d000-000000000003', 200),
  ('00000000-0000-4000-d000-000000000004', 220),
  ('00000000-0000-4000-d000-000000000005', 170);

-- Projeto C (Cliente B), liderado por Rafael Souza
insert into public.projetos
  (id, cliente_id, contrato_id, nome, lider_id, status, data_inicio_prevista, data_fim_prevista)
values
  ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-c000-000000000002',
   '00000000-0000-4000-d000-000000000003', 'Projeto C', '00000000-0000-4000-a000-000000000011',
   'em_execucao', '2026-11-03', '2027-04-30');

-- Feriados 2027 (globais): nacionais, estadual (SP) e municipais (São José dos Campos e Jacareí)
insert into public.indisponibilidades (tipo, data_inicio, data_fim, descricao, localidade) values
  ('feriado', '2027-01-01', '2027-01-01', 'Confraternização Universal', 'Nacional'),
  ('feriado', '2027-03-26', '2027-03-26', 'Sexta-feira Santa', 'Nacional'),
  ('feriado', '2027-04-21', '2027-04-21', 'Tiradentes', 'Nacional'),
  ('feriado', '2027-05-01', '2027-05-01', 'Dia do Trabalho', 'Nacional'),
  ('feriado', '2027-09-07', '2027-09-07', 'Independência do Brasil', 'Nacional'),
  ('feriado', '2027-10-12', '2027-10-12', 'Nossa Senhora Aparecida', 'Nacional'),
  ('feriado', '2027-11-02', '2027-11-02', 'Finados', 'Nacional'),
  ('feriado', '2027-11-15', '2027-11-15', 'Proclamação da República', 'Nacional'),
  ('feriado', '2027-11-20', '2027-11-20', 'Dia Nacional de Zumbi e da Consciência Negra', 'Nacional'),
  ('feriado', '2027-12-25', '2027-12-25', 'Natal', 'Nacional'),
  ('feriado', '2027-07-09', '2027-07-09', 'Revolução Constitucionalista', 'SP'),
  ('feriado', '2027-03-19', '2027-03-19', 'Dia de São José, padroeiro (Lei 8.821/2012)', 'São José dos Campos'),
  ('feriado', '2027-07-27', '2027-07-27', 'Aniversário da cidade (Lei 1.324/1967)', 'São José dos Campos'),
  ('feriado', '2027-04-03', '2027-04-03', 'Aniversário da cidade', 'Jacareí');

-- Férias, ausências e treinamentos individuais
insert into public.indisponibilidades (colaborador_id, tipo, data_inicio, data_fim, horas_por_dia, descricao) values
  ('00000000-0000-4000-a000-000000000021', 'ferias',      '2026-12-21', '2026-12-31', null, 'Férias de fim de ano'),
  ('00000000-0000-4000-a000-000000000022', 'ferias',      '2027-01-11', '2027-01-22', null, 'Férias'),
  ('00000000-0000-4000-a000-000000000023', 'treinamento', '2026-12-02', '2026-12-03', null, 'Curso de testes automatizados'),
  ('00000000-0000-4000-a000-000000000024', 'ferias',      '2027-02-15', '2027-02-26', null, 'Férias'),
  ('00000000-0000-4000-a000-000000000025', 'ausencia',    '2026-12-04', '2026-12-04', null, 'Assunto pessoal'),
  ('00000000-0000-4000-a000-000000000012', 'ausencia',    '2026-12-09', '2026-12-09', 4,    'Consulta médica (meio período)');
