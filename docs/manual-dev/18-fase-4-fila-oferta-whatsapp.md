# Fase 4 · Fatia oferta da fila por WhatsApp

| Status | Plano |
| ------ | ----- |
| código entregue | `docs/plans/plano-fila-oferta-whatsapp.md` |

Registro objetivo: [`docs/implementation/F4-fila-oferta-whatsapp.md`](../implementation/F4-fila-oferta-whatsapp.md).

## O que entrega

- Ao **Oferecer horário**, o sistema dispara WhatsApp com texto fixo + link `/fila/resposta/{token}`
- Copiar o link permanece na tela (fallback e reenvio manual)
- Se o disparo falhar, a mensagem fica pendente e o cron `/api/cron/process-patient-messages` tenta de novo (até 3 vezes, mesma rota da F7-05b)
- Sem telefone: a oferta é criada mesmo assim; a UI pede para cadastrar o contato e copiar o link
- Cancelar a oferta na recepção cancela o WhatsApp pendente daquele paciente

## O que não entrega

- Nova rota `/api/cron`
- Mudança no crontab da VPS ou em `/api/cron/expire-slot-offers`
- Página pública diferente (LGPD e token de 40 min iguais)
- Compositor editável, SMS, inbox

## Fluxo

1. Recepção (`reception@clinroma.dev`) em `/fila` escolhe um paciente em Aguardando
2. **Oferecer horário** (dentista, data, início, fim)
3. Oferta criada; WhatsApp sai na hora se houver telefone e canal
4. Tela mostra o status (enviado / na fila de retry / sem telefone) e o botão **Copiar link**
5. Paciente abre o link no celular, consente LGPD e aceita ou recusa

## Cron local (retry)

```bash
curl -k -H "Authorization: Bearer SEU_CRON_SECRET" https://localhost:3000/api/cron/process-patient-messages
```

Não criar outro path. O expire da oferta continua:

```bash
curl -k -H "Authorization: Bearer SEU_CRON_SECRET" https://localhost:3000/api/cron/expire-slot-offers
```

## Homologação manual sugerida

- [ ] Recepção: ofertar horário com paciente que tem telefone; conferir WhatsApp e copiar link
- [ ] Sem telefone: oferta criada; aviso para cadastrar contato; copiar link
- [ ] Canal ausente: oferta criada; aviso de retry; copiar link
- [ ] Cancelar oferta na recepção: WhatsApp pendente não deve sair depois
