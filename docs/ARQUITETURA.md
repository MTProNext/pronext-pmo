# Arquitetura — PMO ProNext

Documento vivo: atualizado a cada etapa. Serve de contexto para o Lovable e o Claude Code.

## Estado atual
- Passo 0: esqueleto do projeto.
- **Fase 1, etapa 1 (base e acesso)**: concluída. Colaboradores, vínculo com o Auth,
  funções de RLS, configurações, login, layout com menu por perfil e rotas protegidas.
- **Padronização visual**: concluída. Tema padrão do shadcn/Lovable e componentes
  reutilizáveis em `src/components/comum/` (ver "Padrão de interface").
- **Fase 1, etapa 2 (cadastros)**: concluída. Clientes, contratos (+ valores), projetos
  (mínimo), indisponibilidades (com feriados 2027) e tela de configurações; recuperação de
  senha no login.
- **Fase 1, etapa 3 (backlog)**: concluída. Tabela `demandas`, lista com filtros e página
  de detalhe com edição e troca de status.
- **Fase 1, etapa 4A (planejamento: banco e regras)**: concluída. Semanas, itens,
  replanejamentos, capacidade efetiva, views de capacidade e pendências da etapa 3.
- **Ajustes da 4A**: `hoje_brasil()` (fuso America/Sao_Paulo) e replanejamentos
  automáticos pendentes até o líder completar motivo e impacto.
- **Fase 1, etapa 4B (planejamento: telas)**: concluída. Grade da semana, ciclo de vida,
  replanejamento, aviso de pendentes, log da semana e "Minha semana". **Fase 1 completa.**
- **Fase 2, etapa 2A (apontamento de horas)**: concluída. Categorias, apontamentos,
  auditoria, fluxo rascunho → enviado → aprovado/devolvido, classificação comercial,
  horas não planejadas, prazos de registro/envio e telas `/apontamentos`, `/aprovacoes`,
  `/horas/classificacao`. Próximas: 2B (ficha de projeto) e 2C (riscos e impedimentos).

## Stack
- Vite 5 + React 18 + TypeScript (SPA), plugin `@vitejs/plugin-react-swc`
- Tailwind CSS 3 (`tailwind.config.ts`) + shadcn/ui (`components.json`, estilo `default`)
- react-router-dom 6, @tanstack/react-query 5, react-hook-form + zod 3,
  lucide-react, recharts 2, date-fns 3 (ptBR), sonner
- Supabase (Postgres, Auth, RLS). Cliente em `src/integrations/supabase/client.ts`
- Testes de regras no banco com pgTAP (`npm run db:test`, arquivos em `supabase/tests/`)

## Estrutura de pastas
```
src/
  components/ui/          # shadcn (gerado pelo CLI, não editar à mão)
  components/comum/       # padrões de interface reutilizáveis (ver "Padrão de interface")
  components/auth/        # RotaProtegida, EsqueciSenhaDialog
  components/layout/      # AppLayout, AppSidebar, navegacao.ts
  components/<modulo>/    # colunas<Modulo>.tsx e Formulario<Modulo>.tsx por módulo
                          # (colaboradores, clientes, contratos, projetos, indisponibilidades,
                          #  configuracoes, backlog, planejamento, minhaSemana, apontamentos,
                          #  aprovacoes)
  pages/                  # uma página por rota (pages/cadastros/ para cadastros)
  hooks/                  # useSessao, usePermissao, useMutacao e um hook por recurso
  integrations/supabase/  # client.ts e types.ts (gerado por npm run db:types)
  lib/                    # utils.ts (cn), format.ts, papeis.ts, rotulos.ts, selos.ts,
                          # permissoes.ts, erros.ts, validacao.ts
supabase/
  config.toml             # Supabase local (confirmação de e-mail desativada)
  migrations/             # schema versionado
  tests/database/         # testes pgTAP
  functions/              # Edge Functions (se houver)
  seed.sql                # dados de teste aplicados por db reset
```

## Ambiente
- Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no front-end.
- Local: `http://127.0.0.1:54321`. Nuvem: trocar `.env` + `supabase link` + `supabase db push`.
- Dev server na porta 8080 (padrão Lovable).

## Convenções do banco
- **"Hoje" é sempre `public.hoje_brasil()`** (data em America/Sao_Paulo). Nunca usar
  `current_date` nem `now()::date` em regras de negócio, defaults ou views: o banco roda em
  UTC e, depois das 21h de Brasília, já seria o dia seguinte. Vale para as próximas fases
  (prazo de apontamento, fechamento mensal, projetos sem atualização...). Em testes, o
  instante pode ser simulado com `set_config('pmo.agora', '<timestamptz>', true)`.
- **"Agora" é sempre `public.agora()`** em regras de prazo e em carimbos de fluxo
  (`enviado_em`, `aprovado_em`...), no lugar de `now()`: mesma simulação por `pmo.agora`.
  `hoje_brasil()` usa `agora()`. Prazos com hora são calculados em America/Sao_Paulo.
- Nomes em português, `snake_case`, sem acento.
- `id uuid`, `created_at`, `updated_at` (trigger `set_updated_at`).
- Nada é excluído quando há histórico: usa-se `ativo = false` ou status `cancelada`.
- Funções `security definer` sempre com `set search_path = ''`.
- Views com `security_invoker = true` para respeitar a RLS.

## Modelo de dados (implementado)

