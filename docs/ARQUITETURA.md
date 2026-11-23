# Arquitetura — PMO ProNext

Documento vivo: atualizado a cada etapa. Serve de contexto para o Lovable e o Claude Code.

## Estado atual
- Passo 0: esqueleto do projeto.
- **Fase 1, etapa 1 (base e acesso)**: concluída. Colaboradores, vínculo com o Auth,
  funções de RLS, configurações, login, layout com menu por perfil e rotas protegidas.
- **Padronização visual**: concluída. Tema padrão do shadcn/Lovable e componentes
  reutilizáveis em `src/components/comum/` (ver "Padrão de interface").
- Próximas etapas da Fase 1: 2) cadastros, 3) backlog, 4) planejamento semanal.

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
  components/auth/        # RotaProtegida
  components/layout/      # AppLayout, AppSidebar, navegacao.ts
  components/<modulo>/    # componentes por módulo (colaboradores, ...)
  pages/                  # uma página por rota (pages/cadastros/ para cadastros)
  hooks/                  # useSessao (contexto de sessão), hooks de dados
  integrations/supabase/  # client.ts e types.ts (gerado por npm run db:types)
  lib/                    # utils.ts (cn), format.ts, papeis.ts, selos.ts, validacao.ts
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

### Modelo planejado (etapas seguintes)
Ver a proposta aprovada do passo 1: `clientes`, `contratos`, `contratos_valores`,
`projetos` (mínimo), `indisponibilidades`, `demandas`, `semanas`, `planejamento_itens`,
`replanejamentos`, função `capacidade_efetiva` e views de capacidade.

## Perfis e RLS

### Funções auxiliares (security definer)
| Função | Retorno |
|---|---|
| `papel_atual()` | papel do colaborador ativo logado (null se não houver) |
| `colaborador_atual_id()` | id do colaborador ativo logado |
| `tem_papel(variadic papel[])` | o usuário tem um dos papéis? |
| `lidera(colaborador_id)` | o usuário é líder direto do colaborador? |

Usuário autenticado sem colaborador ativo não lê nada. `anon` não lê nada.

### Políticas implementadas
| Tabela | Proprietário | Líder técnico | Desenvolvedor | Administrativo |
|---|---|---|---|---|
| `colaboradores` | ler, criar, alterar | ler | ler | ler, criar, alterar |
| `configuracoes` | ler, alterar faixas, alertas e dia-limite | ler, alterar faixas e alertas | ler | ler, alterar dia-limite |

A divisão de colunas em `configuracoes` é garantida pelo trigger `configuracoes_guardar_colunas`.

### Regras aprovadas para as próximas etapas
- Indisponibilidade descontada proporcionalmente quando `horas_dev_semanais < jornada_semanal`.
- Desenvolvedor lê o backlog inteiro; altera só o status das demandas em que está alocado.
- Semanas em `rascunho` visíveis só para Líder técnico e Proprietário; os demais perfis
  só veem semanas `publicada` ou posteriores (inclusive em "Minha semana").
- Feriados nacionais, estaduais e municipais de 2027 como indisponibilidades globais.

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
- Após salvar: `toast.success`, fechar o Dialog/Sheet e invalidar a query do react-query.
  Erro do Supabase: `toast.error` com a mensagem (as mensagens dos triggers já são pt-BR).

### Selos (`src/lib/selos.ts`)
Só variantes do `Badge`, com cores discretas:

| Variante | Significado | Exemplos |
|---|---|---|
| `destructive` | exige ação imediata | P1 · Crítica, Bloqueada |
| `default` | em andamento / destaque | P2 · Alta, Em execução |
| `secondary` | estado normal do fluxo | P3 · Normal, Priorizada, Planejada, Publicada, Concluída, Ativo |
| `outline` | neutro, inicial ou encerrado | P4 · Baixa, Nova, Cancelada, Rascunho, Revisada, Inativo |

Mapas já definidos: `SELO_SITUACAO`, `SELO_PRIORIDADE`, `SELO_STATUS_DEMANDA`,
`SELO_STATUS_SEMANA`. Quando os enums forem criados no banco, tipar os mapas com
`Enums<"...">`.

## Rotas
| Rota | Página | Perfis |
|---|---|---|
| `/` | `Index`: redireciona para a rota inicial do perfil | todos |
| `/login` | `Login` | público |
| `/acesso-nao-configurado` | usuário sem colaborador vinculado | autenticado |
| `/minha-semana` | `MinhaSemana` (placeholder, etapa 4) | dev, líder |
| `/planejamento` | `Planejamento` (placeholder, etapa 4) | líder, proprietário, administrativo |
| `/backlog` | `Backlog` (placeholder, etapa 3) | todos |
| `/cadastros/colaboradores` | `Colaboradores` (leitura; edição na etapa 2) | proprietário, administrativo, líder |
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
- Embed do líder no PostgREST usa a coluna (`lider:lider_id(nome)`) para garantir a
  direção muitos-para-um na autorreferência.
