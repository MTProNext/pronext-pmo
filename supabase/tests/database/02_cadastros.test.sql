-- Testes da etapa 2: RLS e validações dos cadastros.
-- Executar com: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

create or replace function pg_temp.entrar_como(p_email text)
returns void
language plpgsql
as $$
declare
  v_id uuid;
begin
  reset role;
  select id into v_id from auth.users where email = p_email;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$;

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('lider1@example.com');
select lives_ok(
  $$insert into public.clientes (nome) values ('Cliente Teste Líder')$$,
  'líder cadastra cliente'
);

select pg_temp.entrar_como('dev1@example.com');
select throws_ok(
  $$insert into public.clientes (nome) values ('Cliente Teste Dev')$$,
  '42501', null,
  'desenvolvedor não cadastra cliente'
);
select is((select count(*) from public.clientes where nome like 'Cliente _'), 2::bigint,
  'desenvolvedor lê os clientes');

-- ---------------------------------------------------------------------------
-- Contratos e valores
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('lider1@example.com');
select throws_ok(
  $$insert into public.contratos (cliente_id, nome, tipo, vigencia_inicio)
    values ('00000000-0000-4000-c000-000000000001', 'X', 'outro', '2027-01-01')$$,
  '42501', null,
  'líder não cadastra contrato'
);
select is((select count(*) from public.contratos_valores), 0::bigint,
  'líder não vê valores dos contratos');

select pg_temp.entrar_como('dev1@example.com');
select ok((select count(*) from public.contratos) >= 4, 'desenvolvedor lê os contratos');
select is((select count(*) from public.contratos_valores), 0::bigint,
  'desenvolvedor não vê valores dos contratos');

select pg_temp.entrar_como('administrativo@example.com');
select is((select count(*) from public.contratos_valores), 5::bigint,
  'administrativo vê valores dos contratos');
select throws_ok(
  $$insert into public.contratos (cliente_id, nome, tipo, vigencia_inicio)
    values ('00000000-0000-4000-c000-000000000001', 'Banco sem horas', 'banco_horas', '2027-01-01')$$,
  '23514', null,
  'banco de horas exige horas contratadas'
);
select throws_ok(
  $$insert into public.contratos (cliente_id, nome, tipo, vigencia_inicio, vigencia_fim)
    values ('00000000-0000-4000-c000-000000000001', 'Vigência invertida', 'outro', '2027-02-01', '2027-01-01')$$,
  '23514', null,
  'vigência final não pode ser anterior à inicial'
);

-- ---------------------------------------------------------------------------
-- Projetos
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('lider2@example.com');
select throws_ok(
  $$insert into public.projetos (cliente_id, nome, lider_id)
    values ('00000000-0000-4000-c000-000000000001', 'Projeto com dev líder',
            '00000000-0000-4000-a000-000000000021')$$,
  '23514', 'O líder do projeto precisa ser um líder técnico ativo.',
  'líder do projeto precisa ser líder técnico'
);
select throws_ok(
  $$insert into public.projetos (cliente_id, contrato_id, nome, lider_id)
    values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000003',
            'Projeto contrato errado', '00000000-0000-4000-a000-000000000012')$$,
  '23514', 'O contrato informado não pertence ao cliente do projeto.',
  'contrato do projeto precisa ser do mesmo cliente'
);
select lives_ok(
  $$insert into public.projetos (cliente_id, contrato_id, nome, lider_id)
    values ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000001',
            'Projeto válido', '00000000-0000-4000-a000-000000000012')$$,
  'líder cadastra projeto válido'
);

select pg_temp.entrar_como('administrativo@example.com');
select throws_ok(
  $$insert into public.projetos (cliente_id, nome, lider_id)
    values ('00000000-0000-4000-c000-000000000001', 'Projeto adm', '00000000-0000-4000-a000-000000000012')$$,
  '42501', null,
  'administrativo não cadastra projeto'
);

-- ---------------------------------------------------------------------------
-- Indisponibilidades
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('dev1@example.com');
select is(
  (select count(*) from public.indisponibilidades
    where colaborador_id is not null
      and colaborador_id <> '00000000-0000-4000-a000-000000000021'),
  0::bigint,
  'desenvolvedor não vê indisponibilidades de outros colaboradores'
);
select ok(
  (select count(*) from public.indisponibilidades where colaborador_id is null) > 0
  and (select count(*) from public.indisponibilidades
        where colaborador_id = '00000000-0000-4000-a000-000000000021') > 0,
  'desenvolvedor vê os feriados globais e as próprias indisponibilidades'
);

select pg_temp.entrar_como('lider1@example.com');
select throws_ok(
  $$insert into public.indisponibilidades (tipo, data_inicio, data_fim)
    values ('ferias', '2027-03-01', '2027-03-05')$$,
  '23514', null,
  'indisponibilidade global só pode ser feriado'
);
select lives_ok(
  $$delete from public.indisponibilidades where descricao = 'Assunto pessoal'$$,
  'líder exclui indisponibilidade'
);

select * from finish();
rollback;