### Enums
- `papel`: `proprietario`, `lider_tecnico`, `desenvolvedor`, `administrativo`
- `senioridade`: `junior`, `pleno`, `senior`, `especialista`
- `tipo_contrato`: `banco_horas`, `escopo_fechado`, `sustentacao`, `outro`
- `periodicidade_horas`: `total` (vigência inteira), `mensal`
- `status_contrato`: `ativo`, `suspenso`, `encerrado`
- `status_projeto`: `nao_iniciado`, `em_descoberta`, `planejamento`, `em_execucao`,
  `em_homologacao`, `bloqueado`, `concluido`, `cancelado`
- `tipo_indisponibilidade`: `ferias`, `feriado`, `ausencia`, `treinamento`, `outra`
- `prioridade`: `p1` (Crítica), `p2` (Alta), `p3` (Normal), `p4` (Baixa) — a ordem do enum
  é a ordem de exibição
- `status_demanda`: `nova`, `priorizada`, `planejada`, `em_execucao`, `bloqueada`,
  `concluida`, `cancelada`
- `tipo_demanda`: `demanda`, `urgencia`, `correcao`, `atividade_interna`
- `status_semana`: `rascunho`, `publicada`, `confirmada`, `em_execucao`, `revisada`
- `faixa_capacidade`: `planejado`, `reserva`, `interno`
- `tipo_replanejamento`: `inclusao`, `alteracao_horas`, `remocao`, `entrada_p1_p2`, `outro`

Rótulos em pt-BR de todos os enums: `src/lib/papeis.ts` e `src/lib/rotulos.ts`.

### `colaboradores`
Pessoas da operação e perfil de acesso. `user_id` (opcional, único) liga ao `auth.users`;
`email` único (sem diferenciar maiúsculas); `papel`; `lider_id` (precisa ser líder técnico,
validado por trigger); `jornada_semanal`; `horas_dev_semanais` (≤ jornada; dev 40, líder 26,
demais 0); `senioridade`; `competencias text[]`; `ativo`.

Vínculo com o Auth por e-mail, nos dois sentidos:
- trigger `on_auth_user_created_vincular_colaborador` em `auth.users`;
- trigger `colaboradores_vincular_usuario` ao inserir ou mudar o e-mail do colaborador.

### `configuracoes` (linha única, `id = true`)
`pct_planejado/pct_reserva/pct_interno` (70/20/10, soma = 100), `dia_limite_fechamento` (5),
`dias_alerta_projeto_sem_atualizacao` (7), `pct_alerta_contrato` (80), `updated_by`.

### `clientes`
`nome` (único, sem diferenciar maiúsculas), `documento`, `contato`, `ativo`, `created_by`.

### `contratos`
`cliente_id` → clientes; `nome` (único por cliente); `tipo`; `horas_contratadas`
(obrigatório em banco de horas); `periodicidade_horas` (`mensal` = horas por mês);
`vigencia_inicio`, `vigencia_fim` (opcional, ≥ início); `status`; `observacoes`; `created_by`.

### `contratos_valores` (1:1 com contratos)
`contrato_id` (PK, cascade) e `valor_hora`. Tabela separada para a RLS esconder o valor de
quem não é Proprietário ou Administrativo.

### `projetos` (versão mínima)
`cliente_id`; `contrato_id` (opcional; trigger exige que seja do mesmo cliente); `nome` (único
por cliente); `lider_id` (obrigatório; trigger exige líder técnico ativo); `status`;
`data_inicio_prevista`, `data_fim_prevista`; `created_by`. A ficha completa vem na Fase 2.

### `indisponibilidades`
`colaborador_id` (**nulo = global**, permitido só para `feriado`); `tipo`; `data_inicio`,
`data_fim` (≥ início); `horas_por_dia` (**nulo = dia inteiro**, ou seja, jornada ÷ 5);
`descricao`; `localidade` (informativa: Nacional, SP, São José dos Campos, Jacareí);
`created_by`. Só dias úteis contarão no cálculo de capacidade (etapa 4).

**Feriados 2027 no seed** (globais): nacionais (01/01, 26/03 Sexta-feira Santa, 21/04,
01/05, 07/09, 12/10, 02/11, 15/11, 20/11, 25/12); SP (09/07); São José dos Campos
(19/03, Lei 8.821/2012; 27/07, Lei 1.324/1967); Jacareí (03/04); pontos facultativos
adotados pela ProNext: Carnaval (08–09/02) e Corpus Christi (27/05). Não cadastrados:
Quarta de Cinzas e 08/12 de Jacareí.

### `demandas`
| Campo | Regra |
|---|---|
| `codigo` | identity, exibido como `DEM-0001` (`formatCodigoDemanda`) |
| `titulo`, `descricao` | título obrigatório |
| `cliente_id` | **nulo = Interno** |
| `contrato_id`, `projeto_id` | opcionais; trigger exige que sejam do cliente; sem contrato, herda o do projeto; contrato diferente do projeto é recusado |
| `solicitante`, `data_entrada` | entrada padrão = hoje |
| `prioridade` | padrão `p3` |
| `lider_id` | obrigatório; trigger exige líder técnico ativo |
| `estimativa_horas` | **nulo = "a definir"**; ≥ 0 |
| `status` | padrão `nova`; `concluida_em` preenchido/limpo por trigger |
| `tipo` | `atividade_interna` exige cliente nulo (constraint) |

Constraints: demanda interna sem contrato/projeto; atividade interna sem cliente.

