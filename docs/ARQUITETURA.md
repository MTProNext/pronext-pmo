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
- Próximas etapas da Fase 1: 3) backlog, 4) planejamento semanal.

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
                          #  configuracoes)
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
(19/03, Lei 8.821/2012; 27/07, Lei 1.324/1967); Jacareí (03/04). Pontos facultativos
(Carnaval, Quarta de Cinzas, Corpus Christi) e o 08/12 de Jacareí não foram cadastrados
(ver decisões).

### Modelo planejado (etapas seguintes)
`demandas`, `semanas`, `planejamento_itens`, `replanejamentos`, função
`capacidade_efetiva` e views de capacidade (proposta aprovada do passo 1).

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

### Selos (`src/lib/selos.ts`)
Só variantes do `Badge`, com cores discretas:

| Variante | Significado | Exemplos |
|---|---|---|
| `destructive` | exige ação imediata | P1 · Crítica, Bloqueada |
| `default` | em andamento / destaque | P2 · Alta, Em execução |
| `secondary` | estado normal do fluxo | P3 · Normal, Priorizada, Planejada, Publicada, Concluída, Ativo |
| `outline` | neutro, inicial ou encerrado | P4 · Baixa, Nova, Cancelada, Rascunho, Revisada, Inativo |

Mapas já definidos: `SELO_SITUACAO`, `SELO_STATUS_CONTRATO`, `SELO_STATUS_PROJETO`
(tipados com `Enums<>`), `SELO_PRIORIDADE`, `SELO_STATUS_DEMANDA`, `SELO_STATUS_SEMANA`
(tipar com `Enums<>` quando os enums existirem no banco). Contrato suspenso usa `default`;
projeto bloqueado usa `destructive`.

## Rotas
| Rota | Página | Perfis |
|---|---|---|
| `/` | `Index`: redireciona para a rota inicial do perfil | todos |
| `/login` | `Login` (com "Esqueci a senha") | público |
| `/redefinir-senha` | `RedefinirSenha` (destino do link de recuperação) | link do e-mail |
| `/acesso-nao-configurado` | usuário sem colaborador vinculado | autenticado |
| `/minha-semana` | `MinhaSemana` (placeholder, etapa 4) | dev, líder |
| `/planejamento` | `Planejamento` (placeholder, etapa 4) | líder, proprietário, administrativo |
| `/backlog` | `Backlog` (placeholder, etapa 3) | todos |
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
- Feriados: cadastrados só os de lei confirmados em fonte oficial. Ficaram de fora os pontos
  facultativos (Carnaval 08–09/02, Quarta de Cinzas, Corpus Christi 27/05) e o 08/12 de
  Jacareí (padroeira, citado só em fonte antiga sem lei). Feriados municipais de São José
  dos Campos e Jacareí valem para todos, conforme pedido; `localidade` guarda a origem.
- Recuperação de senha: `resetPasswordForEmail` com retorno em `/redefinir-senha`
  (permitido em `additional_redirect_urls` do `config.toml`). Localmente o e-mail chega no
  Mailpit (http://127.0.0.1:54324). Na nuvem, configurar as Redirect URLs do Auth.
