# Fase 4 · Fila Kanban

Manual operacional da fila de encaixe. Registro técnico: [`docs/implementation/F4-fila-kanban.md`](../implementation/F4-fila-kanban.md).

## O que entrega

- Kanban com colunas **Aguardando**, **Oferta enviada** e **Agendado**
- Prioridade visual vermelho / amarelo / verde (ordenação dentro de Aguardando)
- Oferta de horário com link opaco válido por **40 minutos**
- Página pública `/fila/resposta/[token]` para aceitar ou recusar (LGPD)
- Aceite cria consulta **`confirmed`** na agenda
- Job cron expira ofertas pendentes automaticamente
- Resumo da fila em **Hoje**

## O que não entrega

- Envio automático de SMS (WhatsApp da oferta: ver [18-fase-4-fila-oferta-whatsapp.md](./18-fase-4-fila-oferta-whatsapp.md))
- Reoferta em cascata ao expirar
- Homologação `manual-report` formal (Fase 6)

## Árvore da feature

```text
src/features/waitlist/
  actions.ts · queries.ts · schemas.ts
  domain/          regras puras + testes Vitest
  components/      board, cards, forms, link
  lib/             aceite, expiração, hash IP, view pública
src/app/fila/resposta/[token]/   página pública
src/app/api/waitlist/respond/    POST paciente
src/app/api/cron/expire-slot-offers/   job
```

## Fluxo principal (happy path)

1. Recepção inclui paciente na fila (`/fila` → Nova entrada)
2. Cancelamento na agenda libera slot → **Oferecer vaga na fila**
3. Sistema valida conflito, gera link, dispara WhatsApp e o card vai para **Oferta enviada**
4. Recepção confere o status do WhatsApp e, se precisar, copia o link
5. Paciente abre link no celular, marca LGPD, aceita
6. Consulta aparece na agenda e em Hoje; card vai para **Agendado**

## Contas e seed de dev

Senha: `ClinRomaDev2026!` · Recepção: `reception@clinroma.dev`

Após `npm run db:push`, o seed inclui:

- 3 entradas aguardando (Ana, Pedro, Lucia)
- 1 oferta pendente para **Carlos Mendes**

### Token de teste (página pública local)

```
clinroma-dev-waitlist-offer-001
```

URL local:

```
https://localhost:3000/fila/resposta/clinroma-dev-waitlist-offer-001
```

Requer `SUPABASE_SERVICE_ROLE_KEY` e `WAITLIST_IP_HASH_SECRET` no `.env.local`.

## Variáveis de ambiente (Fase 4)

| Variável                    | Uso                                            |
| --------------------------- | ---------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Resposta pública e cron (server-only)          |
| `WAITLIST_IP_HASH_SECRET`   | Hash do IP na resposta do paciente             |
| `CRON_SECRET`               | Proteção do job `/api/cron/expire-slot-offers` |
| `NEXT_PUBLIC_APP_URL`       | Montagem do link copiável                      |

## Comandos úteis

```bash
# Expirar ofertas manualmente (dev)
curl -H "Authorization: Bearer $CRON_SECRET" https://localhost:3000/api/cron/expire-slot-offers

# Testes de domínio da fila
npm run test -- src/features/waitlist
```

## Homologação manual sugerida

- [ ] Recepção: incluir paciente, ofertar horário, conferir WhatsApp e copiar link
- [ ] Paciente (viewport estreita): aceitar pelo link seed
- [ ] Verificar consulta confirmada na agenda
- [ ] Recusar oferta em cenário separado (card volta a Aguardando)
- [ ] Mobile recepção: abas + menu ⋯ cancelar oferta
- [ ] Dentista: ver fila sem ações de escrita
- [ ] Visualizador: `/fila` negado (403)

## Próxima fase

Fase 5 · Insumos e estoque (`docs/state/PENDENCIAS.md`).
