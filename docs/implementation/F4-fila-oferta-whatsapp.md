# F4 · Oferta da fila por WhatsApp

| Campo      | Valor                                                          |
| ---------- | -------------------------------------------------------------- |
| **Status** | concluída (código) · homologação manual pendente               |
| **Plano**  | `docs/plans/plano-fila-oferta-whatsapp.md`                     |
| **Spec**   | `specs/2026-08-18-fase-4-fila-kanban.md` (não alterada)        |
| **Fase**   | 4 de `docs/PLANO.md` (fatia sobre o Kanban já entregue)        |

## Objetivo

No mesmo instante da oferta de horário, disparar WhatsApp ao paciente com texto fixo + link opaco. Copiar o link continua como fallback. Falha de envio vira `patient_messages` pendente no cron `process-patient-messages` já existente. Sem rota `/api/cron` nova e sem mexer no crontab da VPS.

## Entregue

| Arquivo | Função |
| ------- | ------ |
| `supabase/migrations/026_patient_messages_slot_offer.sql` | Enum `slot_offer` em `patient_message_purpose` |
| `src/features/waitlist/domain/slot-offer-whatsapp.ts` | Copy, corpo do texto, expiração do retry (40 min) |
| `src/features/waitlist/lib/send-slot-offer-whatsapp.ts` | Destino, `sendWhatsApp`, persist `sent`/`pending`, cancelar pendentes |
| `src/features/waitlist/actions.ts` | Disparo pós-commit da oferta; cancelar oferta cancela pendente |
| `src/features/waitlist/components/slot-offer-form.tsx` | Botão Oferecer horário; status WhatsApp |
| `src/features/waitlist/components/slot-offer-link.tsx` | Copiar link como fallback |
| `src/features/records/domain/patient-message.ts` | Purpose `slot_offer` |
| `src/features/records/domain/post-surgery-schedule.ts` | Cron aceita `post_surgery` e `slot_offer` |
| `src/features/records/lib/process-pending-patient-messages.ts` | Mesma rota; cancela oferta com mais de 40 min |
| `src/app/api/cron/process-patient-messages/route.ts` | Path inalterado |
| `src/lib/supabase/database.types.ts` | Enum `slot_offer` |

Página pública `/fila/resposta/[token]`, token opaco e `/api/cron/expire-slot-offers` **não** mudaram.

## Testes automatizados

- `waitlist/domain/slot-offer-whatsapp.test.ts`
- `waitlist/lib/send-slot-offer-whatsapp.test.ts`
- `records/domain/post-surgery-schedule.test.ts` (purpose `slot_offer` due)
- `records/lib/process-pending-patient-messages.test.ts` (envio, cancelamento 40 min, canal ausente)

## Evidências de Done

| Comando                | Resultado                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run test`         | OK · 294 passed, 15 skipped                                                                        |
| `npx eslint` (fatia)   | 0 erros nos arquivos desta fatia                                                                   |
| `npx prettier --write` | Arquivos da fatia formatados                                                                       |
| `npm run build`        | OK · Next.js 16.3.1 · rota `/api/cron/process-patient-messages` inalterada                         |
| `npm run db:push`      | OK · `026_patient_messages_slot_offer.sql` aplicada (aviso Docker de cache local, ignorado)        |

UI: dialog **Oferecer horário** na fila (botão no lugar de Gerar link). Disparo real de WhatsApp fica para homologação com canal no ar.

## Pendências

- Homologação recepção: ofertar horário, conferir WhatsApp (ou fallback copiar link se canal/telefone ausente)
- Paciente: abrir o link no celular e aceitar/recusar (fluxo F4 já existente)
