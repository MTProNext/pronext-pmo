-- Testes da etapa 2A: apontamentos, fluxo de aprovação, classificação, auditoria,
-- horas não planejadas e prazos. O instante é fixado com pmo.agora.
-- Executar com: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(53);

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

create or replace function pg_temp.c(p text) returns uuid language sql as
  $$ select ('00000000-0000-4000-a000-000000000' || p)::uuid $$;
create or replace function pg_temp.d(p text) returns uuid language sql as
  $$ select ('00000000-0000-4000-f000-000000000' || p)::uuid $$;
create or replace function pg_temp.cat(p text) returns uuid language sql as
  $$ select id from public.categorias_hora where codigo = p $$;
-- id do apontamento (sem RLS: chamada como postgres)
create or replace function pg_temp.ap(p_colab text, p_dem text, p_data date) returns uuid
language sql security definer as
  $$ select id from public.apontamentos
     where colaborador_id = pg_temp.c(p_colab) and demanda_id = pg_temp.d(p_dem) and data = p_data $$;

-- Segunda-feira, 23/11/2026, 17h em Brasília
select set_config('pmo.agora', '2026-11-23 17:00-03', true);

-- ===========================================================================
-- Registro
-- ===========================================================================
select pg_temp.entrar_como('dev1@example.com');
select lives_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas, created_at)
    values ('2026-11-23', pg_temp.d('007'), pg_temp.cat('desenvolvimento'), 'Exportação CSV: novos campos.', 1, '2020-01-01')$$,
  'desenvolvedor registra o próprio apontamento');
select throws_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas)
    values ('2026-11-23', pg_temp.d('007'), pg_temp.cat('desenvolvimento'), 'Duplicado no mesmo dia.', 1)$$,
  '23505', null, 'uma entrada por demanda por dia');
select throws_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas)
    values ('2026-11-24', pg_temp.d('009'), pg_temp.cat('desenvolvimento'), 'Horas de amanhã adiantadas.', 1)$$,
  '23514', 'Não é possível apontar horas em data futura.', 'data futura é recusada');
select throws_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas)
    values ('2026-11-23', pg_temp.d('009'), pg_temp.cat('desenvolvimento'), 'Curta', 1)$$,
  '23514', null, 'descrição exige pelo menos 10 caracteres');
select throws_ok(
  $$insert into public.apontamentos (colaborador_id, data, demanda_id, categoria_id, descricao, horas)
    values (pg_temp.c('022'), '2026-11-23', pg_temp.d('009'), pg_temp.cat('desenvolvimento'), 'Horas de outra pessoa.', 1)$$,
  '42501', null, 'ninguém aponta horas de outra pessoa');
select throws_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas, status)
    values ('2026-11-23', pg_temp.d('009'), pg_temp.cat('desenvolvimento'), 'Já nasce aprovado.', 1, 'aprovado')$$,
  '42501', null, 'apontamento novo só nasce como rascunho');
select throws_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas)
    values ('2026-11-23', pg_temp.d('009'), pg_temp.cat('desenvolvimento'), 'Dia com horas demais.', 20)$$,
  '23514', 'O total do dia passaria de 24 horas.', 'total do dia limitado a 24h');

reset role;
select set_config('request.jwt.claims', '', true);
select ok(
  (select cliente_id = '00000000-0000-4000-c000-000000000001' and contrato_id = '00000000-0000-4000-d000-000000000001'
          and created_at = '2026-11-23 17:00-03'::timestamptz
     from public.apontamentos where id = pg_temp.ap('021', '007', '2026-11-23')),
  'cliente/contrato copiados da demanda e momento do registro definido pelo banco');

-- Fuso: às 23h30 de 23/11 em Brasília (24/11 em UTC), 24/11 ainda é futuro.
select set_config('pmo.agora', '2026-11-24 02:30+00', true);
select pg_temp.entrar_como('dev1@example.com');
select throws_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas)
    values ('2026-11-24', pg_temp.d('009'), pg_temp.cat('desenvolvimento'), 'Ainda é dia 23 no Brasil.', 1)$$,
  '23514', 'Não é possível apontar horas em data futura.', 'data futura considera o fuso de Brasília');
select set_config('pmo.agora', '2026-11-23 17:00-03', true);

