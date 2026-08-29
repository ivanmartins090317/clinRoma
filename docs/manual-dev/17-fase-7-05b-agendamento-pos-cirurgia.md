# Fase 7 · Fatia F7-05b · Agendamento pós-cirurgia

| Status          | Spec                                                  |
| --------------- | ----------------------------------------------------- |
| código entregue | `specs/2026-08-28-f7-05b-agendamento-pos-cirurgia.md` |

A aba **Pós-cirurgia** agenda o WhatsApp. A WAHA (24h na máquina da clínica) só envia na hora. O ClinRoma guarda o texto e o horário. O relógio é a VPS Campinas, a cada 5 minutos. **Enviar agora** não passa pelo relógio.

A aba Anamnese **não** muda nesta fatia.

## O que entrega

- Campo data/hora (America/Sao_Paulo)
- **Agendar envio** (funciona mesmo com o canal ausente: a mensagem espera)
- Atalho **Enviar agora** (continua exigindo o canal)
- **Cancelar** o que ainda está Agendado
- Job a cada 5 min via VPS: a mensagem sai até 5 minutos depois do horário. Hospedagem Hobby sem relógio nativo. **Enviar agora** é independente do relógio.

**Não entrega:** modelo de texto, escolher destino, editar o agendado, inbox, QR, instalar a WAHA.

## Fluxo

1. Login dentista (`dentist@clinroma.dev`) → Maria Silva → Pós-cirurgia
2. Texto + data/hora futura → **Agendar envio** → lista mostra Agendado
3. Recarregar: o registro permanece
4. Com o canal no ar, a VPS acorda o job (até 5 min depois do horário) → Enviado
5. **Enviar agora** segue o disparo imediato, sem o relógio
6. **Cancelar** num Agendado impede o disparo

Canal ausente: Enviar agora desabilitado; agendar grava.

## Cron local

```bash
curl -k -H "Authorization: Bearer SEU_CRON_SECRET" https://localhost:3000/api/cron/process-patient-messages
```

Registro objetivo: [`docs/implementation/F7-05b-agendamento-pos-cirurgia.md`](../implementation/F7-05b-agendamento-pos-cirurgia.md).
