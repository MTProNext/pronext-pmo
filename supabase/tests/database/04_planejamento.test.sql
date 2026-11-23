-- Testes da etapa 4A: capacidade efetiva, ocupação, faixas, ciclo da semana,
-- replanejamento, visibilidade e pendências da etapa 3.
-- Executar com: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(45);

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

-- Atalhos de ids do seed
create or replace function pg_temp.c(p text) returns uuid language sql as
  $$ select ('00000000-0000-4000-a000-000000000' || p)::uuid $$;
create or replace function pg_temp.d(p text) returns uuid language sql as
  $$ select ('00000000-0000-4000-f000-000000000' || p)::uuid $$;

-- ===========================================================================
-- Capacidade efetiva
-- ===========================================================================
select is(public.capacidade_efetiva(pg_temp.c('021'), '2026-11-23'), 40.00::numeric,
  'dev sem indisponibilidade: 40h');
select is(public.capacidade_efetiva(pg_temp.c('022'), '2026-11-23'), 36.00::numeric,
  'dev com meio período (4h): 36h');
select is(public.capacidade_efetiva(pg_temp.c('012'), '2026-11-23'), 20.80::numeric,
  'líder com um dia de ausência: 26 − 8 × 26/40 = 20,8h (proporcional)');
select is(public.capacidade_efetiva(pg_temp.c('011'), '2026-11-23'), 23.40::numeric,
  'líder com meio período: 26 − 4 × 26/40 = 23,4h');
select is(public.capacidade_efetiva(pg_temp.c('021'), '2026-11-16'), 32.00::numeric,
  'feriado global (20/11) desconta 8h do dev');
select is(public.capacidade_efetiva(pg_temp.c('011'), '2026-11-16'), 20.80::numeric,
  'feriado global desconta proporcionalmente do líder');
select is(public.capacidade_efetiva(pg_temp.c('021'), '2027-02-08'), 24.00::numeric,
  'Carnaval (2 dias) desconta 16h do dev');
select is(public.capacidade_efetiva(pg_temp.c('011'), '2027-02-08'), 15.60::numeric,
  'Carnaval no líder: 26 − 16 × 0,65 = 15,6h');
select is(public.capacidade_efetiva(pg_temp.c('024'), '2027-02-15'), 0.00::numeric,
  'férias a semana inteira: 0h');
select is(public.capacidade_efetiva(pg_temp.c('021'), '2027-11-15'), 32.00::numeric,
  'feriado no sábado (20/11/2027) não conta; só o de segunda (15/11)');

insert into public.indisponibilidades (colaborador_id, tipo, data_inicio, data_fim, descricao)
values (pg_temp.c('021'), 'ausencia', '2027-03-26', '2027-03-26', 'Teste: ausência no feriado');
select is(public.capacidade_efetiva(pg_temp.c('021'), '2027-03-22'), 32.00::numeric,
  'ausência no mesmo dia de um feriado não desconta duas vezes');

-- ===========================================================================
-- Ocupação e faixas (semana em execução 23/11, visão do líder)
-- ===========================================================================
select pg_temp.entrar_como('lider1@example.com');

select is(
  (select ocupacao_pct from public.v_capacidade_colaborador_semana
    where semana_inicio = '2026-11-23' and colaborador_id = pg_temp.c('021')),
  80.0::numeric, 'ocupação = planejadas ÷ capacidade (32 ÷ 40 = 80%)');
select is(
  (select ocupacao_pct from public.v_capacidade_colaborador_semana
    where semana_inicio = '2026-11-23' and colaborador_id = pg_temp.c('012')),
  115.4::numeric, 'ocupação do líder sobre a capacidade proporcional (24 ÷ 20,8)');
select ok(
  (select excede_capacidade from public.v_capacidade_colaborador_semana
    where semana_inicio = '2026-11-23' and colaborador_id = pg_temp.c('012')),
  'alerta quando o planejado passa da capacidade do colaborador');
select is(
  (select capacidade_total from public.v_resumo_semana where inicio = '2026-11-23'),
  240.20::numeric, 'capacidade total da semana = soma das capacidades efetivas');
select is(
  (select array[limite_planejado, limite_reserva, limite_interno]
     from public.v_resumo_semana where inicio = '2026-11-23'),
  array[168.14, 48.04, 24.02]::numeric[], 'faixas 70/20/10 sobre a capacidade total');
