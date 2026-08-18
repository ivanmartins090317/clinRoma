# Fase 1 · Dados, autenticação e papéis

| Campo    | Valor        |
| -------- | ------------ |
| **Status** | concluída  |
| **Plano**  | `docs/PLANO.md` §6 · Fase 1 |
| **Spec**   | `specs/2026-08-18-fase-1-dados-auth-papeis.md` |

## Objetivo

Materializar o modelo de dados do MVP, RLS por papel, login de colaboradores, guarda na aplicação e infraestrutura de auditoria. Destrava todos os módulos seguintes.

## Entregue

### Banco de dados (migrations)

| Arquivo | Conteúdo |
| ------- | -------- |
| `001_profiles_dentists.sql` | `profiles`, `dentists`, enums, helpers RLS, trigger signup |
| `002_patients_records.sql` | `patients`, `medical_records`, `tooth_findings`, `record_attachments` |
| `003_appointments.sql` | `appointments` |
| `004_stock.sql` | `supplies`, `supply_packages`, `supply_movements`, `supply_sheets` |
| `005_waitlist.sql` | `waitlist_entries`, `slot_offers`, `patient_slot_responses` (token e IP só hash) |
| `006_reminders_audit.sql` | `reminders`, `audit_log` |
| `007_storage.sql` | Buckets privados + policies |
| `008_seed_dev.sql` | 5 dentistas + 5 contas (uma por papel), idempotente |
| `009_fix_seed_auth.sql` | Correção de `auth.identities` para login das contas seed |

Todas as tabelas com RLS ativa. Matriz de papéis do §5 da spec refletida nas policies.

### Tipos e clients

- `src/lib/supabase/database.types.ts` (alinhado ao schema; regerar com `npm run db:types` quando Docker/CLI disponível)
- `src/lib/supabase/admin.ts` (service role, server-only)

### Auth e guarda

- `src/lib/auth/session.ts` · resolução de sessão e perfil
- `src/lib/auth/roles.ts` · mapa papel → módulos
- `src/lib/auth/guard.ts` · assert de rota, sanitize `returnTo`
- `src/features/auth/` · schemas Zod, actions login/logout, `LoginForm`, `LogoutForm`
- `src/app/(auth)/login/` · tela de login mobile-first
- `src/app/(app)/acesso-negado/` · página 403
- `middleware.ts` · refresh + redirect visitante → login; login autenticado → `/hoje`
- `src/app/(app)/layout.tsx` · guarda por papel
- `src/components/app-shell.tsx` · nav filtrada por papel + logout

### Auditoria

- `src/lib/audit/write-audit-log.ts` + teste unitário

### Testes automatizados

- `roles.test.ts`, `guard.test.ts`, `schemas.test.ts`
- `write-audit-log.test.ts`
- `rls-policy.test.ts` (expectativas offline + integração remota com `RUN_RLS_TESTS=true`)
- `app-shell.test.ts` (filtro de módulos)

### Documentação operacional

- `README.md` atualizado: contas seed, `db:push`, papéis, `db:types`
- `.env.example` com `SUPABASE_SERVICE_ROLE_KEY`

## Contas seed (desenvolvimento)

Senha comum: `ClinRomaDev2026!`

| Papel | E-mail |
| ----- | ------ |
| admin | `admin@clinroma.dev` |
| dentist | `dentist@clinroma.dev` |
| reception | `reception@clinroma.dev` |
| room_assistant | `assistant@clinroma.dev` |
| viewer | `viewer@clinroma.dev` |

Dentista de teste vinculado ao registro clínico **Dr. Felipe Roma**.

## Evidências de Done

| Comando | Resultado |
| ------- | --------- |
| `npm run db:push` | Migrations 001–009 aplicadas no Supabase de dev |
| `npm run lint` | OK |
| `npm run build` | OK |
| `npm run test` | 56 testes passando (inclui RLS remoto com `.env.local`) |

## Pendências menores desta fase

- Validação manual UI (login recepção/dentista/auxiliar, 403, rota pública fila): ver `docs/state/PENDENCIAS.md`
- `npm run format:check` global ainda falha em arquivos legados da F0 (fora do escopo F1)
- `npm run db:types` requer Docker para Supabase CLI neste ambiente; types manuais commitados

## Fora desta fase (correto)

- CRUD visível de pacientes, consultas, fila, estoque
- Calendário, áudio, QR, Whisper, Resend
- Fila pública funcional (aceitar/recusar)
- Painel admin de usuários
- Homologação `manual-report` (Fase 6)
