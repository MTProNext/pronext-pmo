# PMO Mínimo ProNext 2027 — Especificação para o Claude Code

## 1. Contexto
A ProNext é uma operação de desenvolvimento com 5 desenvolvedores (40h/semana cada) e
2 líderes técnicos (40h/semana cada; 26h de desenvolvimento, 6h de gestão e 8h de
reuniões/revisões). O PMO não é um departamento: os dois líderes técnicos o conduzem de
forma compartilhada, com decisões estratégicas do Proprietário e apoio do Administrativo.

Objetivo: toda demanda relevante tem responsável, prioridade, estimativa, planejamento,
acompanhamento e encerramento. A aplicação sustenta três pilares sobre a MESMA base de
dados: Capacidade, Horas e Projetos.

Princípios que a aplicação deve respeitar:
- Controle proporcional ao risco: nada de burocracia para pequenas correções.
- Apontar horas deve levar menos de 1 minuto por registro e não interromper o desenvolvimento.
- Um único líder accountable por demanda e por projeto.
- Ocupação não é produtividade: não criar rankings de pessoas por horas.
- Estimativas são progressivas; o sistema deve aceitar "a definir".

## 2. Stack e compatibilidade com o Lovable
O projeto é construído do zero no Claude Code, mas a manutenção futura poderá ser feita
no Lovable. Por isso o código DEVE seguir exatamente as convenções de um projeto Lovable:

**Stack obrigatória (não substituir por alternativas):**
- Vite + React 18 + TypeScript (SPA, sem SSR; NÃO usar Next.js, Remix ou servidor Node)
- Tailwind CSS + shadcn/ui (componentes em `src/components/ui`, gerados pelo CLI do shadcn)
- react-router-dom para rotas; @tanstack/react-query para dados do servidor
- react-hook-form + zod para formulários; lucide-react para ícones; recharts para gráficos
- date-fns (locale ptBR) para datas; sonner para notificações na tela
- Supabase como único backend: Postgres, Auth, RLS, views/funções SQL e, só se
  indispensável, Edge Functions em `supabase/functions/`

**Estrutura de pastas:**
```
src/
  components/ui/          # shadcn, não editar à mão sem necessidade
  components/<modulo>/    # componentes por módulo (backlog, planejamento, horas...)
  pages/                  # uma página por rota
  hooks/                  # hooks de dados (useDemandas, useApontamentos...)
  integrations/supabase/  # client.ts e types.ts (tipos gerados do banco)
  lib/                    # utils.ts (cn), cálculos e helpers puros
supabase/
  migrations/             # todo o schema versionado em SQL
  functions/              # Edge Functions, se houver
```
- Alias `@/` apontando para `src/`.
- Tipos do banco gerados com `supabase gen types typescript` em
  `src/integrations/supabase/types.ts`.
