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

## Fatia · Encaixe na meia hora de medicação (2026-10-06)

| Campo | Valor |
| ----- | ----- |
| **Status** | código entregue · homologação manual pendente |
| **Spec** | `specs/2026-10-06-agenda-encaixe-medicacao.md` |
| **Plano** | `docs/plans/plano-agenda-encaixe-medicacao.md` |

Não reabre a Fase 2. A visita do paciente continua da chegada à saída. A trava do dentista passa a valer no trecho exclusivo. A fila segue ocupando a visita inteira.

### Banco

| Arquivo | Conteúdo |
| ------- | -------- |
| `031_appointment_induction.sql` | `induction_minutes` (padrão 0), `busy_starts_at` / `busy_ends_at`, constraint `appointments_no_active_overlap` reapontada para o trecho exclusivo e adiada na gravação do par. Consultas já gravadas entram com 0 |

`timestamptz + interval` não é imutável no Postgres, então o início exclusivo nasce de `appointment_busy_start`, função imutável que só soma minutos.

### Código

| Arquivo | Papel |
| ------- | ----- |
| `domain/appointment-conflict.ts` | Par pede confirmação. Terceira, horário igual, início diferente com cruzamento e invasão do meio bloqueiam. Encostar no minuto do exclusivo passa sem aviso |
| `actions.ts` | Criar, editar, arrastar e cancelar. Sem **Marcar as duas**, o par não grava. Com a confirmação, os minutos ficam só na mais longa. Cancelar ou afastar zera a que permanece |
| `components/overlap-confirm-dialog.tsx` | Aviso no criar, no editar e no arraste. Botões com 44 px |
| `queries.ts`, `types.ts`, `schemas.ts` | A agenda lê `induction_minutes`. A confirmação do par entra no que criar, editar e arrastar aceitam |
| `waitlist/actions.ts`, `waitlist/lib/accept-slot-offer.ts` | Oferta e aceite ocupam `starts_at` até `ends_at`. Sem o aviso |

O calendário não mudou: o algoritmo padrão já empilha o curto ao lado do topo do longo. A lista do dia já ordena pelo início e mostra as duas.

### Testes

- `appointment-conflict.test.ts`: par, terceira, horário igual, invasão, encoste, fila na visita inteira
- `actions.test.ts`: sem confirmação não grava; com confirmação os minutos ficam na mais longa; a terceira não confirma
- `schemas.test.ts`: confirmação ausente ou presente

### Evidências

| Comando | Resultado |
| ------- | --------- |
| `npm run lint` nos arquivos da fatia | 0 erros |
| `npm run lint` no repo | 7 erros e 5 warnings pré-existentes fora da fatia (scanner, estoque, fila, env) |
| `npm run test` | 482 passed, 26 skipped |
| `npm run build` | OK |
| `npm run db:push` | `031_appointment_induction.sql` aplicada |
| `npm run db:types` | não rodou: Docker indisponível. `database.types.ts` alinhado à mão |
