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
  ('feriado', '2027-04-03', '2027-04-03', 'Aniversário da cidade', 'Jacareí'),
  -- Pontos facultativos adotados pela ProNext
  ('feriado', '2027-02-08', '2027-02-09', 'Carnaval (ponto facultativo)', 'Nacional'),
  ('feriado', '2027-05-27', '2027-05-27', 'Corpus Christi (ponto facultativo)', 'Nacional');

-- Férias, ausências e treinamentos individuais
insert into public.indisponibilidades (colaborador_id, tipo, data_inicio, data_fim, horas_por_dia, descricao) values
  ('00000000-0000-4000-a000-000000000021', 'ferias',      '2026-12-21', '2026-12-31', null, 'Férias de fim de ano'),
  ('00000000-0000-4000-a000-000000000022', 'ferias',      '2027-01-11', '2027-01-22', null, 'Férias'),
  ('00000000-0000-4000-a000-000000000023', 'treinamento', '2026-12-02', '2026-12-03', null, 'Curso de testes automatizados'),
  ('00000000-0000-4000-a000-000000000024', 'ferias',      '2027-02-15', '2027-02-26', null, 'Férias'),
  ('00000000-0000-4000-a000-000000000025', 'ausencia',    '2026-12-04', '2026-12-04', null, 'Assunto pessoal'),
  ('00000000-0000-4000-a000-000000000012', 'ausencia',    '2026-12-09', '2026-12-09', 4,    'Consulta médica (meio período)');

-- =============================================================================
-- Etapa 3: backlog de demandas
-- Líderes: Rafael (…011) e Juliana (…012). Cliente A (…c001), Cliente B (…c002).
-- Contratos: A banco de horas (…d001), A sustentação (…d002), B Projeto C (…d003),
-- B consultoria (…d004). Projeto C (…e001).
-- =============================================================================
insert into public.demandas
  (id, titulo, descricao, cliente_id, contrato_id, projeto_id, solicitante, data_entrada,
   prioridade, lider_id, estimativa_horas, status, tipo)
values
  ('00000000-0000-4000-f000-000000000001', 'Módulo de cadastro de pedidos',
   'Telas e API de cadastro de pedidos do Projeto C.',
   '00000000-0000-4000-c000-000000000002', null, '00000000-0000-4000-e000-000000000001',
   'Otávio Reis', '2026-11-03', 'p2', '00000000-0000-4000-a000-000000000011', 80, 'em_execucao', 'demanda'),
  ('00000000-0000-4000-f000-000000000002', 'Integração com ERP do cliente',
   'Envio de pedidos aprovados ao ERP via API REST.',
   '00000000-0000-4000-c000-000000000002', null, '00000000-0000-4000-e000-000000000001',
   'Otávio Reis', '2026-11-03', 'p2', '00000000-0000-4000-a000-000000000011', 120, 'planejada', 'demanda'),
  ('00000000-0000-4000-f000-000000000003', 'Relatórios gerenciais do Projeto C',
   'Escopo ainda em discussão com o cliente.',
   '00000000-0000-4000-c000-000000000002', null, '00000000-0000-4000-e000-000000000001',
   'Otávio Reis', '2026-11-10', 'p3', '00000000-0000-4000-a000-000000000011', null, 'priorizada', 'demanda'),
  ('00000000-0000-4000-f000-000000000004', 'Erro ao gerar boleto no portal',
   'Boleto sai com vencimento errado para clientes PJ.',
   '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000002', null,
   'Marina Prado', '2026-11-18', 'p1', '00000000-0000-4000-a000-000000000012', 6, 'em_execucao', 'urgencia'),
  ('00000000-0000-4000-f000-000000000005', 'Ajuste no layout da nota fiscal',
   null,
   '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000002', null,
   'Marina Prado', '2026-11-12', 'p3', '00000000-0000-4000-a000-000000000012', 4, 'concluida', 'correcao'),
  ('00000000-0000-4000-f000-000000000006', 'Novo painel de indicadores de vendas',
   'Dashboard com metas por vendedor.',
   '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000001', null,
   'Diretoria Cliente A', '2026-11-05', 'p2', '00000000-0000-4000-a000-000000000012', 40, 'planejada', 'demanda'),
  ('00000000-0000-4000-f000-000000000007', 'Exportação de clientes para CSV',
   null,
   '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000001', null,
   'Marina Prado', '2026-11-19', 'p3', '00000000-0000-4000-a000-000000000012', 8, 'priorizada', 'demanda'),
  ('00000000-0000-4000-f000-000000000008', 'Migração do servidor de arquivos',
   'Aguardando credenciais de acesso do cliente.',
   '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000002', null,
   'TI Cliente A', '2026-11-09', 'p2', '00000000-0000-4000-a000-000000000012', 16, 'bloqueada', 'demanda'),
  ('00000000-0000-4000-f000-000000000009', 'Consultoria sobre arquitetura em nuvem',
   null,
   '00000000-0000-4000-c000-000000000002', '00000000-0000-4000-d000-000000000004', null,
   'Otávio Reis', '2026-11-20', 'p4', '00000000-0000-4000-a000-000000000011', null, 'nova', 'demanda'),
  ('00000000-0000-4000-f000-000000000010', 'App mobile para representantes',
   'Ideia levantada pelo cliente; sem escopo.',
   '00000000-0000-4000-c000-000000000001', null, null,
   'Diretoria Cliente A', '2026-11-21', 'p4', '00000000-0000-4000-a000-000000000012', null, 'nova', 'demanda'),
  ('00000000-0000-4000-f000-000000000011', 'Atualização de dependências dos projetos',
   'Atualizar bibliotecas com vulnerabilidades conhecidas.',
   null, null, null, 'Rafael Souza', '2026-11-16', 'p3', '00000000-0000-4000-a000-000000000011', 12, 'priorizada', 'atividade_interna'),
  ('00000000-0000-4000-f000-000000000012', 'Treinamento interno de testes automatizados',
   null,
   null, null, null, 'Juliana Costa', '2026-11-16', 'p4', '00000000-0000-4000-a000-000000000012', 8, 'nova', 'atividade_interna'),
  ('00000000-0000-4000-f000-000000000013', 'Ajuste de permissões no Projeto C',
   'Cliente desistiu da alteração.',
   '00000000-0000-4000-c000-000000000002', null, '00000000-0000-4000-e000-000000000001',
   'Otávio Reis', '2026-11-04', 'p3', '00000000-0000-4000-a000-000000000011', 6, 'cancelada', 'correcao');