- Variáveis de ambiente apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`;
  nunca usar a service role key no front-end.

**Regras para manter o código fácil de evoluir no Lovable:**
- Arquivos e componentes pequenos e focados (idealmente < 250 linhas).
- Regras de negócio e permissões no banco (RLS, constraints, triggers, views), não
  escondidas no front-end.
- Sem bibliotecas exóticas, monorepo, scripts de build customizados ou config fora do
  padrão Vite.
- Manter `npm run build` e `npm run dev` funcionando sem passos extras.
- Criar `docs/ARQUITETURA.md` com o modelo de dados, perfis/RLS, rotas e decisões
  técnicas, atualizado a cada fase (servirá de contexto para o Lovable e para o Claude Code).

**Outros requisitos:**
- Sem serviços pagos adicionais; caber no plano gratuito do Supabase.
- Interface em pt-BR, datas dd/mm/aaaa, horas em decimal (ex.: 1,5h), responsiva.

## 3. Perfis e permissões (baseado na matriz RACI)
| Perfil | Pode |
|---|---|
| Proprietário | Ver tudo; definir prioridade estratégica; decidir mudanças comerciais de escopo; ver dashboard executivo |
| Líder técnico | Gerir backlog, planejamento semanal, distribuição, projetos, riscos; aprovar/devolver horas da sua equipe e das suas demandas |
| Desenvolvedor | Ver sua programação da semana; apontar e corrigir suas horas; atualizar status e impedimentos das demandas em que está alocado |
| Administrativo | Ver horas aprovadas; ajustar classificação comercial em conjunto com o Proprietário; executar fechamento mensal; exportar |

Implementar com Supabase Auth + tabela de perfis + políticas RLS por papel.

## 4. Cadastros de base
- **Colaboradores**: nome, papel, jornada semanal, horas de desenvolvimento disponíveis
  (líderes: 26h), senioridade, competências, ativo/inativo.
- **Indisponibilidades**: férias, feriados, ausências, treinamentos e outras; por
  colaborador e data/período, em horas. Feriados podem ser globais.
- **Clientes**.
- **Contratos**: cliente, tipo (banco de horas, escopo fechado, mensalidade/sustentação,
  outros), horas contratadas, vigência, valor/hora opcional, status.
- **Configurações**: distribuição da capacidade (padrão 70% planejado, 20% reserva,
  10% interno, editável), data-limite do fechamento mensal, categorias e classificações.

## 5. Os seis controles (módulos)

### 5.1 Backlog de demandas
Campos: título, descrição, cliente, contrato/projeto (ou "Interno"), solicitante, data de
entrada, prioridade, líder accountable (exatamente um), estimativa em horas (pode ser
"a definir"), status (Nova, Priorizada, Planejada, Em execução, Bloqueada, Concluída,
Cancelada), tipo (demanda, urgência, correção, atividade interna).

Prioridades e regra de tratamento:
| Prioridade | Decisão |
|---|---|
| P1 · Crítica | Líder avalia na hora e define a resposta |
| P2 · Alta | Líder avalia impacto e reprogramação |
| P3 · Normal | Entra no próximo planejamento |
| P4 · Baixa | Permanece no backlog |

Entrada de P1/P2 durante a semana gera um registro de replanejamento (ver 5.2).

### 5.2 Planejamento semanal
- Semana de segunda a sexta. Grade colaborador × demanda com horas planejadas e totais
  por linha e coluna (cliente/projeto).
- Capacidade efetiva = horas de desenvolvimento − indisponibilidades da semana.
- Mostrar a faixa planejado/reserva/interno e alertar quando o planejado ultrapassar a
  faixa configurada ou a capacidade de um colaborador.
- Ciclo de vida da semana: Rascunho (quinta, preparação) → Publicada (sexta,
  planejamento) → Confirmada (segunda) → Em execução → Revisada (sexta seguinte,
  planejado × realizado).
- Após publicada, toda alteração relevante exige motivo, responsável e impacto, e entra
  num log de replanejamentos.
- Reserva não usada pode ser alocada a itens do backlog priorizado.

### 5.3 Apontamento de horas
Campos obrigatórios: colaborador, data, cliente, contrato/projeto, demanda (ou atividade
interna), descrição, horas, categoria. Classificação comercial começa como "A validar".
Status de aprovação é automático.

- Categorias: Desenvolvimento, Análise, Reunião, Testes, Correção, Documentação, Gestão,
  Atividade interna.
- Classificação comercial: Banco de horas, Serviço faturável adicional, Escopo de projeto,
  Não faturável, A validar.
- Uma entrada por demanda por dia; tela de apontamento diário rápida (pré-preenchida com
  as demandas planejadas da semana para aquele colaborador).
- Fluxo: Rascunho → Enviado → Aprovado ou Devolvido (com motivo) → corrigido → Enviado.
  O líder valida atividade, esforço e classificação. Aprovação técnica NÃO define
  faturamento: a classificação comercial respeita o contrato.
- Horas aprovadas alimentam saldo de contratos e horas realizadas de projetos.
- Hora apontada em demanda sem alocação na semana conta como "não planejada".
- Ajustes retroativos mantêm histórico (tabela de auditoria via trigger).
- Fechamento mensal com data-limite: após fechado pelo Administrativo, o mês fica
  bloqueado para edição; reabertura só pelo Proprietário, com motivo registrado.
- Exportação CSV das horas aprovadas por mês, cliente e contrato.

### 5.4 Ficha de projeto
Etapas do ciclo de vida: Proposta aprovada → Handover comercial-técnico → Kickoff e
descoberta → Validação do escopo → Estimativa → Planejamento técnico e cronograma →
Execução e acompanhamento → Homologação e aceite → Encerramento e avaliação.

Seções da ficha:
- **Identificação**: cliente, projeto, líder responsável, contrato/proposta, datas previstas.
- **Handover** (checklist com origem de cada informação): proposta aprovada, objetivo,
  escopo vendido e entregáveis, premissas e exclusões, restrições de prazo e
  expectativas, riscos conhecidos.
- **Escopo**: objetivo, funcionalidades, entregáveis, premissas e exclusões, critérios de
  aceite, maturidade (Definido, Parcialmente definido, Indefinido). Escopo indefinido
  impede registrar prazo e esforço definitivos.
- **Planejamento**: fases e atividades, horas estimadas, responsáveis, cronograma (marcos
  com data prevista × realizada).
- **Controle**: status, horas realizadas (de apontamentos aprovados), horas restantes,
  riscos, mudanças, pendências, entregas aceitas, retrabalho.

Status do projeto: Não iniciado, Em descoberta, Planejamento, Em execução, Em homologação,
Bloqueado, Concluído, Cancelado. Exigir atualização ao menos semanal e sinalizar projetos
sem atualização há mais de 7 dias.

**Mudanças de escopo**: tipo (Correção de defeito, Ajuste dentro do escopo, Nova
funcionalidade ou alteração relevante). Fluxo para alterações relevantes: Solicitação →
Análise técnica do líder (horas, arquitetura, prazo, entregáveis) → Avaliação comercial do
Proprietário (absorver, negociar, aditar, reprogramar) → Aprovação do cliente quando
necessária → Atualização do planejamento. Mudança aprovada ajusta a estimativa de
referência do projeto.

Desvio de horas = realizadas − (estimadas + mudanças aprovadas).

### 5.5 Riscos e impedimentos
Campos: tipo (risco ou impedimento), descrição, projeto/demanda vinculado, impacto e
probabilidade (Baixa, Média, Alta), responsável, ação, prazo, status (Aberto, Em
tratamento, Resolvido, Aceito). Impedimento ativo pode marcar a demanda/projeto como
Bloqueado.

### 5.6 Dashboard do PMO
**Capacidade (semanal)**: capacidade disponível, horas planejadas, horas realizadas
(aprovadas), ocupação planejada (planejadas ÷ disponíveis), execução do plano
(realizadas ÷ planejadas), horas não planejadas, quantidade de replanejamentos.

**Projetos**: projetos ativos, atrasados, horas estimadas × realizadas, esforço restante,
mudanças de escopo, entregas aceitas, retrabalho.

**Contratos**: consumo, saldo e alerta de contratos perto do limite de horas.

**Visões de horas**: por colaborador (esforço e disponibilidade), por cliente (consumo),
por projeto (estimado × realizado), por contrato (consumo, saldo e faturamento).

**Revisão semanal do portfólio** (tela de apoio à reunião, respondendo): entregas
concluídas, demandas atrasadas, projetos em risco, contratos perto do limite, pessoas
sobrecarregadas, demandas não planejadas que consumiram capacidade, decisões pendentes
do Proprietário.

**Critérios de sucesso dos 90 dias**: % de demandas registradas centralmente, % de
demandas com responsável, % de apontamentos no prazo (meta ≥ 95%), % de projetos ativos
com ficha, % de semanas com planejamento publicado, % de horas submetidas com aprovação.

## 6. Entrega em fases (alinhada ao roadmap de 90 dias)
1. **Organizar a operação**: autenticação e perfis, cadastros, backlog, planejamento
   semanal com capacidade efetiva.
2. **Controlar a execução**: apontamento diário, aprovação/devolução, auditoria, ficha de
   projeto, handover, mudanças de escopo, riscos e impedimentos.
3. **Medir e evoluir**: dashboard, visões de horas, revisão do portfólio, fechamento
   mensal e exportação.

## 7. Forma de trabalho
0. Se o repositório estiver vazio, crie o esqueleto do projeto antes de tudo: Vite com
   template react-ts e plugin @vitejs/plugin-react-swc, Tailwind 3 com
   `tailwind.config.ts`, shadcn/ui inicializado, alias `@/`, dependências da seção 2,
   `.env.example` com as variáveis do Supabase, `.gitignore` incluindo `.env`, e a
   estrutura de pastas da seção 2. Rode `npm run build` para confirmar e pare para eu revisar.
   **Ambiente local:** não há projeto Supabase na nuvem ainda. Use o Supabase local via
   CLI (`npx supabase init` e `npx supabase start`, que roda em Docker). O `.env` aponta
   para `http://127.0.0.1:54321` com a anon key exibida pelo `supabase start`. Seed em
   `supabase/seed.sql`, aplicado junto com as migrations por `npx supabase db reset`.
   Deixe confirmação de e-mail desativada no `supabase/config.toml` para facilitar os
   testes. Adicione scripts no package.json: `db:start`, `db:stop`, `db:reset` e
   `db:types` (gera `src/integrations/supabase/types.ts` a partir do banco local).
   Nada no código pode depender de estar local: trocar para a nuvem deve exigir apenas
   mudar o `.env` e rodar `supabase link` + `supabase db push`.
1. Antes de codar, leia o repositório e apresente: modelo de dados (tabelas, relações,
   enums), políticas RLS por perfil, lista de telas e plano da Fase 1. Aguarde meu OK.
2. Migrations SQL em `supabase/migrations/`, versionadas; cálculos de indicadores em
   views ou funções SQL, não espalhados no front-end.
3. Um módulo por vez, testável ponta a ponta; testes para as regras de cálculo
   (capacidade efetiva, ocupação, desvio de horas, saldo de contrato).
4. Seed com os dados reais da estrutura: 5 desenvolvedores, 2 líderes, Proprietário,
   Administrativo, Clientes A e B, Projeto C e algumas semanas de planejamento e horas.
   Inclua um usuário de teste para cada perfil (e-mail e senha fictícios documentados no
   README), para eu testar as permissões em localhost.
5. Um commit por etapa com mensagem descritiva.
6. Ao fim de cada etapa: o que foi feito, o que falta e decisões que você tomou sozinho.
