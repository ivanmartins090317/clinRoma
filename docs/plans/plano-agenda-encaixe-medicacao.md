# Plano · Encaixe na meia hora de medicação

> Agenda · Autonomia: **medium**
> Status: **rascunho · aguardando aprovação**
> Data: **2026-10-06**
> Origem: [`research-agenda-encaixe-medicacao.md`](research-agenda-encaixe-medicacao.md). Recepção da Clínica Neo Roma: dois pacientes no mesmo dentista quando um vai para cirurgia e o outro faz um procedimento curto enquanto a medicação faz efeito.

**Pronto quando:** a recepção marca uma consulta que começa junto com outra já existente e termina antes do fim dela; o sistema mostra o aviso e só grava se ela confirmar; a consulta mais longa fica com `induction_minutes` igual à duração da mais curta; início diferente, horários iguais, terceira consulta e cruzamento no meio continuam bloqueados; oferta e aceite da fila seguem ocupando o horário inteiro do paciente, sem esse aviso.

Nenhum código até este plano ser aprovado.

---

## Como usar no workflow

1. Aprovar este plano (e as premissas da última seção, se discordar).
2. Branch + código. Sem spec nova no vault.
3. Homologar na agenda: criar, editar e arrastar o par; tentar a terceira; conferir que a fila não oferece a janela do início.

---

## Objetivo

A consulta continua sendo o horário em que o paciente está na clínica (`starts_at` até `ends_at`). O bloqueio do banco passa a valer no trecho em que o dentista está exclusivo.

A recepção não preenche um campo de medicação. Ela marca a cirurgia (19:00–21:00) e, em seguida, o procedimento curto no mesmo início (19:00–19:30, ou até o fim que ela digitar). Sem confirmação, nada é gravado. Com **Marcar as duas**, a mais longa guarda `induction_minutes` igual à duração da mais curta. No exemplo, a cirurgia fica com paciente das 19:00 às 21:00 e dentista exclusivo das 19:30 às 21:00. A curta ocupa 19:00–19:30. Os trechos exclusivos se encostam e não se cruzam.

| Situação | O que o sistema faz |
| -------- | ------------------- |
| Novo horário começa junto e termina antes do fim da consulta já marcada | Aviso. Se confirmar, grava as duas. |
| Novo horário começa junto e é mais longo | Mesmo aviso. A janela livre passa a ser o tamanho da consulta mais curta. |
| Horário cruzado no meio, ou início diferente | Bloqueio: `Horário indisponível para {dentista}`. |
| Já existem duas consultas nesse início | Bloqueio: `Esse horário já tem duas consultas. Não é possível marcar outra.` |
| Fila oferece ou aceita horário | Sem esta exceção. A vaga automática continua inteira ocupada. |

Texto do aviso: título **Já existe uma consulta nesse horário**. Corpo **{Paciente existente} já está marcado com {dentista} das {início} às {fim}. Deseja marcar {paciente novo} também, das {início novo} às {fim novo}?** Linha de apoio **Isso serve para o início de uma cirurgia, enquanto a medicação faz efeito.** Botões **Marcar as duas** e **Voltar**. Na edição ou no arraste, os nomes trocam de papel.

---

## 1. Abordagem (6 passos)

**Passo 1. Migration.** Nova migration com `induction_minutes` (padrão 0, maior ou igual a zero e estritamente menor que a duração), colunas geradas `busy_starts_at = starts_at + induction_minutes` e `busy_ends_at = ends_at`, e a constraint `appointments_no_active_overlap` reapontada para `tstzrange(busy_starts_at, busy_ends_at, '[)')`. Consultas já gravadas ficam com 0. Status `cancelled` e `rescheduled` continuam fora da constraint.

**Passo 2. Domínio e testes.** `hasAppointmentConflict` compara o trecho exclusivo. Um par com o mesmo início, em que a mais curta termina antes da mais longa, devolve "pede confirmação". Início diferente, mesmo horário inteiro, terceira consulta e invasão do meio continuam conflito. Horário adjacente (a curta termina quando a exclusiva começa) passa sem aviso.

**Passo 3. Actions.** Criar, editar e arrastar, sem a flag de confirmação, devolvem o aviso e não gravam. Com a flag, gravam e preenchem `induction_minutes` só na mais longa. A terceira recebe a mensagem de bloqueio, sem botão de confirmar. Arrastar ou editar qualquer uma das duas passa de novo pela mesma regra. Se o início deixar de coincidir, ou se a curta passar do fim da longa, a alteração é recusada.

**Passo 4. Diálogo.** Formulário de horário permanece o de hoje. O aviso da seção Objetivo entra no criar, no editar e no arrastar. Sem a confirmação explícita, a action não insere.

**Passo 5. Fila.** Oferta e aceite não usam a exceção e não abrem o diálogo. Continuam ocupando `starts_at` até `ends_at`, para a janela da medicação não aparecer como vaga. Lembrete e WhatsApp seguem `starts_at`.

