# Plano · Relógio VPS + jobs Next (Hobby)

> Fatia operacional (repo + Vercel Hobby) · Autonomia: **low**
> Status: **rascunho · aguardando aprovação**
> Data: **2026-08-28**
> Origem: crontab já instalado na VPS Campinas (outro agent); deploy Hobby quebrado por `*/5`

**Pronto quando:** `vercel.json` não usa `*/5`; deploy Hobby sobe as duas rotas que hoje dão 404; docs dizem relógio = VPS e jobs = rotas Next.

---

## Como usar

1. Aprovar este plano (decisão: `"crons": []` **ou** fallback 1x/dia).
2. Implementar só repo + docs + commit/push da branch que a Vercel publica.
3. Não SSH, não crontab, não WAHA.

---

## Objetivo

Destravar o deploy Hobby e alinhar a documentação ao contrato real de agendamento:

| Papel | Quem faz |
| ----- | -------- |
| Relógio | VPS Campinas, a cada 5 min, `curl` GET nas 4 rotas `/api/cron/*` com `CRON_SECRET` |
| Jobs | Rotas Next em `https://neo-roma.vercel.app` |
| Enviar agora | Não usa cron |

Conta Vercel: **Hobby**. Intervalo `*/5` no `vercel.json` **quebra o deploy**.

---

## Estado observado (2026-08-28)

App: `https://neo-roma.vercel.app`

| Rota | HTTP | Leitura |
| ---- | ---- | ------- |
| `/api/cron/expire-slot-offers` | 200 | No ar; `CRON_SECRET` da Vercel bate com `.env.local` |
| `/api/cron/process-reminders` | 200 | Idem |
| `/api/cron/process-stock-finance-alerts` | 404 | Código no repo (F7-06), ainda não no deploy |
| `/api/cron/process-patient-messages` | 404 | Código no repo (F7-05b), ainda não no deploy |

Causa do 404: o Hobby recusa `*/5 * * * *`. O build das fatias F7-06 e F7-05b não sobe. As duas rotas **já existem** em:

- `src/app/api/cron/process-stock-finance-alerts/route.ts`
- `src/app/api/cron/process-patient-messages/route.ts`

O crontab da VPS já chama as quatro. Quando o deploy subir, as duas 404 viram 200 sozinhas.

---

## 1. Abordagem

### Decisão recomendada

**Remover os crons nativos** (`"crons": []` no `vercel.json`). Não deixar 1x/dia.

Motivo: o relógio já é a VPS a cada 5 min. Um cron Hobby 1x/dia seria um segundo relógio (disparo extra, docs mais confusas). Os jobs são idempotentes, mas um único relógio é o contrato.

**Fallback (só se pedido na aprovação):** `0 8 * * *` nas quatro rotas, como rede se a VPS cair.

Manter o arquivo `vercel.json` (não apagar). Só esvaziar `crons`.

### Passo 1 · `vercel.json`

Trocar os quatro `schedule: "*/5 * * * *"` por:

```json
{
  "crons": []
}
```

### Passo 2 · Deploy Hobby

Commit + push da branch que publica `neo-roma.vercel.app`. Código das rotas **não muda**. O build passa a incluir F7-06 e F7-05b.

### Passo 3 · `CRON_SECRET`

Só confirmar no painel/CLI (`vercel env ls`): variável presente em Production. **Não** regravar `.env` nem o valor. As duas rotas vivas em 200 já provam que o Bearer bate.

### Passo 4 · Docs

Specs históricas (`*/5` na F6/F7) **não** editar. Atualizar só docs vivos.

---

## 2. Arquivos a alterar

| Arquivo | Ajuste |
| ------- | ------ |
| `vercel.json` | `"crons": []` |
| `docs/state/PENDENCIAS.md` | Bloco operacional: relógio VPS 5 min; jobs nas 4 rotas; Hobby sem cron nativo; `CRON_SECRET` ok; Enviar agora não usa cron |
| `README.md` | Tirar o “até Pro / curl manual” como caminho do piloto; VPS = relógio |
| `docs/SECURITY.md` | Hobby: sem `*/5`; disparo a cada 5 min pela VPS |
| `docs/implementation/F6-lembrete-piloto.md` | Cron nativo Vercel fora; job via VPS |
| `docs/implementation/F7-05b-agendamento-pos-cirurgia.md` | `vercel.json` sem schedule nativo |
| `docs/implementation/F7-06-estoque-baixo-financeiro.md` | Idem |
| `docs/manual-dev/08-fase-6-lembrete-piloto.md` | Job a cada 5 min via VPS |
| `docs/manual-dev/15-fase-7-06-estoque-baixo-financeiro.md` | Varredura via VPS |
| `docs/manual-dev/17-fase-7-05b-agendamento-pos-cirurgia.md` | Relógio VPS; Enviar agora independente |

Índices `docs/implementation/README.md` e `docs/manual-dev/README.md`: sem fase nova. Esta fatia não fecha a Fase 7.

---

## 3. Fora de escopo

- SSH na VPS
- Crontab (já instalado)
- WAHA / `/opt/waha-neoroma`
- Nest, BullMQ, GitHub Actions como relógio
- Next.js na VPS
- Sobrescrever `.env` / `.env.local`
- Migrations, UI, testes novos (as rotas já existem)
- Editar specs em `specs/`
- Fechar Fase 7

---

## 4. Verificação (depois do deploy)

Da máquina local, **sem** Authorization:

```bash
curl -i https://neo-roma.vercel.app/api/cron/process-stock-finance-alerts
curl -i https://neo-roma.vercel.app/api/cron/process-patient-messages
```

| Antes | Depois (rota no ar) |
| ----- | ------------------- |
| 404 | **401** (rota existe; Bearer ausente) |

Com o crontab da VPS (Bearer certo), as duas viram **200** sozinhas. Não SSH para conferir.

Se o deploy ainda falhar, o `vercel.json` é o primeiro suspeito.

---

## 5. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Hobby recusar qualquer cron não diário | `"crons": []` não registra cron nativo |
| Deploy antigo continuar no ar | Conferir GET sem Bearer: 401, não 404 |
| Segundo relógio (1x/dia) confundir ops | Default: array vazio; 1x/dia só se pedido |
| `CRON_SECRET` divergente | Já evidenciado: duas rotas vivas = 200 |

Paths críticos de runtime: nenhum de UI. Só `vercel.json` e o deploy das duas route handlers já versionadas.

---

## Ordem após aprovação

1. `vercel.json` → `"crons": []`
2. Docs da tabela
3. Commit + push
4. Esperar o deploy Hobby
5. GET sem Bearer nas duas rotas → 401
6. Reportar: o que subiu e o que as docs passam a dizer

---

Aguardando aprovação deste plano. Default: remover crons nativos. Fallback 1x/dia (`0 8 * * *`) só se pedido na mesma resposta.