Triggers adicionados na etapa 4A:
- `demandas_registrar_p1_p2`: demanda que entra como P1/P2 (ou é elevada para P1/P2), e
  não está concluída/cancelada, gera um `replanejamentos` do tipo `entrada_p1_p2` em cada
  semana publicada/confirmada/em execução que ainda não terminou (`fim >= current_date`),
  com o líder da demanda como responsável.
- `demandas_guardar_desenvolvedor`: o desenvolvedor só altera `status`, e só para
  `planejada`, `em_execucao`, `bloqueada` ou `concluida`.

### `semanas`
`inicio` (único, segunda-feira), `fim` (gerado: início + 4), `status`, `publicada_em/por`,
`confirmada_em/por`, `iniciada_em/por`, `revisada_em/por`, `observacoes`, `created_by`.
- Status só muda por `avancar_semana()` (trigger `semanas_guardar`); a data só muda em rascunho.

### `planejamento_itens`
`semana_id` (cascade), `colaborador_id`, `demanda_id` (o trio é único), `horas_planejadas`
(> 0), `faixa`, `observacao`, `created_by`.
- `planejamento_itens_normalizar`: colaborador ativo com horas de desenvolvimento; demanda
  não concluída/cancelada; faixa `interno` automática para demanda sem cliente (e nunca
  `interno` para demanda de cliente).
- `planejamento_itens_guardar`: depois de publicada a semana, inclusão/alteração/exclusão
  direta é recusada; só por `replanejar_item()`.
- `planejamento_itens_marcar_planejada`: alocação em semana publicada ou posterior muda a
  demanda `nova`/`priorizada` para `planejada` (o mesmo acontece para toda a grade ao publicar).

### `replanejamentos` (log imutável)
`semana_id`, `tipo`, `demanda_id`, `planejamento_item_id` (set null se o item sair),
`colaborador_afetado_id`, `horas_antes`, `horas_depois`, `motivo`, `impacto`,
`responsavel_id`, `pendente`, `descricao_auto`, `completado_em`, `completado_por`,
`created_at`, `created_by`.
- Gravado só por `replanejar_item()` (motivo e impacto obrigatórios) e pelo trigger de
  P1/P2, que cria o registro **pendente** (sem motivo/impacto, com `descricao_auto`).
- Constraint `replanejamentos_motivo_impacto`: motivo e impacto obrigatórios quando não pendente.
- Trigger `replanejamentos_imutavel`: nenhuma alteração ou exclusão, exceto completar um
  pendente (motivo, impacto, `pendente = false`, quem e quando) e o set null da FK do item.
- `completar_replanejamento(id, motivo, impacto)`: só líder técnico, só registros pendentes.

### Funções do planejamento
| Função | O que faz |
|---|---|
| `avancar_semana(semana_id)` | Líder técnico. Avança rascunho → publicada → confirmada → em_execucao → revisada, registra quem/quando; ao publicar, marca demandas como planejadas |
| `replanejar_item(semana, colaborador, demanda, horas, motivo, impacto, faixa?)` | Líder técnico, semana publicada/confirmada/em execução. `horas > 0` inclui ou altera; `0`/nulo remove. Grava o replanejamento e retorna seu id |
| `horas_indisponiveis(colaborador, inicio)` | Horas de jornada indisponíveis nos dias úteis da semana; no mesmo dia vale a maior indisponibilidade (não soma férias + feriado) |
| `capacidade_efetiva(colaborador, inicio)` | `horas_dev − horas_indisponiveis × horas_dev ÷ jornada` (proporcional), mínimo 0, 2 casas |
| `semana_visivel(semana_id)` | Rascunho só para Proprietário e Líder |
| `alocado_na_demanda(demanda_id)` | Usuário alocado na demanda em semana publicada/confirmada/em execução |
| `alterando_planejamento()` | Sinalizador de transação usado pelas funções acima para passar pelos triggers de guarda |
| `completar_replanejamento(id, motivo, impacto)` | Líder técnico completa um replanejamento pendente |
| `hoje_brasil()` | Data de hoje em America/Sao_Paulo (usar em toda regra com "hoje") |

### Views (security_invoker)
- `v_capacidade_colaborador_semana`: por semana × colaborador com horas de dev:
  `horas_dev_semanais`, `horas_indisponiveis` (desconto em horas de dev),
  `capacidade_efetiva`, `horas_planejado`, `horas_reserva`, `horas_interno`,
  `horas_planejadas`, `ocupacao_pct` (planejadas ÷ capacidade × 100) e
  `excede_capacidade`. Desenvolvedor vê só a própria linha.
- `v_resumo_semana`: por semana: `capacidade_total`, percentuais e `limite_planejado/
  reserva/interno` (capacidade × % da configuração), horas por faixa, `ocupacao_pct`,
  `alerta_planejado/reserva/interno` (horas da faixa > limite),
  `colaboradores_acima_capacidade`, `replanejamentos` e `replanejamentos_pendentes`.

### Seed do planejamento
Semanas 16/11/2026 (revisada, feriado 20/11), 23/11/2026 (em execução, com treinamento de
meio período do Rafael, ausência da Juliana e meio período da Fernanda) e 30/11/2026
(rascunho, Diego acima da capacidade por causa do treinamento). Quatro replanejamentos de
exemplo nas semanas publicadas e um pendente (DEM-0014, P1 que entrou em 23/11).

### Apontamento de horas (Fase 2A)

