# Fase 2 · Agenda

| Campo      | Valor                                            |
| ---------- | ------------------------------------------------ |
| **Status** | concluída (código) · homologação manual pendente |
| **Plano**  | `docs/PLANO.md` §6 · Fase 2                      |
| **Spec**   | `specs/2026-08-18-fase-2-agenda.md`              |

## Objetivo

Agenda clínica operacional: recepção gerencia consultas dos cinco dentistas; dentista vê o dia no celular; bloqueio de conflito de horário por profissional.

## Entregue

### Banco de dados (migrations)

| Arquivo                        | Conteúdo                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `010_appointment_conflict.sql` | Exclusion constraint `btree_gist`: impede sobreposição de consultas ativas do mesmo dentista (`cancelled` e `rescheduled` excluídas) |
| `011_seed_agenda_dev.sql`      | 6 pacientes fictícios + 6 consultas de exemplo (hoje, amanhã, ontem)                                                                 |

### Feature `src/features/agenda/`

| Área         | Arquivos                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Domínio      | `domain/appointment-conflict.ts`, `appointment-status.ts` + testes de conflito                            |
| Dados        | `queries.ts`, `types.ts` (timezone `America/Sao_Paulo`)                                                   |
| Escrita      | `actions.ts` (criar, editar, remarcar, cancelar) + `schemas.ts` (Zod)                                     |
| UI desktop   | `components/agenda-calendar.tsx` (react-big-calendar + DnD, colunas por dentista)                         |
| UI mobile    | `components/agenda-day-list.tsx`, `agenda-dentist-filter.tsx`, `agenda-date-nav.tsx`                      |
| Orquestração | `components/agenda-view.tsx` (dynamic import calendário só `md+`)                                         |
| Formulários  | `appointment-form.tsx`, `appointment-detail.tsx`, `patient-combobox.tsx`, `reschedule-confirm-dialog.tsx` |

### Páginas integradas

- `src/app/(app)/agenda/page.tsx` — feature real (substitui placeholder)
- `src/app/(app)/hoje/page.tsx` — consultas reais do dia + atalho agenda; removido bloco "Próximo passo técnico"

### Componentes shadcn adicionados

`dialog`, `select`, `label`, `badge`, `popover`

### Dependências

- `react-big-calendar`, `date-fns`, `date-fns-tz`
- `@radix-ui/react-dialog`, `select`, `label`, `popover`

### Testes automatizados

- `domain/appointment-conflict.test.ts` — regra de sobreposição
- `actions.test.ts` — matriz de escrita (admin/recepção vs leitura)

## Matriz de acesso (agenda)

| Ação                           | admin | reception | dentist | viewer |
| ------------------------------ | ----- | --------- | ------- | ------ |
| Ver agenda                     | Sim   | Sim       | Sim     | Sim    |
| Criar/editar/remarcar/cancelar | Sim   | Sim       | Não     | Não    |
| Arrastar (desktop)             | Sim   | Sim       | Não     | Não    |

Escrita revalidada server-side; RLS da Fase 1 intacta.

## Evidências de Done

| Comando            | Resultado                                                               |
| ------------------ | ----------------------------------------------------------------------- |
| `npm run db:push`  | Migrations 010 e 011 aplicadas                                          |
| `npm run db:types` | Falhou neste ambiente (Docker indisponível); 010 só adiciona constraint |
| `npm run lint`     | OK                                                                      |
| `npm run build`    | OK                                                                      |
| `npm run test`     | OK · 50 passed, 15 skipped                                              |

## Pendências menores desta fase

- Homologação manual desktop (recepção: criar, arrastar, cancelar, conflito): ver `docs/state/PENDENCIAS.md`
- Homologação manual mobile (dentista: lista filtrada no Dr. Felipe Roma)
- `npm run format:check` global ainda falha em arquivos legados (F0/F1)
- `npm run db:types` requer Docker

## Fora desta fase (correto)

- CRUD completo de pacientes
- Fila operacional, prontuário, estoque, lembretes
- Homologação `manual-report` (Fase 6)
- Resize de evento por arraste de borda

## Manual do dev

Explicação e fluxos: [`docs/manual-dev/04-fase-2-agenda.md`](../manual-dev/04-fase-2-agenda.md)
