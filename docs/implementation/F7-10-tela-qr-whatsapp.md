# F7-10 · Tela de QR da sessão WhatsApp

| Campo      | Valor                                               |
| ---------- | --------------------------------------------------- |
| **Status** | concluída (código) · homologação operacional aberta |
| **Plano**  | `docs/plans/plano-tela-qr-whatsapp.md`              |
| **Spec**   | `specs/2026-08-29-tela-qr-whatsapp.md`              |
| **Fase**   | 7 de `docs/PLANO.md` (fase **permanece aberta**)    |

## Objetivo

Admin e recepção pareiam a sessão `default` da clínica **dentro** do ClinRoma (iniciar se parada, ver QR só em `SCAN_QR`, desconectar com confirmação). O menu e a Hoje leem o **status persistido**, não o gateway. Dentista só vê o card na Hoje, sem atalho. Auxiliar e visualizador não veem a feature. O contrato de disparo (`destino` + `texto`) permanece intacto.

Esta fatia **não** fecha a Fase 7.

## Entregue

### Domínio e persistência

| Arquivo                                               | Função                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/whatsapp/domain/session-status.ts`      | Mapa `SCAN_QR_CODE` → `SCAN_QR`; balde não `WORKING`                   |
| `src/features/whatsapp/domain/session-status.test.ts` | Vitest do mapa e do aviso `session.status`                             |
| `src/features/whatsapp/domain/webhook-hmac.ts`        | HMAC sha512 do corpo; recusa se o segredo for o do relógio             |
| `src/features/whatsapp/domain/webhook-hmac.test.ts`   | Vitest da assinatura                                                   |
| `supabase/migrations/027_whatsapp_session_status.sql` | Tabela, RLS (leitura admin/dentist/reception; sem escrita autenticada) |
| `src/lib/supabase/database.types.ts`                  | Tipos da tabela `whatsapp_session_status`                              |

Seed: sessão `default` em `STOPPED`.

### Borda e UI

| Arquivo                                                       | Função                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/features/whatsapp/lib/waha-session.ts`                   | Iniciar, desconectar e QR (fetch injetável; mesma chave do canal) |
| `src/features/whatsapp/lib/persist-session-status.ts`         | Upsert privilegiado (`service_role`)                              |
| `src/features/whatsapp/permissions.ts`                        | Escrita = admin e reception                                       |
| `src/features/whatsapp/queries.ts`                            | Lê a linha `default` (sem gateway)                                |
| `src/features/whatsapp/actions.ts`                            | Iniciar e desconectar; recusa sem escrita                         |
| `src/features/whatsapp/components/whatsapp-session-panel.tsx` | QR, poll 4 s só em `SCAN_QR`, desconectar com diálogo             |
| `src/features/whatsapp/components/whatsapp-status-card.tsx`   | Card da Hoje (com ou sem atalho)                                  |
| `src/app/(app)/whatsapp/page.tsx`                             | Tela de pareamento; inicia se `STOPPED`                           |
| `src/app/api/whatsapp/qr/route.ts`                            | Proxy autenticado; `Cache-Control: no-store`                      |
| `src/app/api/webhooks/waha/route.ts`                          | Aviso `session.status` + HMAC; revalida WhatsApp, Hoje e layout   |

### Papéis e superfícies

| Arquivo                            | Função                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/auth/roles.ts`            | Módulo `whatsapp`; prefixo `/whatsapp`; admin e reception `write`      |
| `src/lib/auth/roles.test.ts`       | Reception `write`; dentist `none`; admin **não** espera mais 6 módulos |
| `src/lib/auth/guard.ts`            | Rótulo `WhatsApp` na tela de acesso negado                             |
| `src/types/clinroma.ts`            | Item no catálogo de módulos                                            |
| `src/components/app-shell.tsx`     | Item desktop; chip no `EnvChips`; dock **sem** WhatsApp                |
| `src/components/app-shell.test.ts` | Dock continua 5 itens                                                  |
| `src/app/(app)/layout.tsx`         | Lê o persistido; **não** consulta o gateway                            |
| `src/app/(app)/hoje/page.tsx`      | Card para admin, reception e dentist; link só com o módulo             |
| `.env.example`                     | `WHATSAPP_WEBHOOK_SECRET` vazio                                        |
| `docs/SECURITY.md`                 | Superfície do aviso e da tela                                          |

`src/lib/whatsapp/send-whatsapp.ts` **não** mudou o contrato. Só reutilizamos `readWhatsAppChannelConfig`.

## Testes automatizados

- Mapa `SCAN_QR_CODE` → `SCAN_QR`; `FAILED` e `PASSKEY_REQUIRED` não são `WORKING` e não abrem UI extra
- HMAC sha512 válido; inválido/ausente recusa; segredo igual ao `CRON_SECRET` recusado
- Iniciar / desconectar / QR com fetch injetável; canal ausente não chama rede
- Matriz: admin e reception com escrita; dentist, auxiliar e visualizador com nenhum; recusa de iniciar/QR/desconectar sem escrita
- Dock mobile: 5 itens; WhatsApp fora da barra
- Política: leitura para admin/dentist/reception; escrita autenticada negada

## Evidências de Done

| Comando                | Resultado                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test`         | OK · 324 passed, 20 skipped                                                                                                        |
| `npx eslint` (fatia)   | 0 erros nos arquivos desta fatia. Repo: 1 erro + 4 warnings pré-existentes (`password-input.tsx`, `patient-list.tsx`, `env.test.ts`, script db) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em 233 arquivos legados (fora desta fatia)                                     |
| `npm run build`        | OK · Next.js 16.3.1 · rotas `/whatsapp`, `/api/whatsapp/qr`, `/api/webhooks/waha`                                                   |
| `npm run db:push`      | OK · `027_whatsapp_session_status.sql` aplicada (aviso Docker de cache local, ignorado)                                            |
| `npm run db:types`     | Tipos da `027` atualizados à mão em `database.types.ts` (CLI exige Docker)                                                         |

## Pendências

- Homologação do QR com **número de teste** (~7 dias), não o número pessoal do Felipe
- Ops no gateway: aviso `session.status` da sessão `default` apontando para o app publicado, HMAC = `WHATSAPP_WEBHOOK_SECRET`
- Sem esse aviso, o chip e o card atrasam (aceitam o último persistido)
- Fechamento da Fase 7 **não** entra nesta fatia

## Segurança (checklist aplicável)

- Autorização revalidada no servidor (iniciar, QR, desconectar). Dentista, auxiliar e visualizador: fail secure
- RLS: `SELECT` para admin, dentist, reception; sem `INSERT`/`UPDATE` para `authenticated`
- Chave do gateway só no servidor; QR sem cache público
- Aviso autenticado por HMAC próprio (não o relógio dos jobs); sem PHI no log
