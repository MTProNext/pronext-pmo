# Arquitetura — PMO ProNext

Documento vivo: atualizado a cada fase. Serve de contexto para o Lovable e o Claude Code.

## Estado atual
Passo 0 concluído: esqueleto do projeto, sem módulos nem schema.

## Stack
- Vite 5 + React 18 + TypeScript (SPA), plugin `@vitejs/plugin-react-swc`
- Tailwind CSS 3 (`tailwind.config.ts`) + shadcn/ui (`components.json`, estilo `default`)
- react-router-dom 6, @tanstack/react-query 5, react-hook-form + zod 3,
  lucide-react, recharts 2, date-fns 3 (ptBR), sonner
- Supabase (Postgres, Auth, RLS). Cliente em `src/integrations/supabase/client.ts`

## Estrutura de pastas
```
src/
  components/ui/          # shadcn (gerado pelo CLI)
  components/<modulo>/    # componentes por módulo
  pages/                  # uma página por rota
  hooks/                  # hooks de dados
  integrations/supabase/  # client.ts e types.ts (gerado por npm run db:types)
  lib/                    # utils.ts (cn), format.ts, cálculos puros
supabase/
  config.toml             # Supabase local (confirmação de e-mail desativada)
  migrations/             # schema versionado
  functions/              # Edge Functions (se houver)
  seed.sql                # dados de teste aplicados por db reset
```

## Ambiente
- Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no front-end.
- Local: `http://127.0.0.1:54321`. Nuvem: trocar `.env` + `supabase link` + `supabase db push`.
- Dev server na porta 8080 (padrão Lovable).

## Modelo de dados
_A definir no passo 1._

## Perfis e RLS
_A definir no passo 1._

## Rotas
| Rota | Página |
|---|---|
| `/` | `Index` (placeholder) |
| `*` | `NotFound` |

## Decisões técnicas
- shadcn CLI fixado em 2.3.0 (última versão compatível com Tailwind 3).
- `toast`/`toaster` do shadcn não incluídos: notificações via `sonner`.
- `react-resizable-panels@2` e `react-day-picker@9` fixados para compatibilidade
  com os componentes `resizable` e `calendar` gerados.