**Enums:** `status_apontamento` (rascunho, enviado, aprovado, devolvido);
`classificacao_comercial` (banco_horas, faturavel_adicional, escopo_projeto, nao_faturavel,
a_validar).

**`configuracoes` (novas colunas):** `prazo_registro_dias_uteis` (1),
`prazo_envio_dia_semana` (1 = segunda da semana seguinte), `prazo_envio_hora` (12:00,
Brasília), `inicio_controle_apontamentos` (nulo = controle desligado; seed = 09/11/2026).
Editáveis por Proprietário e Líder (bloco "faixas, alertas e prazos" do trigger de guarda).

**`categorias_hora`:** `codigo` (estável, usado pelas regras: `correcao`, `gestao`...),
`nome`, `ordem`, `fora_do_planejamento` (Gestão e Reunião: nunca contam como não
planejadas), `ativo`. As 8 categorias da seção 5.3 são criadas na migration.

**`apontamentos`:** `colaborador_id` (padrão = usuário), `data`, `demanda_id`
(obrigatória; atividades internas são demandas `atividade_interna`, ex.: "Gestão do PMO"),
`cliente_id`/`contrato_id`/`projeto_id` (copiados da demanda por trigger), `categoria_id`,
`descricao` (**mínimo 10 caracteres**, constraint), `horas` (> 0, ≤ 24),
`classificacao_comercial` (padrão a_validar), `classificacao_validada_em/por`, `status`,
`primeiro_envio_em` (base do prazo semanal, não muda em reenvios), `enviado_em`,
`aprovado_em/por`, `devolvido_em/por`, `motivo_devolucao`, `created_at` (**definido pelo
banco** = `agora()`; base do prazo diário). Único (colaborador, demanda, data).
- `apontamentos_guardar`: autor só cria rascunho e só edita/exclui rascunho ou devolvido
  (data, demanda, categoria, descrição, horas); status, aprovação e classificação só pelas
  funções; chama `periodo_fechado(data)`.
- `apontamentos_validar`: data ≤ `hoje_brasil()`, demanda não cancelada, só dev/líder
  apontam, total do dia ≤ 24h, `created_at` imposto pelo banco.
- `apontamentos_auditar` → **`apontamentos_auditoria`** (operação, campos alterados,
  antes/depois em jsonb, motivo, quem, quando). Só leitura.

**Funções:**
| Função | O que faz |
|---|---|
| `pode_aprovar(colaborador, demanda)` | Líder direto do colaborador ou líder da demanda; horas de líder: outro líder ou Proprietário; nunca as próprias |
| `enviar_apontamentos(ids[])` | Autor: rascunho/devolvido → enviado |
| `aprovar_apontamentos(ids[], classificacao?, usar_sugestao)` | Aprovador: enviado → aprovado; aplica a classificação informada ou a sugestão (não mexe em classificação já validada) |
| `devolver_apontamento(id, motivo)` | Aprovador: enviado → devolvido (motivo na auditoria) |
| `reabrir_apontamento(id, motivo)` | Aprovador: aprovado → devolvido (motivo na auditoria) |
| `classificar_apontamentos(ids[], classificacao, validar)` | Líder sugere (enviados/aprovados que aprova, não validados); Adm./Prop. classificam e validam aprovados |
| `classificacao_sugerida(demanda)` | Interna → não faturável; banco de horas/sustentação → banco de horas; escopo fechado ou projeto → escopo de projeto; senão a validar |
| `periodo_fechado(data)` | Gancho do fechamento mensal (Fase 3); hoje sempre `false` |
| `horas_indisponiveis_dia`, `eh_dia_util` | Dia útil = seg–sex sem indisponibilidade de dia inteiro (feriado, férias...) |
| `prazo_registro(colaborador, dia)` | Fim (Brasília) do N-ésimo dia útil seguinte da pessoa |
| `prazo_envio_semana(segunda)` | Dia/hora configurados da semana seguinte |
| `agora()` | Instante atual (simulável em testes) |

**Views:**
- `v_apontamentos`: apontamento + nomes, `semana_inicio`, `horas_planejadas_semana`,
  **`nao_planejada`** (sem alocação da pessoa na demanda em semana publicada ou posterior,
  e categoria não "fora do planejamento"; calculado ao vivo), `pode_aprovar`,
  `classificacao_sugerida`.
- `v_horas_semana_colaborador`: por pessoa/semana: apontado, rascunho, enviado, aprovado,
  devolvido, não planejado e planejado.
- `v_prazo_apontamento_dia`: cada dia útil (desde o início do controle até hoje) de cada
  pessoa: primeiro registro, prazo e situação `no_prazo` / `atrasado` / `pendente`.
- `v_prazo_apontamento_semana`: por pessoa/semana: dias no prazo/atrasados/sem registro,
  `enviada` (já chegou à sexta, todo dia útil tem registro e tudo foi enviado ao menos uma
  vez), `enviada_em` (último primeiro envio), prazo e situação.
- Nas duas views de prazo: Proprietário e Líder veem todos; os demais, só a própria linha.

**Seed 2A:** semana 09/11 (revisada, plano cumprido, tudo no prazo e validado), 16/11
(8h não planejadas; Fernanda e Thiago com dias atrasados; Diego sem registro em 19/11 e
semana atrasada; Juliana enviou às 13h; um aprovado reaberto) e 23/11 (rascunhos,
enviados e um devolvido). Demandas internas "Gestão do PMO" e "Reuniões e revisões".

## Perfis e RLS

