# Fase 0 · Fundação do repositório

| Campo    | Valor        |
| -------- | ------------ |
| **Status** | concluída  |
| **Plano**  | `docs/PLANO.md` §6 · Fase 0 |
| **Spec**   | `specs/2026-08-17-fase-0-fundacao.md` |

## Objetivo

Repo clonável, shell mobile-first navegável, dev HTTPS, shadcn mínimo e base Supabase CLI pronta para a Fase 1.

## Entregue

### Git e onboarding

- `.gitignore` com `!.env.example`
- `.env.example` versionado
- `README.md` com setup clone, HTTPS mobile e scripts de qualidade

### Qualidade de código

- Prettier + ESLint alinhados (`format`, `format:check`, `lint`)
- Vitest configurado (`npm run test`)

### UI e marca

- shadcn/ui inicializado (`components.json`)
- Tokens Neo Roma em `globals.css` + theme shadcn
- Componentes base: `Button`, `Input`
- `AppShell` com sidebar (desktop) e barra inferior (mobile, 5 módulos; Scan QR sob Estoque)

### Supabase CLI

- `supabase/config.toml`
- Pasta `supabase/migrations/` criada (vazia na F0)
- Scripts `db:push` e `db:push:dry`

### Sessão e rotas

- `middleware.ts` com refresh de sessão Supabase SSR (sem guarda de rota na F0)
- Rotas placeholder: `/hoje`, `/agenda`, `/pacientes`, `/fila`, `/estoque`, `/estoque/scan`
- Página pública `/fila/resposta/[token]` (UI estática, botões desabilitados)
- Redirect `/` → `/hoje`

### Mobile dev

- `npm run dev` com `--experimental-https`
- Padrões de toque em `globals.css`: alvo 44×44, fonte 16px em inputs, `safe-area-inset`

### Clients Supabase

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/env.ts` com validação Zod

## Evidências de Done

- `npm run lint` passa
- `npm run build` passa
- Navegação entre módulos no mobile via barra inferior

## Fora desta fase (correto)

- Migrations SQL, RLS, login, seed, `src/features/*`
- Homologação manual (`manual-report`)
