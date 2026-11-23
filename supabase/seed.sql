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