-- ===========================================================================
-- Visibilidade
-- ===========================================================================
select is((select count(*) from public.apontamentos where colaborador_id <> pg_temp.c('021')), 0::bigint,
  'desenvolvedor vê só os próprios apontamentos');
select pg_temp.entrar_como('administrativo@example.com');
select is((select count(*) from public.apontamentos where status <> 'aprovado'), 0::bigint,
  'administrativo vê só horas aprovadas');
select pg_temp.entrar_como('lider2@example.com');
select ok((select count(distinct colaborador_id) from public.apontamentos) = 7, 'líder vê os apontamentos de todos');

-- ===========================================================================
-- Fluxo: envio, aprovação, devolução, reabertura
-- ===========================================================================
select pg_temp.entrar_como('dev1@example.com');
select is(public.enviar_apontamentos(array[pg_temp.ap('021', '007', '2026-11-23'), pg_temp.ap('021', '002', '2026-11-23')]),
  2, 'autor envia rascunhos');
select throws_ok(
  format($$update public.apontamentos set horas = 3 where id = %L$$, pg_temp.ap('021', '007', '2026-11-23')),
  '23514', 'Apontamento enviado ou aprovado não pode ser alterado pelo autor.', 'autor não altera enviado');
select throws_ok(
  format($$update public.apontamentos set status = 'aprovado' where id = %L$$, pg_temp.ap('021', '001', '2026-11-23')),
  '42501', null, 'autor não muda status por update');
select throws_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('021', '007', '2026-11-23')),
  '42501', null, 'desenvolvedor não aprova');

-- Bruno lança horas numa demanda da Juliana (Painel) e envia
select lives_ok(
  $$insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas)
    values ('2026-11-23', pg_temp.d('006'), pg_temp.cat('desenvolvimento'), 'Apoio no gráfico de metas.', 1)$$,
  'desenvolvedor registra horas em demanda de outro líder');
select public.enviar_apontamentos(array[pg_temp.ap('021', '006', '2026-11-23')]);

select pg_temp.entrar_como('lider2@example.com');
select throws_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('021', '002', '2026-11-23')),
  '42501', null, 'líder que não é líder direto nem da demanda não aprova');
select lives_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('021', '006', '2026-11-23')),
  'líder accountable da demanda aprova horas de quem não é da sua equipe');

select pg_temp.entrar_como('lider1@example.com');
select lives_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('021', '007', '2026-11-23')),
  'líder direto aprova');
select ok(
  (select status = 'aprovado' and aprovado_por = pg_temp.c('011') and classificacao_comercial = 'banco_horas'
     from public.apontamentos where id = pg_temp.ap('021', '007', '2026-11-23')),
  'aprovação registra quem aprovou e aplica a sugestão do contrato (banco de horas)');
select throws_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('011', '015', '2026-11-23')),
  '42501', null, 'ninguém aprova as próprias horas');

select pg_temp.entrar_como('lider2@example.com');
select lives_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('011', '015', '2026-11-23')),
  'horas de um líder são aprovadas pelo outro líder');
select pg_temp.entrar_como('proprietario@example.com');
select lives_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('011', '016', '2026-11-23')),
  'proprietário aprova horas de líder');
select throws_ok(
  format($$select public.aprovar_apontamentos(array[%L]::uuid[])$$, pg_temp.ap('022', '001', '2026-11-23')),
  '42501', null, 'proprietário não aprova horas de desenvolvedor');

select pg_temp.entrar_como('lider1@example.com');
select throws_ok(
  format($$select public.devolver_apontamento(%L, '  ')$$, pg_temp.ap('022', '001', '2026-11-23')),
  '23514', 'Informe o motivo da devolução.', 'devolução exige motivo');
select lives_ok(
  format($$select public.devolver_apontamento(%L, 'Detalhe quais validações foram feitas.')$$, pg_temp.ap('022', '001', '2026-11-23')),
  'líder devolve com motivo');

select pg_temp.entrar_como('dev2@example.com');
select lives_ok(
  format($$update public.apontamentos set descricao = 'API de pedidos: validação de quantidade e preço.' where id = %L$$,
         pg_temp.ap('022', '001', '2026-11-23')),
  'autor corrige o devolvido');
