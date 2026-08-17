# ClinRoma

Sistema clínico odontológico: agenda, prontuário, insumos com QR code, estoque, fila Kanban e lembretes internos.

**Piloto:** Clínica Neo Roma (Felipe Roma).

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, RLS, Storage)

## Desenvolvimento

```bash
cp .env.example .env.local
# Preencher variáveis Supabase

npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
  app/              # rotas (app autenticado + link público fila)
  features/         # agenda, patients, records, stock, waitlist
  components/       # UI compartilhada
  lib/              # supabase, env, utils
docs/
  SECURITY.md
```

## Documentação

PRD e decisões de produto ficam no vault `segundo-cerebro` em
`10 Dev/Clientes/clinica-neo-roma-dev/Projetos/operacional/`.

## Projeto relacionado

**DeskcommCRM** (WhatsApp + leads para paciente) é um repositório separado, implementado depois.
