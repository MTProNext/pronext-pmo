-- Testes dos ajustes da etapa 4A: hoje_brasil() e replanejamentos pendentes.
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

-- ===========================================================================
-- hoje_brasil()
-- ===========================================================================
-- Sexta 27/11/2026 às 22h em Brasília = sábado 28/11 01h em UTC.
select set_config('pmo.agora', '2026-11-28 01:00:00+00', true);
select is(public.hoje_brasil(), '2026-11-27'::date, 'às 22h de Brasília, hoje ainda é sexta (UTC já é sábado)');

select set_config('pmo.agora', '2026-11-28 03:30:00+00', true);
select is(public.hoje_brasil(), '2026-11-28'::date, 'às 00h30 de Brasília, já é sábado');

-- P1 às 22h de sexta: a semana em execução (fim 27/11) ainda conta.
select set_config('pmo.agora', '2026-11-28 01:00:00+00', true);
select pg_temp.entrar_como('lider1@example.com');
insert into public.demandas (id, titulo, lider_id, prioridade)
values ('00000000-0000-4000-f000-0000000000b1', 'P1 às 22h', '00000000-0000-4000-a000-000000000011', 'p1');
select ok(
  exists (select 1 from public.replanejamentos
           where demanda_id = '00000000-0000-4000-f000-0000000000b1'
             and semana_id = '00000000-0000-4000-9000-000000000002'),
  'P1 às 22h de sexta (Brasília) registra replanejamento na semana que termina nesse dia'
);
select is(
  (select data_entrada from public.demandas where id = '00000000-0000-4000-f000-0000000000b1'),
  '2026-11-27'::date, 'data de entrada padrão usa a data de Brasília'
);

-- P1 às 00h30 de sábado: a semana já terminou.
reset role;
select set_config('pmo.agora', '2026-11-28 03:30:00+00', true);
select pg_temp.entrar_como('lider1@example.com');
insert into public.demandas (id, titulo, lider_id, prioridade)
values ('00000000-0000-4000-f000-0000000000b2', 'P1 de madrugada', '00000000-0000-4000-a000-000000000011', 'p1');
select ok(
  not exists (select 1 from public.replanejamentos
               where demanda_id = '00000000-0000-4000-f000-0000000000b2'
                 and semana_id = '00000000-0000-4000-9000-000000000002'),
  'P1 depois da meia-noite de sexta não entra na semana já encerrada'
);

-- ===========================================================================
-- Replanejamentos pendentes
-- ===========================================================================
select ok(
  (select pendente and motivo is null and impacto is null and descricao_auto like 'Entrada de demanda P1%'
     from public.replanejamentos where demanda_id = '00000000-0000-4000-f000-0000000000b1'),
  'registro automático nasce pendente, sem motivo/impacto e com descrição do sistema'
);
select is(
  (select replanejamentos_pendentes from public.v_resumo_semana
    where semana_id = '00000000-0000-4000-9000-000000000002'),
  2::bigint, 'resumo da semana conta os pendentes (seed + teste)'
);

select pg_temp.entrar_como('proprietario@example.com');
select throws_ok(
  $$select public.completar_replanejamento(
      (select id from public.replanejamentos where demanda_id = '00000000-0000-4000-f000-0000000000b1'),
      'motivo', 'impacto')$$,
  '42501', null, 'proprietário não completa replanejamento'
);

select pg_temp.entrar_como('lider2@example.com');
select throws_ok(
  $$select public.completar_replanejamento(
      (select id from public.replanejamentos where demanda_id = '00000000-0000-4000-f000-0000000000b1'),
      'motivo', ' ')$$,
  '23514', 'Informe o motivo e o impacto do replanejamento.', 'completar exige motivo e impacto'
);
select lives_ok(
  $$select public.completar_replanejamento(
      (select id from public.replanejamentos where demanda_id = '00000000-0000-4000-f000-0000000000b1'),
      'Falha de integração em produção', 'Bruno sai do módulo de pedidos por 6h')$$,
  'líder completa o replanejamento pendente'
);
select ok(
  (select not pendente and motivo = 'Falha de integração em produção' and completado_em is not null
          and completado_por = '00000000-0000-4000-a000-000000000012'
     from public.replanejamentos where demanda_id = '00000000-0000-4000-f000-0000000000b1'),
  'completar grava motivo, impacto, quem e quando'
);
select throws_ok(
  $$select public.completar_replanejamento(
      (select id from public.replanejamentos where demanda_id = '00000000-0000-4000-f000-0000000000b1'),
      'outro', 'outro')$$,
  '23514', 'Este replanejamento já foi completado.', 'não completa duas vezes'
);

-- Imutabilidade (testada como postgres, que passa pela RLS mas não pelo trigger)
reset role;
select throws_ok(
  $$update public.replanejamentos set motivo = 'reescrito'
    where demanda_id = '00000000-0000-4000-f000-0000000000b1'$$,
  '42501', null, 'registro completado não pode ser alterado'
);
select throws_ok(
  $$update public.replanejamentos set horas_depois = 99
    where demanda_id = '00000000-0000-4000-f000-000000000014'$$,
  '42501', null, 'pendente não aceita alteração fora do complemento'
);
select throws_ok(
  $$delete from public.replanejamentos where demanda_id = '00000000-0000-4000-f000-0000000000b1'$$,
  '42501', 'O log de replanejamentos não pode ser excluído.', 'log não pode ser excluído por usuário'
);

-- Remover um item referenciado por um replanejamento continua funcionando (FK zera a referência).
select pg_temp.entrar_como('lider1@example.com');
select public.replanejar_item('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-a000-000000000025',
  '00000000-0000-4000-f000-000000000003', 4, 'Inclusão de teste', 'Nenhum');
select lives_ok(
  $$select public.replanejar_item('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-a000-000000000025',
      '00000000-0000-4000-f000-000000000003', 0, 'Remoção de teste', 'Nenhum')$$,
  'remover item referenciado no log não esbarra na imutabilidade'
);

select * from finish();
rollback;