**Passo 6. Calendário e docs.** Conferir se os dois blocos já empilham com o curto ao lado do topo do longo. Ajustar `agenda-calendar.tsx` só se isso não acontecer. Na lista do dia, os dois entram em ordem de início. `docs/implementation/F2-agenda.md`, `docs/manual-dev/04-fase-2-agenda.md` e `docs/state/PENDENCIAS.md` só quando a fatia fechar.

---

## 2. Arquivos a criar / alterar

**Criar**

- `supabase/migrations/031_appointment_induction.sql`
- `src/features/agenda/components/overlap-confirm-dialog.tsx`

**Alterar**

- [`src/features/agenda/domain/appointment-conflict.ts`](../../src/features/agenda/domain/appointment-conflict.ts) e [`appointment-conflict.test.ts`](../../src/features/agenda/domain/appointment-conflict.test.ts)
- [`src/features/agenda/actions.ts`](../../src/features/agenda/actions.ts) e [`actions.test.ts`](../../src/features/agenda/actions.test.ts)
- [`src/features/agenda/schemas.ts`](../../src/features/agenda/schemas.ts) e [`schemas.test.ts`](../../src/features/agenda/schemas.test.ts) (flag de confirmação)
- [`src/features/agenda/queries.ts`](../../src/features/agenda/queries.ts) e [`types.ts`](../../src/features/agenda/types.ts) (`induction_minutes` no intervalo)
- [`src/lib/supabase/database.types.ts`](../../src/lib/supabase/database.types.ts)
- [`src/features/agenda/components/appointment-form.tsx`](../../src/features/agenda/components/appointment-form.tsx)
- [`src/features/agenda/components/agenda-view.tsx`](../../src/features/agenda/components/agenda-view.tsx) e [`reschedule-confirm-dialog.tsx`](../../src/features/agenda/components/reschedule-confirm-dialog.tsx)
- [`src/features/waitlist/actions.ts`](../../src/features/waitlist/actions.ts) e [`src/features/waitlist/lib/accept-slot-offer.ts`](../../src/features/waitlist/lib/accept-slot-offer.ts)
- [`src/features/agenda/components/agenda-calendar.tsx`](../../src/features/agenda/components/agenda-calendar.tsx) somente se o empilhamento atual não colocar o curto ao lado do topo do longo

---

## 3. Fora de escopo

- Medicação no fim da cirurgia
- Terceira consulta no mesmo início
- Cruzamento com inícios diferentes
- Sala, cadeira ou catálogo de procedimentos
- Quebrar a cirurgia em duas consultas
- Soltar o bloqueio para qualquer sobreposição
- Mudança em lembrete ou WhatsApp

---

## 4. Riscos técnicos

- **Migration da constraint.** A constraint atual impede o par. A troca do intervalo não pode deixar consultas existentes inválidas: todas entram com `induction_minutes = 0`.
- **Fila no trecho exclusivo.** Se oferta e aceite passarem a olhar só `busy_starts_at`, a janela das 19:00 às 19:30 de uma cirurgia com indução vira vaga. Por isso a fila continua no intervalo completo do paciente.
- **Par dessincronizado.** Editar ou arrastar uma das duas pode zerar ou recalcular `induction_minutes` na outra. As duas gravações precisam da mesma regra, senão a constraint rejeita um par que a tela acabou de confirmar.
- **Trecho exclusivo vazio.** Duas consultas com o mesmo início e o mesmo fim continuam bloqueadas. A longa não pode ficar com `induction_minutes` igual à duração inteira.
- **Gravação em silêncio.** O diálogo não grava sozinho. Sem a flag explícita, a action devolve o aviso e não insere.

---

## 5. Path crítico

**Sim.**

Toca:

- Constraint `appointments_no_active_overlap` e a migration que a reaponta
- `hasAppointmentConflict`, usada na agenda e na fila
- Actions de criar, editar e arrastar consulta
- Oferta e aceite de horário da fila (`waitlist/actions.ts` e `accept-slot-offer.ts`)

Não toca o desenho obrigatório do calendário, o lembrete nem o WhatsApp: a coluna já empilha eventos que se cruzam, e o disparo continua em `starts_at`.

---

## Premissas (apontar se discordar)

1. A fila ocupa o intervalo inteiro do paciente (`starts_at` até `ends_at`). O trecho exclusivo vale para a constraint e para a agenda. A frase do research sobre "conflito do trecho exclusivo" no aceite não libera a janela da medicação como vaga.
2. `induction_minutes` mora só na consulta mais longa. A curta fica com 0.
3. 30 minutos é o caso da recepção. 20, 40 ou o fim digitado seguem a mesma conta, desde que a curta comece junto e acabe antes da longa.
4. Docs da Fase 2 entram ao fechar a fatia, não neste rascunho.