select ok(
  (select alerta_planejado and not alerta_reserva and not alerta_interno
     from public.v_resumo_semana where inicio = '2026-11-23'),
  'alerta da faixa planejada (170h > 168,14h); reserva e interno dentro do limite');

-- Faixas acompanham a configuração
reset role;
update public.configuracoes set pct_planejado = 75, pct_reserva = 15;
select pg_temp.entrar_como('lider1@example.com');
select ok(
  (select limite_planejado = 180.15 and not alerta_planejado
     from public.v_resumo_semana where inicio = '2026-11-23'),
  'limites recalculados com a configuração 75/15/10');

-- ===========================================================================
-- Ciclo da semana
-- ===========================================================================
select is(public.avancar_semana('00000000-0000-4000-9000-000000000003'),
  'publicada'::public.status_semana, 'rascunho → publicada');
select ok(
  (select publicada_por = pg_temp.c('011') and publicada_em is not null
     from public.semanas where id = '00000000-0000-4000-9000-000000000003'),
  'publicação registra quem e quando');
select is(
  (select status from public.demandas where id = pg_temp.d('003')),
  'planejada'::public.status_demanda,
  'ao publicar, demanda priorizada alocada passa para planejada');
select is(public.avancar_semana('00000000-0000-4000-9000-000000000003'),
  'confirmada'::public.status_semana, 'publicada → confirmada');
select throws_ok(
  $$select public.avancar_semana('00000000-0000-4000-9000-000000000001')$$,
  '23514', 'A semana já foi revisada; não há próximo passo.', 'semana revisada não avança');
select throws_ok(
  $$update public.semanas set status = 'revisada' where id = '00000000-0000-4000-9000-000000000002'$$,
  '23514', null, 'status não muda por update direto');

select pg_temp.entrar_como('proprietario@example.com');
select throws_ok(
  $$select public.avancar_semana('00000000-0000-4000-9000-000000000002')$$,
  '42501', null, 'proprietário não avança a semana (só líder)');

-- ===========================================================================
-- Bloqueio de edição direta e replanejamento
-- ===========================================================================
select pg_temp.entrar_como('lider1@example.com');
select throws_ok(
  $$insert into public.planejamento_itens (semana_id, colaborador_id, demanda_id, horas_planejadas)
    values ('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-a000-000000000025',
            '00000000-0000-4000-f000-000000000003', 4)$$,
  '23514', 'Semana já publicada: use o replanejamento (motivo, responsável e impacto).',
  'inclusão direta bloqueada após publicar');
select throws_ok(
  $$update public.planejamento_itens set horas_planejadas = 10
    where semana_id = '00000000-0000-4000-9000-000000000002' and colaborador_id = '00000000-0000-4000-a000-000000000021'
      and demanda_id = '00000000-0000-4000-f000-000000000002'$$,
  '23514', null, 'alteração direta bloqueada após publicar');
select throws_ok(
  $$delete from public.planejamento_itens where semana_id = '00000000-0000-4000-9000-000000000002'$$,
  '23514', null, 'exclusão direta bloqueada após publicar');
select throws_ok(
  $$select public.replanejar_item('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-a000-000000000021',
      '00000000-0000-4000-f000-000000000002', 12, '', 'impacto')$$,
  '23514', 'Informe o motivo e o impacto do replanejamento.', 'replanejamento exige motivo');

select lives_ok(
  $$select public.replanejar_item('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-a000-000000000021',
      '00000000-0000-4000-f000-000000000002', 12, 'ERP pediu ajuste extra', 'Módulo de pedidos perde 4h')$$,
  'líder replaneja com motivo e impacto');
select is(
  (select horas_planejadas from public.planejamento_itens
    where semana_id = '00000000-0000-4000-9000-000000000002' and colaborador_id = pg_temp.c('021')
      and demanda_id = pg_temp.d('002')),
  12.00::numeric, 'replanejamento altera as horas do item');
select ok(
  (select tipo = 'alteracao_horas' and horas_antes = 8 and horas_depois = 12 and responsavel_id = pg_temp.c('011')
     from public.replanejamentos
    where semana_id = '00000000-0000-4000-9000-000000000002' and demanda_id = pg_temp.d('002')
    order by created_at desc limit 1),
  'replanejamento registra tipo, horas antes/depois e responsável');
