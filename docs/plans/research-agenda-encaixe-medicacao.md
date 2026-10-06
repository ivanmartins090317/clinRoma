# Research · Encaixe na meia hora de medicação

> Agenda · Status: **decisão de produto · sem código**
> Data: **2026-10-06**
> Origem: recepção da Clínica Neo Roma. No sistema atual eles sobrepõem dois pacientes no mesmo dentista quando um vai para cirurgia e o outro faz um procedimento curto enquanto a medicação faz efeito.

Nenhum código até esta decisão ser aprovada para implementação.

---

## Decisão

A segunda consulta entra no **início** da que já existe. A duração é **30 minutos ou a que a recepção informar** no horário de fim. O sistema não grava em silêncio: mostra um aviso e só salva se a pessoa confirmar que quer as duas no mesmo horário.

Não há seletor de "tempo de medicação" na cirurgia. A recepção marca a cirurgia (19:00–21:00) e, em seguida, o procedimento curto começando no mesmo horário (19:00–19:30, ou 19:00 até o fim que ela digitar). O cruzamento permitido é esse prefixo.

| Situação | O que o sistema faz |
| -------- | ------------------- |
| Novo horário começa junto com uma consulta já marcada e termina antes do fim dela | Aviso. Se confirmar, grava as duas. |
| Novo horário começa junto e é mais longo (cirurgia marcada depois do procedimento curto) | Mesmo aviso. A janela livre passa a ser o tamanho da consulta mais curta. |
| Horário cruzado no meio, ou início diferente | Continua bloqueado: `Horário indisponível para {dentista}`. |
| Já existem duas consultas nesse início | Bloqueia a terceira. Sem novo aviso de confirmação. |
| Fila oferece ou aceita horário | Não usa esta exceção. A vaga automática continua inteira ocupada. |

A trava do banco permanece no trecho em que o dentista está exclusivo. Ao confirmar, a consulta mais longa guarda `induction_minutes` igual à duração da mais curta. No exemplo, a cirurgia fica com paciente das 19:00 às 21:00 e dentista exclusivo das 19:30 às 21:00. A curta ocupa 19:00–19:30. Os trechos exclusivos não se cruzam.

Arrastar ou editar qualquer uma das duas passa de novo pela mesma regra. Se o início deixar de coincidir, ou se a curta passar do fim da longa, a alteração é recusada.

### Texto do aviso

Título: **Já existe uma consulta nesse horário**

Corpo: **{Paciente existente} já está marcado com {dentista} das {início} às {fim}. Deseja marcar {paciente novo} também, das {início novo} às {fim novo}?**

Linha de apoio: **Isso serve para o início de uma cirurgia, enquanto a medicação faz efeito.**

Botões: **Marcar as duas** e **Voltar**

Quando a pessoa abre o aviso a partir da consulta que já está na agenda (edição ou arraste), o corpo troca o papel dos nomes e mantém a mesma pergunta: as duas ficam nesse horário só se ela confirmar.

Terceira consulta no mesmo início, sem botão de confirmar: **Esse horário já tem duas consultas. Não é possível marcar outra.**

---

## O que a recepção descreveu

Um dentista, dois pacientes, o mesmo início:

| Paciente | Horário | O que acontece |
| -------- | ------- | -------------- |
| Cirurgia | 19:00 às 21:00 | Chega, é medicado e espera o efeito. O dentista só entra de fato depois. |
| Procedimento curto (tirar ponto) | 19:00 às 19:30 | Atendido nesse intervalo. Dura cerca de meia hora. |

Palavras da recepção: em geral é meia hora, é raro, e eles marcam junto quando é cirurgia mais um procedimento curto no tempo da medicação.

Nas imagens do sistema atual, os dois blocos aparecem empilhados na mesma coluna: o curto (19:00–19:30) por cima do longo (19:00–21:00).

O dentista não atende os dois ao mesmo tempo. O paciente da cirurgia ocupa a cadeira e espera. O dentista usa essa espera para um procedimento de meia hora em outra cadeira e volta para a cirurgia.

---

## O que o ClinRoma faz hoje

Dois horários do mesmo dentista não podem se cruzar se os dois estiverem ativos (`scheduled`, `confirmed`, `in_progress`, `completed`, `no_show`). `cancelled` e `rescheduled` ficam de fora.

A regra está em três lugares, de propósito:

| Camada | Onde |
| ------ | ---- |
| Domínio | `hasAppointmentConflict()` em `src/features/agenda/domain/appointment-conflict.ts` |
| Gravação | `src/features/agenda/actions.ts` (criar, editar, arrastar) |
| Banco | `supabase/migrations/010_appointment_conflict.sql`, constraint `appointments_no_active_overlap` |

A fila usa a mesma função ao oferecer e ao aceitar um horário (`waitlist/actions.ts`, `accept-slot-offer.ts`).