select is(public.enviar_apontamentos(array[pg_temp.ap('022', '001', '2026-11-23')]), 1, 'autor reenvia o devolvido');
select ok(
  (select primeiro_envio_em = '2026-11-23 12:00-03'::timestamptz and enviado_em = '2026-11-23 17:00-03'::timestamptz
     from public.apontamentos where id = pg_temp.ap('022', '001', '2026-11-23')),
  'reenvio atualiza enviado_em mas mantém o primeiro envio (base do prazo)');

select pg_temp.entrar_como('lider1@example.com');
select lives_ok(
  format($$select public.reabrir_apontamento(%L, 'Horas lançadas no dia errado.')$$, pg_temp.ap('021', '007', '2026-11-23')),
  'aprovador reabre hora aprovada com motivo');
select ok(
  (select status = 'devolvido' and aprovado_por is null and motivo_devolucao = 'Horas lançadas no dia errado.'
     from public.apontamentos where id = pg_temp.ap('021', '007', '2026-11-23')),
  'reabertura volta para devolvido e limpa a aprovação');
select ok(
  (select motivo = 'Horas lançadas no dia errado.' and alterado_por = pg_temp.c('011')
          and 'status' = any (campos_alterados) and antes ->> 'status' = 'aprovado'
     from public.apontamentos_auditoria
    where apontamento_id = pg_temp.ap('021', '007', '2026-11-23')
    order by id desc limit 1),
  'auditoria registra antes/depois, campos, quem e o motivo');

-- ===========================================================================
-- Classificação comercial
-- ===========================================================================
select pg_temp.entrar_como('dev1@example.com');
select throws_ok(
  format($$select public.classificar_apontamentos(array[%L]::uuid[], 'faturavel_adicional')$$, pg_temp.ap('021', '006', '2026-11-23')),
  '42501', null, 'desenvolvedor não classifica');
select pg_temp.entrar_como('lider1@example.com');
select throws_ok(
  format($$select public.classificar_apontamentos(array[%L]::uuid[], 'banco_horas', true)$$, pg_temp.ap('021', '001', '2026-11-16')),
  '42501', null, 'líder sugere, mas não valida a classificação');
select pg_temp.entrar_como('administrativo@example.com');
select is(
  public.classificar_apontamentos(array[pg_temp.ap('021', '001', '2026-11-16')], 'escopo_projeto', true),
  1, 'administrativo valida a classificação de hora aprovada');
select ok(
  (select classificacao_validada_por = pg_temp.c('002')
     from public.apontamentos where id = pg_temp.ap('021', '001', '2026-11-16')),
  'validação registra quem validou');

-- ===========================================================================
-- Horas não planejadas
-- ===========================================================================
select pg_temp.entrar_como('lider1@example.com');
select ok(
  (select nao_planejada from public.v_apontamentos where id = pg_temp.ap('021', '007', '2026-11-18'))
  and not (select nao_planejada from public.v_apontamentos where id = pg_temp.ap('021', '001', '2026-11-18')),
  'sem alocação na semana publicada = não planejada; com alocação = planejada');
select ok(
  not (select nao_planejada from public.v_apontamentos where id = pg_temp.ap('011', '015', '2026-11-17')),
  'categoria fora do planejamento (gestão) nunca conta como não planejada');
select is(
  (select horas_nao_planejadas from public.v_horas_semana_colaborador
    where semana_inicio = '2026-11-16' and colaborador_id = pg_temp.c('012')),
  3.00::numeric, 'total de horas não planejadas por pessoa e semana');

-- Replanejamento posterior: a hora passa a ser planejada
select public.replanejar_item('00000000-0000-4000-9000-000000000002', pg_temp.c('021'), pg_temp.d('007'),
  2, 'Exportação CSV entrou na semana', 'Reserva reduzida em 2h', 'reserva');
select ok(
  not (select nao_planejada from public.v_apontamentos where id = pg_temp.ap('021', '007', '2026-11-23')),
  'alocação incluída depois por replanejamento torna a hora planejada');