select lives_ok(
  $$select public.replanejar_item('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-a000-000000000021',
      '00000000-0000-4000-f000-000000000002', 0, 'Cliente pausou o ERP', 'Bruno livre para o módulo')$$,
  'replanejamento com 0h remove a alocação');
select throws_ok(
  $$select public.replanejar_item('00000000-0000-4000-9000-000000000001', '00000000-0000-4000-a000-000000000021',
      '00000000-0000-4000-f000-000000000001', 4, 'x', 'y')$$,
  '23514', 'Semana revisada não pode ser replanejada.', 'semana revisada não é replanejada');

-- ===========================================================================
-- Visibilidade
-- ===========================================================================
-- Cria um rascunho novo para testar a visibilidade
select lives_ok(
  $$insert into public.semanas (inicio) values ('2026-12-07')$$, 'líder cria semana em rascunho');

select pg_temp.entrar_como('dev1@example.com');
select is((select count(*) from public.semanas where status = 'rascunho'), 0::bigint,
  'desenvolvedor não vê semanas em rascunho');
select is(
  (select count(*) from public.planejamento_itens where colaborador_id <> pg_temp.c('021')),
  0::bigint, 'desenvolvedor vê só as próprias alocações');
select is(
  (select count(*) from public.v_capacidade_colaborador_semana where colaborador_id <> pg_temp.c('021')),
  0::bigint, 'desenvolvedor vê só a própria capacidade');

select pg_temp.entrar_como('administrativo@example.com');
select is((select count(*) from public.semanas where status = 'rascunho'), 0::bigint,
  'administrativo não vê semanas em rascunho');

-- ===========================================================================
-- Pendências da etapa 3
-- ===========================================================================
-- Status pelo desenvolvedor alocado (Bruno está no Módulo de pedidos na semana em execução)
select pg_temp.entrar_como('dev1@example.com');
select lives_ok(
  $$update public.demandas set status = 'bloqueada' where id = '00000000-0000-4000-f000-000000000001'$$,
  'desenvolvedor alocado altera o status');
select throws_ok(
  $$update public.demandas set titulo = 'Outro título' where id = '00000000-0000-4000-f000-000000000001'$$,
  '42501', 'O desenvolvedor altera apenas o status da demanda.', 'desenvolvedor não altera outros campos');
select throws_ok(
  $$update public.demandas set status = 'cancelada' where id = '00000000-0000-4000-f000-000000000001'$$,
  '42501', null, 'desenvolvedor não cancela demanda');
update public.demandas set status = 'em_execucao' where id = '00000000-0000-4000-f000-000000000009';
reset role;
select is((select status from public.demandas where id = pg_temp.d('009')), 'planejada'::public.status_demanda,
  'desenvolvedor não altera demanda em que não está alocado');

-- P1/P2 com semana publicada/confirmada/em execução gera replanejamento
insert into public.semanas (id, inicio, status)
values ('00000000-0000-4000-9000-0000000000aa',
        (date_trunc('week', current_date) + interval '70 days')::date, 'publicada');
select pg_temp.entrar_como('lider2@example.com');
insert into public.demandas (id, titulo, lider_id, prioridade)
values ('00000000-0000-4000-f000-0000000000aa', 'Teste P1', '00000000-0000-4000-a000-000000000012', 'p1');
update public.demandas set prioridade = 'p2' where id = '00000000-0000-4000-f000-000000000010';
select pg_temp.entrar_como('lider1@example.com');
select ok(
  exists (select 1 from public.replanejamentos
           where semana_id = '00000000-0000-4000-9000-0000000000aa' and tipo = 'entrada_p1_p2'
             and demanda_id = '00000000-0000-4000-f000-0000000000aa' and responsavel_id = pg_temp.c('012')),
  'entrada de P1 registra replanejamento para o líder responsável');
select ok(
  exists (select 1 from public.replanejamentos
           where semana_id = '00000000-0000-4000-9000-0000000000aa' and tipo = 'entrada_p1_p2'
             and demanda_id = pg_temp.d('010')),
  'demanda elevada para P2 registra replanejamento');

select * from finish();
rollback;