### Funções auxiliares (security definer)
| Função | Retorno |
|---|---|
| `papel_atual()` | papel do colaborador ativo logado (null se não houver) |
| `colaborador_atual_id()` | id do colaborador ativo logado |
| `tem_papel(variadic papel[])` | o usuário tem um dos papéis? |
| `lidera(colaborador_id)` | o usuário é líder direto do colaborador? |
| `eh_lider_tecnico_ativo(colaborador_id)` | o colaborador é líder técnico ativo? (validações) |

Usuário autenticado sem colaborador ativo não lê nada. `anon` não lê nada.

### Políticas implementadas
| Tabela | Proprietário | Líder técnico | Desenvolvedor | Administrativo |
|---|---|---|---|---|
| `colaboradores` | ler, criar, alterar | ler | ler | ler, criar, alterar |
| `configuracoes` | ler, alterar faixas, alertas e dia-limite | ler, alterar faixas e alertas | ler | ler, alterar dia-limite |
| `clientes` | ler, criar, alterar | ler, criar, alterar | ler | ler, criar, alterar |
| `contratos` | ler, criar, alterar | ler | ler | ler, criar, alterar |
| `contratos_valores` | ler, criar, alterar, excluir | — | — | ler, criar, alterar, excluir |
| `projetos` | ler, criar, alterar | ler, criar, alterar | ler | ler |
| `indisponibilidades` | ler, criar, alterar, excluir | ler, criar, alterar, excluir | ler (as suas e as globais) | ler, criar, alterar, excluir |
| `demandas` | ler, criar, alterar | ler, criar, alterar | ler (backlog inteiro); alterar só o status das demandas em que está alocado | ler |
| `semanas` | ler (inclusive rascunho) | ler, criar (rascunho), alterar (status só por função), excluir rascunho | ler publicada ou posterior | ler publicada ou posterior |
| `planejamento_itens` | ler | ler; criar/alterar/excluir em rascunho; depois só `replanejar_item` | ler os seus (semana publicada ou posterior) | ler (semana publicada ou posterior) |
| `replanejamentos` | ler | ler (gravação por função) | ler os que o afetam | ler |
| `categorias_hora` | ler, criar, alterar | ler, criar, alterar | ler | ler |
| `apontamentos` | ler todos; aprovar horas de líderes; validar classificação | ler todos; criar/alterar/excluir os seus (rascunho/devolvido); aprovar equipe e suas demandas; sugerir classificação | ler, criar, alterar e excluir os seus (rascunho/devolvido) | ler só aprovados; validar classificação |
| `apontamentos_auditoria` | ler | ler | ler a dos seus | — |

A divisão de colunas em `configuracoes` é garantida pelo trigger `configuracoes_guardar_colunas`.
Nenhuma tabela de cadastro permite exclusão, exceto `indisponibilidades` e `contratos_valores`;
clientes usam `ativo`, contratos e projetos usam `status`.

O espelho dessas regras para mostrar/ocultar botões fica em `src/lib/permissoes.ts`
(`usePermissao("editarContratos")`). Se mudar uma política, atualize os dois.

### Regras aprovadas para as próximas etapas
- Indisponibilidade descontada proporcionalmente quando `horas_dev_semanais < jornada_semanal`.
- Desenvolvedor lê o backlog inteiro; altera só o status das demandas em que está alocado.
- Semanas em `rascunho` visíveis só para Líder técnico e Proprietário; os demais perfis
  só veem semanas `publicada` ou posteriores (inclusive em "Minha semana").

## Padrão de interface

Objetivo: a interface deve ter a aparência de um projeto gerado pelo Lovable. Siga estas
regras em todas as telas novas.

### Regras gerais
- **Tema**: o padrão do shadcn/ui (base slate, HSL) definido em `src/index.css`. Não criar
  cores, fontes, sombras ou CSS próprios; usar apenas classes utilitárias do Tailwind que
  apontam para as variáveis do tema (`bg-background`, `text-muted-foreground`, `border`...).
- **Componentes**: só os de `src/components/ui` (shadcn) e os de `src/components/comum`.
  Ícones só de `lucide-react`. Notificações só com `toast` do `sonner`
  (`toast.success("Demanda salva.")`, `toast.error(...)`).
- **Idioma**: textos em pt-BR; datas `dd/mm/aaaa` e horas `1,5h` via `src/lib/format.ts`.
- **Responsivo**: filtros e ações empilham no celular (`flex-col` → `sm:flex-row`); tabelas
  rolam na horizontal.

### Layout autenticado (`components/layout`)
- `AppLayout`: `SidebarProvider` + `AppSidebar` + `SidebarInset`. Cabeçalho com
  `SidebarTrigger`, título da página (breadcrumb grupo › página, vindo de `navegacao.ts`)
  e `MenuUsuario` à direita (nome, perfil, e-mail, Sair).
- `AppSidebar`: `Sidebar collapsible="icon"` (recolhe para ícones, com tooltip), menu
  filtrado pelo perfil. Para nova tela: adicionar o item em `navegacao.ts` (título, rota,
  ícone, papéis) e a rota em `App.tsx`.

