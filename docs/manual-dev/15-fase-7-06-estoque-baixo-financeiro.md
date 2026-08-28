# Fase 7 · Fatia F7-06 · Estoque baixo para o financeiro

| Status                  | Spec                                                 |
| ----------------------- | ---------------------------------------------------- |
| código entregue (F7-06) | `specs/2026-08-26-f7-06-estoque-baixo-financeiro.md` |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre o e-mail de reposição ao financeiro. A lista **Estoque · abaixo do mínimo** na Hoje continua igual à F5.

## O que esta fatia entrega

- Aviso por e-mail quando o insumo **entra em reposição** (mínimo > 0 e quantidade atual **menor** que o mínimo, incluindo zerado)
- Um e-mail por insumo por episódio; segunda queda no mesmo episódio não reenvia
- Pendente é cancelado se o item for reposto antes do envio
- Varredura a cada 5 min: retentativa + itens já abaixo (ex.: Anestésico do seed) sem reenviar a cada ciclo
- Destino: `FINANCE_ALERT_EMAIL` no ambiente. Vazio ou inválido: **não dispara**

**Não entrega:** tela `/configuracoes`, digest com vários insumos, painel de falhas deste aviso, WhatsApp, mudança visual na Hoje/Estoque, fechamento da Fase 7 inteira. Endereço de produção do Felipe continua pendente.

---

## Árvore tocada

```text
src/features/stock/
├── domain/finance-alert.ts (+ .test.ts)
├── domain/finance-alert-email.ts (+ .test.ts)
├── domain/finance-alert-retry.ts (+ .test.ts)
├── lib/enqueue-finance-alert.ts
├── lib/send-finance-alert-email.ts
├── lib/process-finance-alerts.ts
├── lib/apply-withdrawal.ts
├── lib/apply-stock-entry.ts
└── actions.ts

src/app/api/cron/process-stock-finance-alerts/route.ts
src/lib/email/resend-client.ts
supabase/migrations/023_stock_finance_alerts_f7.sql
```

---

## Fluxos principais

### Cruzou o mínimo na retirada

1. Configurar `FINANCE_ALERT_EMAIL` (teste interno no `.env.local`) e Resend
2. Login como auxiliar (`assistant@clinroma.dev`) em `/estoque/scan`
3. Retirar **Luva** (ou equivalente acima do mínimo) até o saldo ficar menor que o mínimo
4. O financeiro recebe **um** e-mail com nome, saldo, mínimo, unidade e **Abrir estoque**
5. Uma segunda retirada no mesmo episódio **não** gera segundo e-mail

### Destino vazio (caso do Felipe)

1. `FINANCE_ALERT_EMAIL` ausente ou vazio
2. Retirada até cruzar o mínimo
3. Nenhum e-mail sai. Estoque e Hoje iguais à F5

### Varredura do seed Anestésico

1. Destino de teste + Resend configurados
2. Sem nova movimentação, chamar o cron
3. Um e-mail de Anestésico chega. Ciclos seguintes não reenviam

```bash
curl -k -H "Authorization: Bearer SEU_CRON_SECRET" https://localhost:3000/api/cron/process-stock-finance-alerts
```

A resposta traz só contagens (`processed`, `sent`, `failed`, `cancelled`, `created`). Sem nome de insumo, sem endereço, sem saldo.

---

## Ambiente

| Variável              | Obrigatória | Uso                                              |
| --------------------- | ----------- | ------------------------------------------------ |
| `FINANCE_ALERT_EMAIL` | Não         | Destino do financeiro. Vazio = não dispara       |
| `RESEND_API_KEY`      | Para enviar | Mesma chave do lembrete F6                       |
| `RESEND_FROM_EMAIL`   | Para enviar | Mesmo remetente do lembrete F6                   |
| `CRON_SECRET`         | Cron        | Bearer da rotina (mesmo da fila e dos lembretes) |
| `NEXT_PUBLIC_APP_URL` | Ligação     | URL pública do app em **Abrir estoque**          |

Em desenvolvimento o destino de teste vai só no `.env.local` (exemplo no `.env.example`). Não gravar endereço no código.

Se a chave ou o remetente do Resend faltarem com destino preenchido, o aviso fica pendente, tenta de novo (+5 min, +15 min) e depois falha com `Serviço de e-mail não configurado.`

---

## Comandos úteis

```bash
npm run db:push      # migration 023
npm run test         # domínio do aviso financeiro
npm run dev          # HTTPS local
```

**Registro técnico:** [`docs/implementation/F7-06-estoque-baixo-financeiro.md`](../implementation/F7-06-estoque-baixo-financeiro.md)

**Pendências da Fase 7:** [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
