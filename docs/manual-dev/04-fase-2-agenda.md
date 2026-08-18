# Fase 2 · Agenda

| Status                                           | Spec                                |
| ------------------------------------------------ | ----------------------------------- |
| concluída (código) · homologação manual pendente | `specs/2026-08-18-fase-2-agenda.md` |

## O que esta fase entrega

Primeiro módulo de negócio visível após login:

- **Recepção/admin:** calendário multi-dentista (desktop), criar/editar/remarcar/cancelar consultas
- **Dentista/viewer:** leitura; no mobile, lista do dia com filtro (dentista logado inicia no próprio quando vinculado)
- **Conflito de horário:** validação na aplicação + exclusion constraint no Postgres
- **`/hoje`:** consultas reais do dia (substitui cards estáticos operacionais)

Não entrega cadastro completo de pacientes (Fase 3), fila operacional (Fase 4) nem alertas reais de estoque (Fase 5).

---

## Arquitetura da feature Agenda

```text
src/features/agenda/
├── domain/
│   ├── appointment-conflict.ts    # regra pura de sobreposição
│   └── appointment-status.ts      # labels pt-BR, status ativo/inativo
├── queries.ts                     # dentistas, pacientes, consultas (RSC)
├── actions.ts                     # criar, editar, remarcar, cancelar
├── schemas.ts                     # Zod compartilhado form + actions
├── types.ts                       # tipos de domínio, timezone, helpers
└── components/
    ├── agenda-view.tsx            # orquestra desktop vs mobile
    ├── agenda-calendar.tsx        # react-big-calendar (client, md+)
    ├── agenda-day-list.tsx        # lista mobile agrupada
    ├── agenda-dentist-filter.tsx
    ├── agenda-date-nav.tsx
    ├── appointment-form.tsx
    ├── appointment-detail.tsx
    ├── patient-combobox.tsx
    └── reschedule-confirm-dialog.tsx
```

### Desktop (`md+`)

1. `AgendaPage` (RSC) carrega dentistas e consultas da semana/dia
2. `AgendaView` importa `agenda-calendar.tsx` via `next/dynamic` (`ssr: false`)
3. Calendário com **coluna por dentista**, visões dia/semana, cores do seed
4. Slot vazio → formulário nova consulta (dentista + horário pré-preenchidos)
5. Arrastar evento → diálogo de confirmação → `rescheduleAppointmentAction`

### Mobile (`<md`)

1. **Sem** carregar `react-big-calendar`
2. Lista do dia agrupada por dentista
3. Filtro de dentista via query `?dentist=`
4. Dentista com vínculo (`dentists.profile_id`) inicia filtrado no próprio
5. Toque na consulta → detalhe somente leitura (sem editar/cancelar)

### Fuso horário

Exibição e formulários usam **`America/Sao_Paulo`**. Helpers em `types.ts` (`formatClinicTime`, `toClinicIso`, etc.).

---

## Regra de conflito

Dois intervalos do **mesmo dentista** não podem se sobrepor enquanto ambos estiverem em status **ativo** (todos exceto `cancelled` e `rescheduled`).

| Camada    | Onde                                                    |
| --------- | ------------------------------------------------------- |
| Domínio   | `hasAppointmentConflict()` em `appointment-conflict.ts` |
| Aplicação | `actions.ts` antes de persistir                         |
| Banco     | `010_appointment_conflict.sql` (exclusion constraint)   |

Mensagem ao usuário: `Horário indisponível para {nome do dentista}`.

---

## Contas de teste (agenda)

Senha: `ClinRomaDev2026!`

| Papel        | E-mail                   | Cenário                                              |
| ------------ | ------------------------ | ---------------------------------------------------- |
| Recepção     | `reception@clinroma.dev` | Desktop: criar, arrastar, cancelar, tentar conflito  |
| Admin        | `admin@clinroma.dev`     | Mesmas capacidades da recepção                       |
| Dentista     | `dentist@clinroma.dev`   | Mobile: lista do dia filtrada no **Dr. Felipe Roma** |
| Visualizador | `viewer@clinroma.dev`    | Ver agenda sem ações de escrita                      |
| Auxiliar     | `assistant@clinroma.dev` | `/agenda` deve negar (403)                           |

### Seed de consultas

Após `npm run db:push`, migration `011_seed_agenda_dev.sql` inclui:

- 6 pacientes fictícios (ex.: Maria Silva)
- Consultas em hoje, amanhã e ontem para demo e testes manuais

---

## Fluxos de homologação manual

### Recepção marca consulta (desktop)

1. Login `reception@clinroma.dev` → **Agenda**
2. Clicar slot livre na coluna de um dentista
3. Buscar paciente, confirmar horário, salvar
4. Verificar evento na coluna correta e em **Hoje** se for o dia atual

### Remarcar arrastando

1. Arrastar consulta para novo horário/coluna
2. Confirmar no diálogo
3. Calendário reflete nova posição

### Conflito

1. Criar consulta 10:00–11:00 para dentista A
2. Tentar 10:30–11:30 mesmo dentista → deve bloquear

### Dentista no celular

1. Login `dentist@clinroma.dev` em viewport estreito
2. Agenda ou Hoje → lista filtrada no Dr. Felipe Roma
3. Sem botões editar/cancelar

---

## Comandos

```bash
npm run db:push       # aplica 010 + 011
npm run dev           # https://localhost:3000
npm run test          # inclui appointment-conflict.test.ts
```

---

## Próxima fase

[Fase 3 · Pacientes e prontuário](../state/PENDENCIAS.md#fase-3--pacientes-e-prontuário): cadastro completo, anamnese, odontograma, evolução com áudio.

Registro de entregáveis: [`docs/implementation/F2-agenda.md`](../implementation/F2-agenda.md).