### Componentes de `components/comum`
| Componente | Uso |
|---|---|
| `Pagina` | Toda página: `titulo`, `descricao`, `acoes` (botões à direita) e o conteúdo |
| `SecaoCard` | Todo conteúdo fica em Card: `titulo?`, `descricao?`, `acoes?`, `filtros?` |
| `BarraFiltros` | Linha de filtros acima da lista, com "Limpar filtros" quando há filtro ativo |
| `CampoBusca` | Busca textual com ícone |
| `FiltroSelect` | Select de filtro; o valor `TODOS` desliga o filtro |
| `TabelaDados` | Lista com `Table`: colunas declarativas, skeleton ao carregar, `EstadoVazio` sem dados |
| `EstadoVazio` | Ícone + título + descrição + ação opcional |
| `Selo` | `Badge` a partir de um mapa de `src/lib/selos.ts` |
| `FormularioDialog` | Formulário curto (até ~6 campos) em `Dialog` |
| `FormularioSheet` | Formulário longo em `Sheet` lateral |
| `BotoesFormulario` | Rodapé Cancelar/Salvar com estado de envio (usado pelos dois acima) |
| `ConfirmacaoDialog` | `AlertDialog` antes de ações relevantes (cancelar, inativar, publicar) |
| `MenuUsuario` | Menu do usuário no cabeçalho |
| `Carregando` | Spinner de página inteira (sessão e redirecionamentos) |
| `CampoTexto`, `CampoTextoLongo`, `CampoNumero`, `CampoSwitch` | Campos de formulário (`CamposFormulario.tsx`); `CampoNumero` grava `null` quando vazio |
| `CampoSelect` | Select de formulário; com `rotuloNenhum` aceita `null` (ex.: "Sem contrato") |
| `CampoData` | Popover + Calendar (ptBR); valor `"aaaa-mm-dd"` ou `null` (`opcional` mostra botão limpar) |
| `Indicador` | Card de indicador: rótulo pequeno, número grande, descrição; `alerta` deixa o número em `text-destructive` |
| `colunaSelecao()` | Primeira coluna de `TabelaDados` com checkbox por linha e "todos" (ações em lote) |
| `DialogMotivo` | Dialog com motivo obrigatório (devolver, reabrir, rejeitar...) |

### Esqueleto de uma tela de lista
```tsx
<Pagina titulo="Clientes" descricao="..." acoes={<Button><Plus /> Novo cliente</Button>}>
  <SecaoCard filtros={<BarraFiltros ...><CampoBusca .../><FiltroSelect .../></BarraFiltros>}>
    <TabelaDados colunas={COLUNAS} dados={filtrados} carregando={isLoading}
                 chaveLinha={(c) => c.id} vazio={{ titulo: "Nenhum cliente encontrado" }} />
  </SecaoCard>
</Pagina>
```
As colunas ficam em `components/<modulo>/colunas<Modulo>.tsx` para manter a página pequena.

### Formulários
- `react-hook-form` + `zodResolver`; campos com `FormField`/`FormItem`/`FormLabel`/
  `FormControl`/`FormMessage` do shadcn.
- Mensagens padrão do zod em pt-BR via `src/lib/validacao.ts` (importado em `main.tsx`);
  mensagens específicas podem ser passadas no esquema.
- Enums no zod: `enumDe(TIPO_CONTRATO_LABEL)` (de `lib/validacao.ts`), sem repetir valores.
- Gravação: hooks de mutação criados com `useMutacao` (`hooks/useMutacao.ts`), que mostra
  `toast.success`, invalida as queries e mostra `toast.error` com `traduzirErro`
  (`lib/erros.ts`: duplicidade, permissão, constraints por nome; mensagens de trigger já
  vêm em pt-BR). O formulário chama `await mutateAsync(...)` e fecha; se falhar, continua
  aberto.
- Formulário de cadastro: componente `Formulario<Modulo>` com props `aberto`,
  `onAbertoChange` e o registro em edição (`null` = novo); faz `form.reset` ao abrir.
- Lista editável: clique na linha abre a edição (`onLinhaClick`), só quando há permissão.
  Exclusão (quando existir) por botão de ícone na última coluna + `ConfirmacaoDialog`.
- Tela de configurações: formulário direto no `SecaoCard` (sem Dialog), um cartão por
  bloco de permissão, campos desabilitados para quem não pode editar.
- Listas com muitos filtros (ex.: backlog): estado dos filtros num objeto, função pura
  `aplicarFiltros` e componente `BarraFiltros<Modulo>` próprio (`components/backlog/`).
- Página de detalhe (ex.: `/backlog/:id`): botão "Voltar", `Pagina` com selos abaixo do
  título, ações (Editar, menu de status) à direita e seções em `SecaoCard`. Mudança de
  status por `DropdownMenu`; status destrutivo (cancelar) pede `ConfirmacaoDialog`
  (use `rotuloCancelar="Voltar"` quando a ação também se chama "Cancelar ...").

### Planejamento (`components/planejamento`)
- Página `Planejamento` atende `/planejamento` (semana atual) e `/planejamento/:inicio`
  (data de uma segunda-feira; datas inválidas voltam para `/planejamento`). Navegação
  anterior/atual/próxima; semana inexistente mostra "Criar semana em rascunho" para o líder.
- `ConteudoSemana`: `AvisoPendentes` (Alert destrutivo com "Completar"),
  `IndicadoresSemana` (4 × `Indicador`), `FaixasCapacidade` (`Progress` por faixa, em
  `destructive` quando estoura o limite) e `GradePlanejamento`.
- Grade: `montarGrade()` (função pura) agrupa itens por cliente/projeto (Interno por
  último), ordena por prioridade e calcula subtotais. Linhas = demandas, colunas = pessoas
  (`v_capacidade_colaborador_semana`), rodapé = capacidade, planejado e saldo; quem passa
  da capacidade fica com ícone e texto `destructive`. Faixas diferentes de "planejado"
  aparecem em texto pequeno abaixo das horas.
