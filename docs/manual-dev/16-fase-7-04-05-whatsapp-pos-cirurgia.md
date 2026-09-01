# Fase 7 · Fatia F7-04 + F7-05 · WhatsApp e pós-cirurgia

| Status                          | Spec                                                 |
| ------------------------------- | ---------------------------------------------------- |
| código entregue (F7-04 + F7-05) | `specs/2026-08-28-f7-04-05-whatsapp-pos-cirurgia.md` |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre o disparo de WhatsApp da clínica (pós-cirurgia e convite de anamnese). Inbox e bot continuam fora deste repositório.

## O que esta fatia entrega

- Canal único da **clínica** (nunca o WhatsApp pessoal do dentista). Só envia texto.
- Aba **Pós-cirurgia**: texto-padrão editável (teto 2.000), destino visível, enviar, histórico
- Aba **Anamnese**: **Enviar questionário por WhatsApp** (pré-consulta, opcional). Copiar link e abrir no tablet da clínica permanecem. Tablet **não** dispara.
- Canal ausente (faltou URL, chave ou sessão): botões desabilitados, aviso na tela, nenhuma chamada ao gateway

**Não entrega:** inbox, bot, tiques de entrega, cron de retentativa, escolha manual de destino, e-mail ao paciente, tela `/configuracoes`, fechamento da Fase 7 inteira, instalação do gateway na máquina.

---

## Árvore tocada

```text
src/features/records/
├── domain/whatsapp-destination.ts (+ .test.ts)
├── domain/patient-message.ts (+ .test.ts)
├── lib/send-patient-whatsapp.ts
├── permissions.ts
├── schemas.ts
├── queries.ts
├── actions.ts
└── components/
    ├── post-surgery-message.tsx
    ├── anamnesis-invite-actions.tsx
    └── patient-chart.tsx

src/lib/whatsapp/send-whatsapp.ts (+ .test.ts)
supabase/migrations/024_patient_messages_f7.sql
```

---

## Fluxos principais

### Pós-cirurgia (Maria do seed)

1. Canal configurado no ambiente. Login como dentista (`dentist@clinroma.dev`)
2. Abrir **Maria Silva** → aba **Pós-cirurgia**
3. Destino no telefone dela (`11999990001`, já aproveitável)
4. O compositor já vem com o texto-padrão. Edite se o caso pedir e **Enviar agora** (ou agende)
5. Confirmação `Mensagem enviada.` A lista mostra quando, quem, destino, Enviado e o texto
6. Recarregar a ficha: o registro permanece. O compositor volta ao texto-padrão

### Segundo telefone

1. Paciente sem telefone aproveitável e com segundo contato (observação `filho`)
2. A aba mostra que o envio vai para o segundo número e a observação
3. Enviar grava o contato como segundo telefone

### Questionário por WhatsApp

1. Recepção (`reception@clinroma.dev`) na ficha da Maria, aba Anamnese
2. **Enviar questionário por WhatsApp**
3. Convite pré-consulta aberto é criado ou reutilizado. Copiar link mostra o mesmo endereço
4. **Abrir no tablet** não dispara WhatsApp

### Canal ausente (caso atual até a ops terminar)

1. `WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_KEY` ou `WHATSAPP_GATEWAY_SESSION` vazios
2. Botões de envio desabilitados. Copiar link pré-consulta continua
3. Nenhuma chamada ao gateway. Prontuário, estoque e agenda intactos

---

## Ambiente

| Variável                   | Obrigatória | Uso                                         |
| -------------------------- | ----------- | ------------------------------------------- |
| `WHATSAPP_GATEWAY_URL`     | Para enviar | Endereço do gateway. Vazio = não dispara    |
| `WHATSAPP_GATEWAY_KEY`     | Para enviar | Chave. Sem prefixo público. Nunca no client |
| `WHATSAPP_GATEWAY_SESSION` | Para enviar | Nome da sessão (ex.: `default`)             |

Os três vazios no `.env.example`. Número de **teste** primeiro. Não commitar chave, endereço interno nem número real. O processo 24h fica na máquina da clínica; o aplicativo só dispara.

---

## Contas de teste

As mesmas da Fase 1: `dentist@clinroma.dev`, `reception@clinroma.dev`, `admin@clinroma.dev`. Visualizador (`viewer@clinroma.dev`) não vê a aba nem envia.

Paciente seed: **Maria Silva** (`11999990001`).

---

## Comandos úteis

```bash
npm run test
npm run lint
npm run build
npm run db:push
```

Registro objetivo: [`docs/implementation/F7-04-05-whatsapp-pos-cirurgia.md`](../implementation/F7-04-05-whatsapp-pos-cirurgia.md). Pendências da Fase 7: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md).
