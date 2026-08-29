# Fase 7 · Fatia F7-10 · Tela de QR da sessão WhatsApp

| Status                  | Spec                                   |
| ----------------------- | -------------------------------------- |
| código entregue (F7-10) | `specs/2026-08-29-tela-qr-whatsapp.md` |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre o pareamento da sessão `default` da clínica dentro do ClinRoma. Inbox e bot continuam fora deste repositório.

## O que esta fatia entrega

- Tela `/whatsapp` para **admin** e **recepção**: inicia a sessão se estiver `STOPPED`, mostra o QR só em `SCAN_QR` (atualiza a cada 4 s), desconecta com confirmação
- Chip no menu desktop (admin e recepção): verde estável se `WORKING`; vermelho piscando se não
- Card na Hoje para admin, recepção e dentista. Link **Abrir pareamento** só para quem tem o módulo. Dentista lê o status e pede à recepção ou ao admin
- Aviso público `/api/webhooks/waha` grava o status persistido (HMAC sha512, `WHATSAPP_WEBHOOK_SECRET`)
- Barra inferior do celular continua com **5** itens. WhatsApp não entra nela

**Não entrega:** inbox, segundo número, painel do gateway, fluxo por chave de acesso do aparelho, mudança do disparo (`destino` + `texto`), fechamento da Fase 7, configuração do aviso **dentro** do gateway (ops)

---

## Árvore tocada

```text
src/features/whatsapp/
├── domain/session-status.ts (+ .test.ts)
├── domain/webhook-hmac.ts (+ .test.ts)
├── lib/waha-session.ts (+ .test.ts)
├── lib/persist-session-status.ts
├── permissions.ts
├── queries.ts
├── actions.ts
└── components/
    ├── whatsapp-session-panel.tsx
    └── whatsapp-status-card.tsx

src/app/(app)/whatsapp/page.tsx
src/app/api/whatsapp/qr/route.ts
src/app/api/webhooks/waha/route.ts
supabase/migrations/027_whatsapp_session_status.sql
```

Menu e Hoje leem `whatsapp_session_status`. **Não** perguntam ao gateway na montagem da página.

---

## Fluxos principais

### Recepção pareia do zero

1. Status persistido da sessão `default` está `STOPPED` (seed)
2. Login `reception@clinroma.dev` e abrir **WhatsApp** (menu desktop ou card na Hoje)
3. O aplicativo inicia a sessão no gateway
4. O gateway pede QR e dispara o aviso `session.status` → status vira `SCAN_QR`
5. A tela mostra o QR e atualiza a cada 4 s
6. Ler o código no celular do **número de teste**
7. Status vira `WORKING`. O QR some. Chip verde estável. Card na Hoje verde

### Admin desconecta e reconecta

1. Sessão em `WORKING`
2. Abrir a tela, **Desconectar**, confirmar **Desconectar agora**
3. Chip e card ficam vermelhos piscando. Disparos (pós-cirurgia, questionário, oferta da fila) param até novo pareamento
4. Abrir de novo: se `STOPPED`, inicia; se `SCAN_QR`, vê o QR

### Dentista só observa

1. Login `dentist@clinroma.dev` → Hoje
2. Vê o card, **sem** link
3. Lê: `Peça à recepção ou ao admin para reconectar.`
4. `/whatsapp` → acesso negado. QR e desconectar recusados no servidor

### Auxiliar e visualizador

Sem item, chip, card ou tela. `/whatsapp` → acesso negado. Dock do auxiliar continua com 5 itens.

---

## Ambiente

| Variável                   | Obrigatória     | Uso                                                            |
| -------------------------- | --------------- | -------------------------------------------------------------- |
| `WHATSAPP_GATEWAY_URL`     | Para iniciar/QR | Já existente. Vazio = falha visível ao iniciar ou pedir QR     |
| `WHATSAPP_GATEWAY_KEY`     | Para iniciar/QR | Já existente. Nunca no navegador                               |
| `WHATSAPP_GATEWAY_SESSION` | Para iniciar/QR | Já existente. Piloto: `default`                                |
| `WHATSAPP_WEBHOOK_SECRET`  | Para o aviso    | HMAC sha512 (`X-Webhook-Hmac`). **Diferente** de `CRON_SECRET` |

Sem as três do canal, iniciar e QR falham com a mensagem genérica. O disparo já existente continua no comportamento "canal ausente".

---

## Ops do aviso no gateway (homologação, não é código)

Na sessão `default` do gateway, o evento de mudança de status deve apontar para:

`https://<app-publicado>/api/webhooks/waha`

HMAC = o mesmo `WHATSAPP_WEBHOOK_SECRET` da hospedagem. Sem isso, o indicador não acompanha o pareamento real. A fatia de código **não homologa** sem esse aviso no ar.

Homologação humana do QR: **número de teste** (cerca de 7 dias), não o número pessoal do Felipe.

---

## Contas de teste

| Papel        | Conta                    | O que ver                         |
| ------------ | ------------------------ | --------------------------------- |
| Admin        | `admin@clinroma.dev`     | Menu, chip, tela, card com atalho |
| Recepção     | `reception@clinroma.dev` | Igual ao admin no dia a dia       |
| Dentista     | `dentist@clinroma.dev`   | Só o card na Hoje, sem link       |
| Auxiliar     | `assistant@clinroma.dev` | Nada desta feature                |
| Visualizador | `viewer@clinroma.dev`    | Nada desta feature                |

---

## Comandos úteis

```bash
npm run db:push          # aplica 027_whatsapp_session_status.sql
npm run test             # mapa, HMAC, papéis, dock, WAHA injetável
```

Registro objetivo: [`docs/implementation/F7-10-tela-qr-whatsapp.md`](../implementation/F7-10-tela-qr-whatsapp.md)

Pendências vivas: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