- Clique numa célula (líder, semana não revisada) abre `DialogAlocacao`: em rascunho grava
  direto (upsert/delete); depois de publicada vira replanejamento (horas antes/depois,
  motivo, impacto) via `replanejar_item`. "Adicionar alocação" abre o mesmo diálogo sem
  demanda/pessoa fixas.
- `AcoesSemana`: um botão com o próximo passo do ciclo (Publicar, Confirmar, Iniciar
  execução, Marcar como revisada), sempre com `ConfirmacaoDialog`.
- Após qualquer ação, invalidar `["semanas"]`, `["planejamento"]` e `["demandas"]`
  (`hooks/useAcoesPlanejamento.ts`).
- "Minha semana": mesma navegação; rascunho é tratado como "não publicado"; indicadores
  pessoais e tabela com `StatusRapido` (Planejada, Em execução, Bloqueada, Concluída),
  desabilitado em semana revisada.

### Apontamentos e aprovações (`components/apontamentos`, `components/aprovacoes`)
- `/apontamentos?semana=`: `ConteudoApontamentos` (remontado por semana) com
  `GradeApontamentos`: linhas = `montarLinhas()` (planejadas da semana publicada + com horas
  + incluídas/copiadas), colunas = seg–sex (sábado/domingo por Switch ou se houver horas).
  Categoria e descrição **na linha** (`LinhaDescricao`, mínimo 10); cada `CelulaHoras` tem
  input (Tab para o próximo dia, salva ao sair, "1,5" aceito) e ícone de descrição do dia
  sempre visível (destacado quando o dia tem descrição própria ou foi devolvido), com
  status, motivo de devolução e histórico (`SheetHistorico`). Enviado/aprovado = célula
  travada. Dias úteis passados sem horas: coluna com "Sem horas" + Alert no topo; folgas
  (feriado/férias) com "Folga". Salvamento das células sem toast (`useMutacao` sem
  `sucesso`).
- `/aprovacoes`: bloco "Semana não enviada" (semanas encerradas, últimas 4) + abas
  "Aguardando aprovação" (filtros, seleção em lote, classificação na aprovação, Devolver
  com `DialogMotivo`) e "Aprovadas recentes" (Reabrir). Contador de pendentes no menu
  (`SidebarMenuBadge`).
- `/horas/classificacao`: horas aprovadas não validadas, por cliente/contrato; validar em
  lote com a classificação atual/sugestão ou outra escolhida.
- "Minha semana": coluna "Apontado" e Alert de dias úteis sem horas (semana atual e
  anterior) com "Apontar agora".

### Selos (`src/lib/selos.ts`)
Só variantes do `Badge`, com cores discretas:

| Variante | Significado | Exemplos |
|---|---|---|
| `destructive` | exige ação imediata | P1 · Crítica, Bloqueada |
| `default` | em andamento / destaque | P2 · Alta, Em execução |
| `secondary` | estado normal do fluxo | P3 · Normal, Priorizada, Planejada, Publicada, Concluída, Ativo |
| `outline` | neutro, inicial ou encerrado | P4 · Baixa, Nova, Cancelada, Rascunho, Revisada, Inativo |

Mapas já definidos (todos tipados com `Enums<>`): `SELO_SITUACAO`, `SELO_STATUS_CONTRATO`,
`SELO_STATUS_PROJETO`, `SELO_PRIORIDADE`, `SELO_STATUS_DEMANDA`, `SELO_STATUS_SEMANA`,
`SELO_FAIXA`, `SELO_STATUS_APONTAMENTO` (devolvido = `destructive`, aprovado = `default`),
`SELO_CLASSIFICACAO` (a validar = `outline`) e `SELO_SITUACAO_PRAZO` (atrasado =
`destructive`). Estimativa nula aparece como Badge `outline`
"A definir" (`components/backlog/Estimativa.tsx`). Contrato suspenso usa `default`;
projeto bloqueado usa `destructive`.

## Rotas
| Rota | Página | Perfis |
|---|---|---|
| `/` | `Index`: redireciona para a rota inicial do perfil | todos |
| `/login` | `Login` (com "Esqueci a senha") | público |
| `/redefinir-senha` | `RedefinirSenha` (destino do link de recuperação) | link do e-mail |
| `/acesso-nao-configurado` | usuário sem colaborador vinculado | autenticado |
| `/minha-semana` | `MinhaSemana` (programação publicada, troca rápida de status) | dev, líder |
| `/planejamento` | `Planejamento` da semana atual | líder, proprietário, administrativo |
| `/planejamento/:inicio` | `Planejamento` da semana que começa em `:inicio` (segunda-feira) | idem |
| `/planejamento/:inicio/replanejamentos` | `ReplanejamentosSemana` (log; completar pendentes) | idem |
| `/backlog` | `Backlog` (lista; filtro padrão "Em aberto") | todos (dev e adm só leem) |
| `/backlog/:id` | `DemandaDetalhe` (editar e mudar status: líder e proprietário) | todos |
| `/apontamentos?semana=` | `Apontamentos` (grade semanal das próprias horas) | dev, líder |
| `/aprovacoes` | `Aprovacoes` (semana não enviada, aprovar/devolver/reabrir) | líder, proprietário |
| `/horas/classificacao` | `ClassificacaoHoras` (validação comercial) | administrativo, proprietário |
| `/cadastros/colaboradores` | `Colaboradores` (somente leitura) | proprietário, administrativo, líder |
| `/cadastros/clientes` | `Clientes` | proprietário, administrativo, líder |
| `/cadastros/contratos` | `Contratos` (líder só lê; valor/hora só prop. e adm.) | proprietário, administrativo, líder |
| `/cadastros/projetos` | `Projetos` (administrativo só lê) | proprietário, administrativo, líder |
| `/cadastros/indisponibilidades` | `Indisponibilidades` | proprietário, administrativo, líder |
| `/configuracoes` | `Configuracoes` (cada bloco editável conforme o perfil) | proprietário, administrativo, líder |
| `*` | `NotFound` | — |

