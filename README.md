# PMO ProNext

Aplicação do PMO mínimo da ProNext (Capacidade, Horas e Projetos).
Especificação: [docs/PMO_ESCOPO.md](docs/PMO_ESCOPO.md) · Arquitetura: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

Stack: Vite + React 18 + TypeScript, Tailwind 3 + shadcn/ui, react-router-dom,
@tanstack/react-query, react-hook-form + zod, Supabase (compatível com Lovable).

## Pré-requisitos
- Node.js 18+ e npm
- Docker Desktop em execução (para o Supabase local)

## Primeiros passos
```sh
npm install
npm run db:start            # sobe o Supabase local (Docker); mostra a anon key
cp .env.example .env        # cole a anon key em VITE_SUPABASE_ANON_KEY
npm run db:reset            # aplica migrations + supabase/seed.sql
npm run dev                 # http://localhost:8080
```

Supabase Studio local: http://127.0.0.1:54323 · E-mails (Mailpit): http://127.0.0.1:54324

## Scripts
| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 8080) |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run db:start` / `db:stop` | Sobe / derruba o Supabase local |
| `npm run db:reset` | Recria o banco local com migrations e seed |
| `npm run db:types` | Gera `src/integrations/supabase/types.ts` a partir do banco local |

## Usuários de teste
Serão criados pelo seed na Fase 1 (um por perfil) e documentados aqui.

## Migrar para o Supabase na nuvem
1. Atualize o `.env` com a URL e a anon key do projeto.
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push`
