---
name: supabase-migrations
description: >-
  Aplica migrations SQL do Supabase no projeto remoto via CLI (db push).
  Use quando o usuário pedir rodar migrations, atualizar schema, criar tabelas
  RLS, buckets storage ou sincronizar supabase/migrations com o banco da ClinRoma.
---

# Supabase Migrations — ClinRoma

Piloto: **Clínica Neo Roma** · single-tenant (sem `clinic_id`).

## Projeto Supabase

| Campo | Valor |
| --- | --- |
| Ref | `skdtkmruianufgenrlqv` |
| URL | `https://skdtkmruianufgenrlqv.supabase.co` |
| Dashboard | [supabase.com/dashboard/project/skdtkmruianufgenrlqv](https://supabase.com/dashboard/project/skdtkmruianufgenrlqv) |

## Pré-requisitos

1. `.env.local` na **raiz do repo** com:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://skdtkmruianufgenrlqv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do dashboard>
   SUPABASE_DB_PASSWORD=<senha do Postgres>
   ```

   A senha do banco fica em **Settings → Database → Database password** no dashboard.
   Se ainda não estiver no `.env.local`, pedir ao usuário para adicionar (não sobrescrever o arquivo sem confirmação).

2. Migrations em `supabase/migrations/` (ordem lexicográfica: `001_`, `002_`, …).

3. **Nunca** commitar `.env.local` nem expor `SUPABASE_DB_PASSWORD` ou anon key no chat/código versionado.

## Comando padrão (sempre preferir)

Na raiz do projeto:

```bash
npm run db:push
```

Dry-run (lista o que seria aplicado):

```bash
npm run db:push:dry
```

Script: `.cursor/skills/supabase-migrations/scripts/push-migrations.mjs`

## Fluxo do agente

1. Confirmar que `SUPABASE_DB_PASSWORD` está em `.env.local` (não sobrescrever o arquivo sem pedir).
2. Se o usuário pediu nova migration, criar `supabase/migrations/NNN_descricao.sql` idempotente quando possível (`if not exists`, `on conflict do nothing`).
3. Rodar `npm run db:push:dry` antes, se houver dúvida sobre o delta.
4. Rodar `npm run db:push` e reportar sucesso ou erro.
5. Aviso Docker no final da CLI é cache local — **ignorar** se migrations aplicaram.

## Domínio de dados (MVP — ver `docs/PLANO.md` §5)

Ordem sugerida de migrations (criar conforme fases; nomes ilustrativos):

| Sequência | Conteúdo |
| --- | --- |
| `001_profiles_dentists.sql` | `profiles` (ref `auth.users`, nome, papel, ativo), `dentists` (CRO, cor agenda, ativo), trigger signup |
| `002_patients_records.sql` | `patients`, `medical_records`, `tooth_findings`, `record_attachments` |
| `003_appointments.sql` | `appointments` (status `AppointmentStatus` de `src/types/clinroma.ts`) |
| `004_stock.sql` | `supplies`, `supply_packages`, `supply_movements`, `supply_sheets` |
| `005_waitlist.sql` | `waitlist_entries`, `slot_offers`, `patient_slot_responses` (token só hash; IP só hash) |
| `006_reminders_audit.sql` | `reminders`, `audit_log` |
| `007_storage.sql` | buckets privados + policies: `record-photos`, `record-audio`, `supply-sheets`, `supply-labels` |

Atualizar esta tabela quando as migrations reais forem criadas.

## Papéis e RLS

Papéis: `admin`, `dentist`, `reception`, `room_assistant`, `viewer`.

- Single-tenant: políticas por **papel** e sessão, **sem** `clinic_id` / `account_id`.
- Defense in depth: RLS + checagem server-side nas actions.
- `service_role` só em route handlers / jobs — nunca no client.

## Nova migration — checklist

- [ ] RLS em toda tabela nova
- [ ] Policies por papel (`admin`, `dentist`, `reception`, `room_assistant`, `viewer`)
- [ ] Token da fila: aleatório, só hash no banco, expira em 40 min
- [ ] IP do paciente: hash, nunca texto claro
- [ ] Storage: bucket privado + policy por path autorizado
- [ ] Service role não necessária no client
- [ ] Nome sequencial `NNN_snake_case.sql`
- [ ] Rodar `npm run db:push` após criar
- [ ] Conferir checklist de `docs/SECURITY.md`

## Troubleshooting

| Erro | Ação |
| --- | --- |
| `password authentication failed` | Senha errada em `SUPABASE_DB_PASSWORD` — resetar no dashboard Supabase |
| `SUPABASE_DB_PASSWORD` ausente | Usuário deve adicionar ao `.env.local` |
| Policy já existe | Tornar migration idempotente: `drop policy if exists ...` antes de `create policy` |
| `link` / privileges | **Não** usar `supabase link`; usar `npm run db:push` (conexão direta Postgres) |

## Alternativa manual

SQL Editor no dashboard Supabase → colar conteúdo dos arquivos em ordem. Preferir o script para histórico consistente na tabela `supabase_migrations.schema_migrations`.