-- Semana em rascunho não conta como planejamento
reset role;
select set_config('request.jwt.claims', '', true);
insert into public.semanas (id, inicio) values ('00000000-0000-4000-9000-0000000000cc', '2026-11-02');
insert into public.planejamento_itens (semana_id, colaborador_id, demanda_id, horas_planejadas)
values ('00000000-0000-4000-9000-0000000000cc', pg_temp.c('021'), pg_temp.d('001'), 8);
insert into public.apontamentos (colaborador_id, data, demanda_id, categoria_id, descricao, horas)
values (pg_temp.c('021'), '2026-11-03', pg_temp.d('001'), pg_temp.cat('desenvolvimento'), 'Hora em semana não publicada.', 4);
select pg_temp.entrar_como('lider1@example.com');
select ok(
  (select nao_planejada from public.v_apontamentos where id = pg_temp.ap('021', '001', '2026-11-03')),
  'alocação em semana ainda em rascunho não conta');
select public.avancar_semana('00000000-0000-4000-9000-0000000000cc');
select ok(
  not (select nao_planejada from public.v_apontamentos where id = pg_temp.ap('021', '001', '2026-11-03')),
  'depois de publicada, a mesma alocação conta');

-- ===========================================================================
-- Prazos
-- ===========================================================================
select is(
  (select situacao from public.v_prazo_apontamento_dia where colaborador_id = pg_temp.c('021') and dia = '2026-11-16'),
  'no_prazo', 'dia registrado no próprio dia: no prazo');
select is(
  (select situacao from public.v_prazo_apontamento_dia where colaborador_id = pg_temp.c('025') and dia = '2026-11-16'),
  'atrasado', 'dia registrado depois do fim do dia útil seguinte: atrasado');
select ok(
  not exists (select 1 from public.v_prazo_apontamento_dia where dia = '2026-11-20'),
  'feriado (20/11) não é dia útil para ninguém');
select is(
  (select situacao from public.v_prazo_apontamento_dia where colaborador_id = pg_temp.c('023') and dia = '2026-11-19'),
  'pendente', '19/11 sem registro ainda no prazo (dia útil seguinte é 23/11, por causa do feriado)');

-- 22h de segunda em Brasília (já terça em UTC): o Diego registra 19/11 ainda no prazo.
select set_config('pmo.agora', '2026-11-24 01:00+00', true);
select pg_temp.entrar_como('dev3@example.com');
insert into public.apontamentos (data, demanda_id, categoria_id, descricao, horas)
values ('2026-11-19', pg_temp.d('002'), pg_temp.cat('desenvolvimento'), 'Integração ERP: mapeamento de status.', 7.5);
select is(
  (select situacao from public.v_prazo_apontamento_dia where colaborador_id = pg_temp.c('023') and dia = '2026-11-19'),
  'no_prazo', 'registro às 22h de Brasília conta para o próprio dia (prazo em fuso de Brasília)');
select is((select count(distinct colaborador_id) from public.v_prazo_apontamento_dia), 1::bigint,
  'desenvolvedor vê só os próprios prazos');

select pg_temp.entrar_como('lider1@example.com');
select is(
  (select situacao from public.v_prazo_apontamento_semana where colaborador_id = pg_temp.c('012') and semana_inicio = '2026-11-16'),
  'atrasado', 'semana enviada depois de segunda 12h: atrasada');
select is(
  (select situacao from public.v_prazo_apontamento_semana where colaborador_id = pg_temp.c('021') and semana_inicio = '2026-11-23'),
  'pendente', 'semana em andamento: pendente');

-- Parâmetros de prazo
reset role;
select set_config('request.jwt.claims', '', true);
update public.configuracoes set prazo_envio_hora = '14:00', prazo_registro_dias_uteis = 2;
select pg_temp.entrar_como('lider1@example.com');
select ok(
  (select situacao = 'no_prazo' from public.v_prazo_apontamento_semana
    where colaborador_id = pg_temp.c('012') and semana_inicio = '2026-11-16')
  and (select situacao = 'no_prazo' from public.v_prazo_apontamento_dia
        where colaborador_id = pg_temp.c('025') and dia = '2026-11-17'),
  'prazos seguem a configuração (envio até 14h; registro em 2 dias úteis)');

select is(public.periodo_fechado('2026-10-15'), false, 'fechamento mensal ainda não implementado (Fase 3)');

select * from finish();
rollback;
