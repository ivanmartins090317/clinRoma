# Fase 7 · Fatia F7-05b · Agendamento pós-cirurgia

| Status | Spec |
| ------ | ---- |
| código entregue | `specs/2026-08-28-f7-05b-agendamento-pos-cirurgia.md` |

A aba **Pós-cirurgia** agenda o WhatsApp. A WAHA (24h na máquina da clínica) só envia na hora. O ClinRoma guarda o texto e o horário e um cron dispara.

A aba Anamnese **não** muda nesta fatia.

## O que entrega

- Campo data/hora (America/Sao_Paulo)
- **Agendar envio** (funciona mesmo com o canal ausente: a mensagem espera)
- Atalho **Enviar agora** (continua exigindo o canal)
- **Cancelar** o que ainda está Agendado
- Cron a cada 5 min: a mensagem sai até 5 minutos depois do horário

**Não entrega:** modelo de texto, escolher destino, editar o agendado, inbox, QR, instalar a WAHA.

## Fluxo

1. Login dentista (`dentist@clinroma.dev`) → Maria Silva → Pós-cirurgia
2. Texto + data/hora futura → **Agendar envio** → lista mostra Agendado
3. Recarregar: o registro permanece
4. Com o canal no ar, chamar o cron ou esperar 5 min → Enviado
5. **Enviar agora** segue o disparo imediato
6. **Cancelar** num Agendado impede o disparo

Canal ausente: Enviar agora desabilitado; agendar grava.

## Cron local

```bash
curl -k -H "Authorization: Bearer SEU_CRON_SECRET" https://localhost:3000/api/cron/process-patient-messages
```

Registro objetivo: [`docs/implementation/F7-05b-agendamento-pos-cirurgia.md`](../implementation/F7-05b-agendamento-pos-cirurgia.md).
