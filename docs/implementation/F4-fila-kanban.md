# Fase 4 · Fila Kanban

| Campo      | Valor                                            |
| ---------- | ------------------------------------------------ |
| **Status** | concluída (código) · homologação manual pendente |
| **Plano**  | `docs/PLANO.md` §6 · Fase 4                      |
| **Spec**   | `specs/2026-08-18-fase-4-fila-kanban.md`         |

## Objetivo

Fila de encaixe operacional: Kanban com prioridades, oferta de horário com link opaco (40 min), resposta pública LGPD e criação automática de consulta confirmada na agenda.

## Entregue

### Banco de dados (migrations)

| Arquivo                     | Conteúdo                                                                         |
| --------------------------- | -------------------------------------------------------------------------------- |
| `014_waitlist_f4.sql`       | `ends_at`, FK `appointment_id`, índices parciais, `expire_pending_slot_offers()` |
| `015_seed_waitlist_dev.sql` | 3 entradas aguardando + 1 oferta pendente demo                                   |

### Feature `src/features/waitlist/`

| Área       | Arquivos                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Domínio    | expiração 40 min, token/hash, nome parcial, transições, prioridade + testes                            |
| Dados      | `queries.ts` (board, resumo Hoje, entradas aguardando)                                                 |
| Escrita    | `actions.ts`, `schemas.ts`                                                                             |
| Server lib | `accept-slot-offer.ts`, `expire-slot-offers.ts`, `hash-ip.ts`, `public-offer-view.ts`, `rate-limit.ts` |
| UI         | board Kanban (DnD desktop + abas mobile), cards, forms, oferta pós-cancelamento                        |

### API e cron

| Arquivo                                        | Função                        |
| ---------------------------------------------- | ----------------------------- |
| `src/app/api/waitlist/respond/route.ts`        | POST público aceitar/recusar  |
| `src/app/api/cron/expire-slot-offers/route.ts` | Job expiração (`CRON_SECRET`) |

### Páginas e integrações

- `/fila` · Kanban real substituindo demo
- `/fila/resposta/[token]` · fluxo público mobile-first
- `/hoje` · contagem real da fila + link + alertas de vencimento
- Agenda · modal **Oferecer vaga na fila** após cancelamento

### Dependências adicionadas

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@radix-ui/react-dropdown-menu`

### Testes automatizados

- `waitlist/domain/slot-offer-expiry.test.ts`
- `waitlist/domain/token-hash.test.ts`
- `waitlist/domain/partial-patient-name.test.ts`
- `waitlist/domain/waitlist-transitions.test.ts`

## Evidências de Done

| Comando                | Resultado                                            |
| ---------------------- | ---------------------------------------------------- |
| `npm run db:push`      | Migrations 014 e 015 aplicadas                       |
| `npm run db:types`     | Tipos atualizados manualmente em `database.types.ts` |
| `npm run lint`         | OK (0 erros)                                         |
| `npm run format:check` | Legado F0–F3 ainda com warn; arquivos F4 formatados  |
| `npm run build`        | OK                                                   |
| `npm run test`         | OK · 80 passed, 15 skipped                           |

## Homologação manual pendente

Ver `docs/manual-dev/06-fase-4-fila-kanban.md` e `docs/state/PENDENCIAS.md`.
