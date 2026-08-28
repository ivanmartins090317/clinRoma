# Spec · Agendamento pós-cirurgia (WhatsApp)

| Campo            | Valor                                            |
| ---------------- | ------------------------------------------------ |
| **Status**       | draft                                            |
| **Data**         | 2026-08-28                                       |
| **Slug**         | f7-05b-agendamento-pos-cirurgia                  |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 5 (extensão)    |
| **Fase**         | 7 de `docs/PLANO.md`                             |
| **Spec pai**     | `specs/2026-08-28-f7-04-05-whatsapp-pos-cirurgia.md` |

## 1. Objetivo

Na aba **Pós-cirurgia**, o dentista grava o texto e a **data/hora** do envio. O ClinRoma guarda a mensagem e um cron dispara na WAHA quando o horário vencer. Atalho **Enviar agora** permanece. A aba Anamnese não muda.

A WAHA não agenda. Ela só envia na hora. O relógio fica no ClinRoma (mesmo padrão dos lembretes da F6).

## 2. Comportamento

- Primário: **Agendar envio** (texto + data/hora futura, fuso America/Sao_Paulo)
- Atalho: **Enviar agora** (fluxo já existente)
- Pendente: **Cancelar**
- Lista: Agendado / Enviado / Falhou / Cancelado
- Sem destino: os dois envios desabilitados
- Canal ausente: **agendar** continua; **Enviar agora** desabilitado
- Horário no passado: recusa
- Cron `*/5 * * * *`: até 5 minutos depois do horário. Copy: `A mensagem sai até 5 minutos depois do horário.`
- Canal ausente no cron: não queima tentativas; espera o gateway
- Gateway no ar mas recusa: até 3 tentativas, depois Falhou
- Copy da aba não fala em copiar link

## 3. Dados

Migration `025_patient_messages_schedule_f7.sql`: `scheduled_at`, `attempt_count`, status `cancelled`. Não editar `001`–`024`.

## 4. Fora

Anamnese, inbox, QR, tiques, modelo de texto, escolha de destino, editar o agendado (cancelar e criar de novo), worker extra na VPS, instalar a WAHA.
