# Fase 6 · Lembrete e piloto

Manual operacional da Fase 6 do ClinRoma (Clínica Neo Roma).

**Spec:** `specs/2026-08-18-fase-6-lembrete-piloto.md`  
**Implementação:** `docs/implementation/F6-lembrete-piloto.md`

## O que entrega

- Lembrete **por e-mail ao dentista** após consulta **concluída**
- Retentativa automática (3 tentativas, backoff 5 e 15 min)
- Job cron a cada 5 min (`/api/cron/process-reminders`)
- Badge de situação na agenda e Hoje
- Painel de falhas e **Reenviar** (somente admin)
- Estrutura de homologação manual (relatório HTML + evidências)

## O que não entrega

- Lembrete ao paciente (WhatsApp/SMS)
- Playwright / E2E automatizado
- Painel de auditoria
- Deploy produção executado (somente checklist)

## Pastas da feature

```
src/features/reminders/
  domain/           regras puras + testes
  lib/              enfileirar, enviar, processar lote
  components/       badge, painel falhas
  queries.ts        leitura
  actions.ts        reenvio admin
  schemas.ts        Zod

src/lib/email/resend-client.ts
src/app/api/cron/process-reminders/route.ts
```

## Fluxo principal

1. Recepção ou dentista marca consulta como **Concluído** na agenda.
2. Sistema enfileira lembrete (canal e-mail, situação pendente).
3. Envio imediato na primeira tentativa; falhas reagem com backoff.
4. Cron reprocessa pendentes elegíveis a cada 5 min.
5. Dentista recebe e-mail com nome parcial do paciente e link para `/pacientes/[id]`.

### Reenvio manual (admin)

1. Abrir **Hoje** como `admin@clinroma.dev`.
2. Seção **Lembretes com falha** → **Reenviar**.
3. Zera tentativas e dispara nova tentativa imediata.

## Variáveis de ambiente

| Variável            | Obrigatória F6 | Descrição                          |
| ------------------- | -------------- | ---------------------------------- |
| `RESEND_API_KEY`    | Sim (envio)    | API key Resend (server-only)       |
| `RESEND_FROM_EMAIL` | Sim (envio)    | Remetente verificado no Resend     |
| `CRON_SECRET`       | Sim (cron)     | Bearer do job (mesmo da fila)      |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Enfileiramento e job usam admin client |

Sem `RESEND_*`, lembretes ficam pendentes; admin vê falhas após esgotar tentativas ou erro de configuração.

## Homologação FL-06 (lembrete)

1. Configurar `RESEND_API_KEY` e `RESEND_FROM_EMAIL` no `.env.local`.
2. Login `reception@clinroma.dev` → marcar consulta seed como **Concluído**.
3. Verificar badge **Lembrete enviado** na Hoje ou detalhe da agenda.
4. Confirmar e-mail em `dentist@clinroma.dev` (vinculado ao Dr. Felipe Roma).

Simular cron local:

```bash
curl -k -H "Authorization: Bearer SEU_CRON_SECRET" https://localhost:3000/api/cron/process-reminders
```

## Deploy produção (checklist)

1. Criar projeto Supabase **produção** separado do dev.
2. `npm run db:push` contra prod (sem seeds de dev em prod).
3. Projeto Vercel + domínio HTTPS.
4. Variáveis: Supabase, `NEXT_PUBLIC_APP_URL`, Resend, `CRON_SECRET`, OpenAI, fila.
5. Confirmar crons ativos em `vercel.json` (ofertas + lembretes).
6. Smoke: login admin, concluir consulta, e-mail recebido.
7. Vincular perfis reais aos dentistas (`dentists.profile_id`).

## Homologação integral (antes do cliente)

Executar `.cursor/skills/manual-report` com `docs/relatorio-testes-manuais.html` e evidências em `docs/evidencias/`.

Fluxos: FL-01…FL-08 (desktop + mobile nos P0).

## Comandos úteis

```bash
npm run dev
npm run test
npm run db:push
```

## Próximo passo

Acompanhamento pós-entrega (5 dias úteis) e bugs em `docs/state/PENDENCIAS.md` seção Pós-piloto.
