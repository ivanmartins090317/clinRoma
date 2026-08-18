# Plano F0 · Fundação do repositório

> Fase 0 do `docs/PLANO.md` · Autonomia: medium
> Status: **aprovado · em implementação** · **Prettier (item 4) já concluído**

## Objetivo

Deixar o repo clonável, com DX mínima (lint, format, build), shell mobile navegável, dev HTTPS para testes em celular real, e base Supabase/shadcn pronta para a Fase 1.

**Pronto quando:** `npm run lint` e `npm run build` passam limpos; clone + `.env.example` roda; navegação entre todos os módulos funciona no iPhone via dev HTTPS.

---

## 1. Abordagem (6 passos)

### Passo 1 · Git e onboarding

Corrigir `.gitignore` (`!.env.example`), versionar `.env.example`, abrir branch `chore/fase-0-fundacao` e commitar todo o trabalho local ainda untracked (app, docs, brand, supabase, `.cursor/rules` e skills relevantes).

### Passo 2 · Qualidade de código

~~Adicionar Prettier alinhado ao ESLint~~ **Feito.** Resta: corrigir os 2 warnings de lint (imports órfãos em `app-shell.tsx` e `page.tsx`) para o DoD “lint limpo”.

### Passo 3 · shadcn/ui + tokens Neo Roma

Inicializar shadcn (`components.json`), mapear CSS variables da marca para o theme shadcn em `globals.css`, criar pasta `src/components/ui/` com componentes base mínimos (Button, Input) para validar integração com Tailwind 4.

### Passo 4 · Supabase CLI e estrutura

Rodar `supabase init` (gerar `supabase/config.toml`), manter `supabase/migrations/` com `.gitkeep`; **sem** migrations SQL de domínio (isso é Fase 1). Confirmar scripts `db:push` / `db:push:dry` documentados no README.

### Passo 5 · Sessão e shell mobile

Criar `middleware.ts` (refresh de sessão Supabase SSR, sem guarda de rota ainda). Atualizar `AppShell` com barra inferior fixa em telas `< md`, sidebar mantida a partir de `md`. Definir quais módulos entram na barra (6 itens de `CLINROMA_MODULES` ou agrupar Scan sob Estoque).

### Passo 6 · Mobile dev e padrões de toque

Habilitar HTTPS no `npm run dev` (`next dev --experimental-https` ou equivalente), documentar acesso via IP local no README. Adicionar em `globals.css`: alvo mínimo 44×44px, `font-size: 16px` em inputs, `padding` com `env(safe-area-inset-*)`. Validar build, lint, format e navegação no iPhone.

---

## 2. Arquivos a criar ou alterar

### Criar

| Arquivo                                      | Motivo                     |
| -------------------------------------------- | -------------------------- |
| `docs/plans/plano-F0.md`                     | Este plano                 |
| `middleware.ts`                              | Refresh de sessão Supabase |
| `components.json`                            | Config shadcn              |
| `src/components/ui/button.tsx` (e similares) | Base shadcn                |
| `supabase/config.toml`                       | Supabase CLI init          |
| Certificados dev (se necessário)             | HTTPS local                |

### Alterar

| Arquivo                                   | Motivo                                                      |
| ----------------------------------------- | ----------------------------------------------------------- |
| `.gitignore`                              | Liberar `.env.example`                                      |
| `.env.example`                            | Versionar template (já existe localmente)                   |
| `package.json`                            | Script dev HTTPS; deps shadcn                               |
| `eslint.config.mjs`                       | ~~Prettier~~ já feito                                       |
| `prettier.config.mjs` / `.prettierignore` | ~~Prettier~~ já feito                                       |
| `README.md`                               | Setup clone, HTTPS mobile, format/lint                      |
| `src/components/app-shell.tsx`            | Bottom nav + remover import órfão                           |
| `src/app/page.tsx`                        | Remover import órfão                                        |
| `src/app/globals.css`                     | Theme shadcn + padrões de toque                             |
| `src/app/layout.tsx`                      | Alinhar body aos tokens Neo Roma (hoje usa `zinc-*`)        |
| `src/lib/env.ts`                          | Default `NEXT_PUBLIC_APP_URL` para HTTPS dev (se aplicável) |
| `next.config.ts`                          | Opcional: ajustes dev HTTPS                                 |

### Já concluído (fora do diff principal)

- `prettier.config.mjs`, `.prettierignore`, scripts `format` / `format:check`, `eslint-config-prettier`

---

## 3. Fora de escopo

- Migrations SQL, RLS, tabelas e buckets Storage (Fase 1)
- Tela `/login`, guarda por papel, seed de dentistas (Fase 1)
- Pasta `src/features/*` e lógica de negócio dos módulos
- Vitest e homologação manual (skill `manual-report` na Fase 6, antes da entrega ao cliente)
- Componentes de calendário, gravador de áudio, scanner QR
- Correção de `docs/SECURITY.md` (menção a `clinic_id` vs single-tenant) — pode ser feita na Fase 1
- Deploy Vercel / ambiente de produção

---

## 4. Riscos técnicos

| Risco                                                                | Mitigação                                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| shadcn + Tailwind 4 com tokens customizados                          | Mapear variables shadcn para `:root` Neo Roma; validar um componente antes de expandir |
| HTTPS no Windows + certificado no iPhone                             | Documentar passo a passo; usar `--experimental-https` do Next ou mkcert                |
| Bottom nav com 6 módulos apertada                                    | Avaliar agrupar Scan QR dentro de Estoque ou scroll horizontal                         |
| Middleware sem login pode gerar falsa sensação de segurança          | Escopo explícito: só refresh; guarda de rota fica na Fase 1                            |
| Commit grande mistura scaffold + infra                               | Branch dedicada; mensagem de commit clara por tema se preferir commits atômicos        |
| Duplicação de cores (`globals.css`, `brand-colors.ts`, theme shadcn) | Centralizar em CSS variables; TS só referencia quando necessário                       |

---

## 5. Paths críticos

**Sim.** A Fase 0 toca caminhos que afetam todo o app:

| Path                           | Impacto                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| `middleware.ts` (novo, raiz)   | Toda request passa pelo middleware; erro aqui quebra navegação ou cookies |
| `src/components/app-shell.tsx` | Shell de todas as rotas `(app)/*`; bottom nav muda UX mobile global       |
| `src/app/globals.css`          | Tokens de marca, theme shadcn e padrões de toque em todo o UI             |
| `src/app/(app)/layout.tsx`     | Envolve todas as páginas autenticadas                                     |
| `src/app/layout.tsx`           | Root layout; fontes e classes do body                                     |
| `package.json` (script `dev`)  | Fluxo diário de desenvolvimento e teste mobile                            |
| `.gitignore` / `.env.example`  | Onboarding de qualquer dev novo no projeto                                |

**Não críticos para runtime**, mas importantes para DX: `eslint.config.mjs`, `prettier.config.mjs`, `supabase/config.toml`, `components.json`.

---

## Decisões pendentes (antes de implementar)

1. ~~Bottom nav: 6 ícones ou 5 (Scan agrupado em Estoque)?~~ **5 itens; Scan sob Estoque**
2. Commit único ou commits atômicos por tema na branch F0?
3. Incluir `.cursor/` no commit da Fase 0?
4. ~~shadcn: só scaffold (Button/Input) ou mais componentes base já na F0?~~ **Só Button + Input**

---

Implementação em andamento na branch `chore/fase-0-fundacao`.