Mensagem na tela: `Horário indisponível para {dentista}`.

Uma consulta normal guarda só `starts_at` e `ends_at`. O procedimento é texto livre (`procedure_name`), sem catálogo de "cirurgia" ou "tirar ponto". O calendário (`agenda-calendar.tsx`) já empilha eventos que se cruzam. O que impede o caso da recepção é a regra, não o desenho da coluna.

---

## O que não resolver

**Soltar o bloqueio.** Igualar ao sistema antigo e deixar qualquer sobreposição. A trava da Fase 2 existe para a recepção não marcar dois atendimentos cheios no mesmo dentista sem querer. O caso real é estreito: uma espera clínica no começo de uma cirurgia.

**Quebrar a cirurgia em duas consultas** (19:00–19:30 "medicação" e 19:30–21:00 "cirurgia"). O paciente da cirurgia é uma visita só: um lembrete, um status, um prontuário. Dois registros duplicam lembrete e WhatsApp. Se a primeira fatia não bloquear, o horário das 19:00 parece livre e alguém marca um procedimento de uma hora que invade a cirurgia.

**Catálogo de procedimentos** ("tirar ponto pode cruzar com cirurgia"). O nome do procedimento é texto livre. A recepção não vai manter uma lista só por causa de um encaixe raro.

**Cadeira como segundo recurso.** O ClinRoma não modela sala nem cadeira. O limite real neste relato é o tempo do dentista. Modelar sala agora é maior do que o problema.

---

## Como a decisão se apoia no horário

A consulta continua sendo o horário em que o **paciente** está na clínica (`starts_at` → `ends_at`). O bloqueio do banco passa a valer no trecho em que o **dentista** está exclusivo.

A recepção não preenche um campo de medicação. Ela marca as duas consultas. Se as duas começam juntas e a mais curta termina antes da mais longa, o aviso da seção Decisão aparece. **Marcar as duas** grava e define, na consulta mais longa:

`induction_minutes` = duração da mais curta.

| Consulta | Paciente na clínica | Dentista exclusivo | `induction_minutes` |
| -------- | ------------------- | ------------------ | ------------------- |
| Cirurgia | 19:00–21:00 | 19:30–21:00 | 30 |
| Tirar ponto | 19:00–19:30 | 19:00–19:30 | 0 |

30 minutos é o caso da recepção. 20, 40 ou o fim que ela digitar seguem a mesma conta, desde que a curta comece junto e acabe antes da longa. O trecho exclusivo da longa nunca fica vazio: duas consultas com o mesmo início e o mesmo fim continuam bloqueadas.

Os trechos exclusivos se encostam e não se cruzam. A constraint segue no intervalo meio-aberto `[)`. Consulta comum permanece com `induction_minutes = 0`.

### Onde a trava mora

- `busy_starts_at = starts_at + induction_minutes`
- `busy_ends_at = ends_at`
- `EXCLUDE` em `(dentist_id, tstzrange(busy_starts_at, busy_ends_at, '[)'))` para status ativo

Colunas geradas. A função de domínio compara trechos exclusivos e, em separado, reconhece o par com o mesmo início para a action devolver o aviso em vez do bloqueio. A fila não entra nesse reconhecimento.

### Tela

O formulário de horário permanece o de hoje. A duração da segunda consulta é o fim que a recepção já informa. O aviso é o da seção Decisão, no criar, no editar e no arrastar.

No calendário os dois blocos ficam empilhados, o curto ao lado do topo do longo. Na lista do dia, os dois entram em ordem de início.

### Fila e lembrete

A fila não oferece a janela do início. Lembrete e WhatsApp seguem `starts_at`. Os dois pacientes são chamados para as 19:00.

### Fora desta fatia

- Medicação no fim da cirurgia.
- Terceira consulta no mesmo início.
- Cruzamento com inícios diferentes.
- Sala ou cadeira.

---

## Corte de implementação

1. Migration: `induction_minutes` (padrão 0, maior ou igual a zero, estritamente menor que a duração), colunas do trecho exclusivo, constraint reapontada. Consultas existentes ficam com 0.
2. Domínio e testes: mesmo início e curta contida na longa devolvem "pede confirmação"; início diferente, mesmo horário inteiro, terceira consulta e invasão do meio continuam conflito. Horário adjacente (curta termina quando a exclusiva começa) passa sem aviso.
3. Actions de criar, editar e arrastar: sem confirmação, devolvem o aviso; com confirmação, gravam e preenchem `induction_minutes` na mais longa. A terceira recebe a mensagem de bloqueio.
4. Diálogo com o texto da seção Decisão.
5. Fila: sem a exceção. O aceite continua na função de conflito do trecho exclusivo.
6. Docs da Fase 2 (`docs/manual-dev/04-fase-2-agenda.md` e `docs/implementation/F2-agenda.md`) só quando a fatia fechar.
