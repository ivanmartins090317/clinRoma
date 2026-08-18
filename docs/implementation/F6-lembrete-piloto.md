# Fase 6 · Lembrete e piloto

| Campo      | Valor                                              |
| ---------- | -------------------------------------------------- |
| **Status** | concluída (código) · homologação manual pendente   |
| **Plano**  | `docs/PLANO.md` §6 · Fase 6                        |
| **Spec**   | `specs/2026-08-18-fase-6-lembrete-piloto.md`       |

## Objetivo

Lembrete pós-consulta por e-mail ao dentista (Resend), retentativa automática, visibilidade operacional, cron de processamento, preparação para deploy piloto e homologação manual integral.

## Entregue

### Banco de dados (migrations)

| Arquivo               | Conteúdo                                              |
| --------------------- | ----------------------------------------------------- |
| `018_reminders_f6.sql` | `attempt_count`, `next_attempt_at`, unicidade consulta/canal |

### Feature `src/features/reminders/`

| Área       | Arquivos                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| Domínio    | elegibilidade, retentativa, conteúdo e-mail + testes Vitest               |
| Dados      | `queries.ts` (por consulta, falhas 7 dias)                               |
| Escrita    | `actions.ts` (reenvio admin), `schemas.ts`                               |
| Server lib | `enqueue-reminder.ts`, `send-reminder-email.ts`, `process-pending-reminders.ts` |
| UI         | `reminder-status-badge.tsx`, `reminder-failures-panel.tsx`               |
| E-mail     | `src/lib/email/resend-client.ts`                                         |

### Integrações

- `src/features/agenda/actions.ts` enfileira ao marcar consulta **concluída**
- `/agenda` e `/hoje` exibem badge de situação do lembrete
- `/hoje` (admin) painel **Lembretes com falha** + reenvio
- Cron `/api/cron/process-reminders` (Vercel `*/5 * * * *`)
- `.env.example`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

### Homologação (estrutura)

- `docs/relatorio-testes-manuais.html` (Neo Roma, TCs FL-01…FL-08 pendentes)
- `docs/evidencias/README.md`

### Dependência

`resend`

### Testes automatizados

- `reminders/domain/reminder-eligibility.test.ts`
- `reminders/domain/retry-policy.test.ts`
- `reminders/domain/email-content.test.ts`

## Checklist segurança (`docs/SECURITY.md`)

| Feature   | RLS | Auth server | Zod | Sem service_role client | Upload | Rotas públicas | Logs sem PHI |
| --------- | --- | ----------- | --- | ----------------------- | ------ | -------------- | ------------ |
| Auth      | OK  | OK          | OK  | OK                      | n/a    | n/a            | OK           |
| Agenda    | OK  | OK          | OK  | OK                      | n/a    | n/a            | OK           |
| Prontuário| OK  | OK          | OK  | OK                      | OK     | n/a            | OK           |
| Fila      | OK  | OK          | OK  | OK (jobs)               | n/a    | OK             | OK           |
| Estoque   | OK  | OK          | OK  | OK                      | OK     | n/a            | OK           |
| Lembretes | OK  | OK          | OK  | OK (jobs)               | n/a    | n/a            | OK           |

## Evidências de Done

| Comando                | Resultado                         |
| ---------------------- | --------------------------------- |
| `npm run db:push`      | Migration 018 aplicada            |
| `npm run lint`         | OK                                |
| `npm run build`        | OK                                |
| `npm run test`         | OK · 110 passed, 15 skipped       |
| `npm run format:check` | Legado F0–F5 com warn; F6 formatado |

## Homologação manual pendente

Ver `docs/manual-dev/08-fase-6-lembrete-piloto.md` e `docs/state/PENDENCIAS.md`.

- Relatório HTML preenchido com evidências desktop + mobile
- FL-06: concluir consulta → e-mail dentista (Resend configurado)
- Deploy produção (Supabase + Vercel) documentado, execução operacional

## Deploy produção (operacional)

Checklist documentado no manual-dev § Deploy. Não executado nesta entrega de código.