Rota inicial: desenvolvedor → `/minha-semana`; líder e proprietário → `/planejamento`;
administrativo → `/cadastros/colaboradores` (`src/lib/papeis.ts`).

Os papéis de cada rota vêm de `src/components/layout/navegacao.ts`, que também monta o
menu. Esse controle é só de interface; a segurança está na RLS.

## Decisões técnicas
- Apontamento (2A): "primeiro registro do dia" = menor `created_at` entre os apontamentos
  da pessoa naquele dia (apontamento excluído deixa de contar). Semana "enviada" só a partir
  da sexta e com todos os dias úteis registrados; reenvio após devolução não muda o
  `primeiro_envio_em`. Dia útil com indisponibilidade parcial (meio período) continua
  exigindo registro.
- `traduzirErro`: recusas da RLS (inglês) viram "sem permissão"; mensagens de funções e
  triggers (já em pt-BR) são mostradas como vieram.
- shadcn CLI fixado em 2.3.0 (última versão compatível com Tailwind 3).
- `toast`/`toaster` do shadcn não incluídos: notificações via `sonner`.
- `react-resizable-panels@2` e `react-day-picker@9` fixados para compatibilidade
  com os componentes `resizable` e `calendar` gerados.
- Uma única tabela `colaboradores` faz o papel de tabela de perfis. Como só Proprietário
  e Administrativo gravam nela, ninguém altera o próprio papel.
- Usuários de teste criados direto em `auth.users`/`auth.identities` pelo seed; na Fase 1
  não há criação de login pela aplicação (exigiria Edge Function com service role).
- O `shadcn init` gerou variáveis de cor em `oklch` (formato do Tailwind 4), incompatíveis
  com o `hsl(var(--x))` do Tailwind 3. Substituídas pelo tema slate em HSL do template
  Lovable, e `tailwind.config.ts` alinhado ao mesmo template (inclui `container` e
  `destructive-foreground`).
- Embeds do PostgREST sempre pela coluna (`lider:lider_id(nome)`, `cliente:cliente_id(nome)`):
  garante a direção muitos-para-um e evita ambiguidade quando há duas FKs para a mesma
  tabela (ex.: `lider_id` e `created_by` em `projetos`).
- Datas do banco (`"aaaa-mm-dd"`) são lidas com `parseISO` (`parseData` em `lib/format.ts`).
  `new Date("2027-01-01")` interpreta como UTC e mostraria 31/12/2026 no fuso de Brasília.
- Valor/hora é gravado logo após o contrato (duas chamadas). Se a segunda falhar, o contrato
  fica salvo sem valor e o erro aparece no toast.
- Feriados: os de lei confirmados em fonte oficial, mais Carnaval e Corpus Christi
  (pontos facultativos incluídos por decisão do usuário). Ficaram de fora a Quarta de
  Cinzas e o 08/12 de Jacareí (padroeira, citado só em fonte antiga sem lei). Feriados municipais de São José
  dos Campos e Jacareí valem para todos, conforme pedido; `localidade` guarda a origem.
- Rotas de detalhe herdam os papéis da tela principal via `menu` em `ROTAS` (`App.tsx`).
- Demandas: transições de status livres para líder e proprietário (sem máquina de estados
  rígida, para não burocratizar); `concluida_em` acompanha o status. O status `planejada`
  ainda é manual; na etapa 4 poderá ser ajustado pelo planejamento.
- Planejamento: ações (avançar semana, replanejar) são funções `security definer` com
  checagem explícita de papel, e os triggers de guarda só deixam passar alterações feitas
  por elas (sinalizador `pmo.alterando_planejamento`, que o cliente não consegue definir
  via PostgREST). Sem usuário autenticado (seed, service role) os guardas não se aplicam.
- Proprietário acompanha o planejamento (lê tudo, inclusive rascunho), mas não avança
  semana nem replaneja; isso é do líder técnico.
- O banco roda em UTC; por isso toda regra com "hoje" usa `hoje_brasil()` (ver convenções).
- No front, "semana atual" usa a data do navegador (`lib/semana.ts`), que já está no fuso
  do usuário.
- Planejamento e replanejamento só pelo líder técnico; Proprietário e Administrativo veem a
  grade em modo leitura (o Administrativo não vê rascunhos).
- A página de detalhe da demanda mostra alocações e replanejamentos dela
  (`HistoricoPlanejamento`).
- Recuperação de senha: `resetPasswordForEmail` com retorno em `/redefinir-senha`
  (permitido em `additional_redirect_urls` do `config.toml`). Localmente o e-mail chega no
  Mailpit (http://127.0.0.1:54324). Na nuvem, configurar as Redirect URLs do Auth.
