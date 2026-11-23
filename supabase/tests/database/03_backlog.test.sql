-- Testes da etapa 3: backlog de demandas.
-- Executar com: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

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
-- Leitura e escrita por perfil
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('dev1@example.com');
select is((select count(*) from public.demandas), 16::bigint, 'desenvolvedor lê o backlog inteiro');
select throws_ok(
  $$insert into public.demandas (titulo, lider_id) values ('X', '00000000-0000-4000-a000-000000000011')$$,
  '42501', null, 'desenvolvedor não cria demanda'
);
-- DEM-0009 está alocada só ao Thiago; o Bruno (dev1) não pode alterá-la.
-- (A alteração de status pelo desenvolvedor alocado é testada em 04_planejamento.)
update public.demandas set status = 'concluida' where id = '00000000-0000-4000-f000-000000000009';
reset role;
select is(
  (select status from public.demandas where id = '00000000-0000-4000-f000-000000000009'),
  'planejada'::public.status_demanda,
  'desenvolvedor não altera demanda em que não está alocado'
);

select pg_temp.entrar_como('administrativo@example.com');
select throws_ok(
  $$insert into public.demandas (titulo, lider_id) values ('X', '00000000-0000-4000-a000-000000000011')$$,
  '42501', null, 'administrativo não cria demanda'
);

select pg_temp.entrar_como('lider2@example.com');
delete from public.demandas where id = '00000000-0000-4000-f000-000000000013';
reset role;
select is((select count(*) from public.demandas), 16::bigint, 'ninguém exclui demandas');

-- ---------------------------------------------------------------------------
-- Validações
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('lider1@example.com');
select lives_ok(
  $$insert into public.demandas (titulo, lider_id) values ('Interna sem estimativa', '00000000-0000-4000-a000-000000000011')$$,
  'líder cria demanda interna com estimativa "a definir"'
);
select throws_ok(
  $$insert into public.demandas (titulo, lider_id) values ('Líder errado', '00000000-0000-4000-a000-000000000021')$$,
  '23514', 'O líder da demanda precisa ser um líder técnico ativo.',
  'líder accountable precisa ser líder técnico'
);
select throws_ok(
  $$insert into public.demandas (titulo, lider_id, tipo, cliente_id)
    values ('Interna com cliente', '00000000-0000-4000-a000-000000000011', 'atividade_interna',
            '00000000-0000-4000-c000-000000000001')$$,
  '23514', null, 'atividade interna não tem cliente'
);
select throws_ok(
  $$insert into public.demandas (titulo, lider_id, cliente_id, projeto_id)
    values ('Projeto de outro cliente', '00000000-0000-4000-a000-000000000011',
            '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-e000-000000000001')$$,
  '23514', 'O projeto informado não pertence ao cliente da demanda.',
  'projeto precisa ser do cliente da demanda'
);
select throws_ok(
  $$insert into public.demandas (titulo, lider_id, cliente_id, contrato_id)
    values ('Contrato de outro cliente', '00000000-0000-4000-a000-000000000011',
            '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000003')$$,
  '23514', 'O contrato informado não pertence ao cliente da demanda.',
  'contrato precisa ser do cliente da demanda'
);
select throws_ok(
  $$insert into public.demandas (titulo, lider_id, estimativa_horas) values ('Negativa', '00000000-0000-4000-a000-000000000011', -1)$$,
  '23514', null, 'estimativa não pode ser negativa'
);

-- Contrato herdado do projeto
insert into public.demandas (id, titulo, lider_id, cliente_id, projeto_id)
values ('00000000-0000-4000-f000-0000000000aa', 'Herda contrato', '00000000-0000-4000-a000-000000000011',
        '00000000-0000-4000-c000-000000000002', '00000000-0000-4000-e000-000000000001');
select is(
  (select contrato_id from public.demandas where id = '00000000-0000-4000-f000-0000000000aa'),
  '00000000-0000-4000-d000-000000000003'::uuid,
  'demanda de projeto herda o contrato do projeto'
);
select ok(
  (select codigo from public.demandas where id = '00000000-0000-4000-f000-0000000000aa') > 14,
  'código sequencial gerado automaticamente'
);

-- Data de conclusão
update public.demandas set status = 'concluida' where id = '00000000-0000-4000-f000-0000000000aa';
select isnt(
  (select concluida_em from public.demandas where id = '00000000-0000-4000-f000-0000000000aa'),
  null, 'concluir preenche concluida_em'
);
update public.demandas set status = 'em_execucao' where id = '00000000-0000-4000-f000-0000000000aa';
select is(
  (select concluida_em from public.demandas where id = '00000000-0000-4000-f000-0000000000aa'),
  null, 'reabrir limpa concluida_em'
);

-- Proprietário também altera (prioridade estratégica)
select pg_temp.entrar_como('proprietario@example.com');
select lives_ok(
  $$update public.demandas set prioridade = 'p1' where id = '00000000-0000-4000-f000-000000000010'$$,
  'proprietário altera a prioridade'
);

select * from finish();
rollback;
