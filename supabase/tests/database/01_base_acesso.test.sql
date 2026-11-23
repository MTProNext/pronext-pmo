-- Testes da etapa 1: vínculo Auth ↔ colaboradores, RLS e guarda de configuracoes.
-- Executar com: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Simula um usuário autenticado pelo e-mail do seed.
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
-- Vínculo automático
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from public.colaboradores where user_id is null),
  0::bigint,
  'todos os colaboradores do seed estão ligados a um usuário do Auth'
);

-- ---------------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('dev1@example.com');
select is(public.papel_atual(), 'desenvolvedor'::public.papel, 'papel_atual do dev');
select ok(public.tem_papel('desenvolvedor', 'lider_tecnico'), 'tem_papel aceita lista');
select ok(not public.tem_papel('proprietario'), 'tem_papel nega papel diferente');

select pg_temp.entrar_como('lider1@example.com');
select ok(public.lidera('00000000-0000-4000-a000-000000000021'), 'líder 1 lidera dev 1');
select ok(not public.lidera('00000000-0000-4000-a000-000000000024'), 'líder 1 não lidera dev 4');

-- ---------------------------------------------------------------------------
-- RLS de colaboradores
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('dev1@example.com');
select is((select count(*) from public.colaboradores), 9::bigint, 'dev lê todos os colaboradores');

update public.colaboradores set papel = 'proprietario' where email = 'dev1@example.com';
reset role;
select is(
  (select papel from public.colaboradores where email = 'dev1@example.com'),
  'desenvolvedor'::public.papel,
  'dev não consegue alterar o próprio papel'
);

select pg_temp.entrar_como('administrativo@example.com');
select lives_ok(
  $$update public.colaboradores set competencias = '{React}' where email = 'dev3@example.com'$$,
  'administrativo altera colaborador'
);
reset role;
select is(
  (select competencias from public.colaboradores where email = 'dev3@example.com'),
  '{React}'::text[],
  'alteração do administrativo foi gravada'
);

reset role;
set local role anon;
select is((select count(*) from public.colaboradores), 0::bigint, 'anônimo não lê colaboradores');

-- ---------------------------------------------------------------------------
-- Guarda de colunas em configuracoes
-- ---------------------------------------------------------------------------
select pg_temp.entrar_como('lider1@example.com');
select lives_ok(
  $$update public.configuracoes set pct_planejado = 65, pct_reserva = 25$$,
  'líder altera faixas de capacidade'
);
select throws_ok(
  $$update public.configuracoes set dia_limite_fechamento = 10$$,
  '42501', null,
  'líder não altera dia-limite do fechamento'
);

select pg_temp.entrar_como('administrativo@example.com');
select lives_ok(
  $$update public.configuracoes set dia_limite_fechamento = 10$$,
  'administrativo altera dia-limite do fechamento'
);
select throws_ok(
  $$update public.configuracoes set pct_alerta_contrato = 90$$,
  '42501', null,
  'administrativo não altera alertas'
);

select pg_temp.entrar_como('dev1@example.com');
update public.configuracoes set pct_planejado = 50, pct_reserva = 40;
reset role;
select is(
  (select pct_planejado from public.configuracoes),
  65::numeric,
  'dev não altera configurações (RLS ignora a atualização)'
);

select * from finish();
rollback;
