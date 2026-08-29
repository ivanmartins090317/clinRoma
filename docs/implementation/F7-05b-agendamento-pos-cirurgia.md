# F7-05b · Agendamento pós-cirurgia

| Campo      | Valor                                                 |
| ---------- | ----------------------------------------------------- |
| **Status** | concluída (código) · homologação na Fase 7            |
| **Plano**  | `docs/plans/plano-F7.md` · extensão do Passo 5        |
| **Spec**   | `specs/2026-08-28-f7-05b-agendamento-pos-cirurgia.md` |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)              |

## Objetivo

Na aba Pós-cirurgia, agendar texto + data/hora. A WAHA só dispara na hora. O relógio é a VPS Campinas (a cada 5 minutos). Atalho Enviar agora permanece e não passa pelo relógio. Anamnese não muda.

## Entregue

| Arquivo                                                        | Função                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/features/records/domain/post-surgery-schedule.ts`         | Fuso America/Sao_Paulo, vencimento, teto de 3 tentativas, cancelar |
| `src/features/records/domain/post-surgery-schedule.test.ts`    | Vitest do horário, cron e cancelamento                             |
| `src/features/records/lib/schedule-post-surgery-whatsapp.ts`   | Agendar e cancelar                                                 |
| `src/features/records/lib/process-pending-patient-messages.ts` | Job: lote de 25, claim por attempt_count                           |
| `src/features/records/whatsapp-actions.ts`                     | Actions de agendar, enviar agora e cancelar                        |
| `src/features/records/components/post-surgery-message.tsx`     | Data/hora, Agendar envio, Enviar agora, lista                      |
| `src/app/api/cron/process-patient-messages/route.ts`           | Cron `CRON_SECRET`                                                 |
| `supabase/migrations/025_patient_messages_schedule_f7.sql`     | `scheduled_at`, `attempt_count`, status `cancelled`                |
| `vercel.json`                                                  | Manifesto sem relógio nativo (`crons` vazio)                       |

Adapter WAHA (`send-whatsapp.ts`) **não** mudou o contrato HTTP.

## Testes automatizados

- 08:00 em São Paulo vira `11:00Z`; passado recusado; cancelado/enviado/convite fora do cron
- Canal ausente: job não chama banco nem gateway
- Rótulos Agendado / Enviado / Falhou / Cancelado

## Evidências de Done

| Comando                | Resultado                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `npm run test`         | OK · 282 passed, 15 skipped                                                                  |
| `npx eslint` (fatia)   | 0 erros nos arquivos desta fatia. Repo: 1 erro pré-existente em `password-input.tsx`         |
| `npx prettier --write` | Arquivos da fatia formatados                                                                 |
| `npm run build`        | OK · Next.js 16.3.1 · rota `/api/cron/process-patient-messages`                              |
| `npm run db:push`      | OK · `025_patient_messages_schedule_f7.sql` aplicada (aviso Docker de cache local, ignorado) |

## Pendências

- Homologação com WAHA no ar e número de teste: agendar, esperar a VPS acordar o job (ou chamar o endpoint), cancelar, Enviar agora
- Relógio do piloto: VPS Campinas a cada 5 minutos. Hospedagem Hobby sem relógio nativo. **Enviar agora** não depende do relógio.
- Ops da VPS continua fora desta fatia
