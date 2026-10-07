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

Dois trechos exclusivos do **mesmo dentista** não podem se cruzar enquanto as consultas estiverem ativas (todos os status exceto `cancelled` e `rescheduled`). Numa consulta comum o tempo de medicação é zero, então o trecho exclusivo é a visita inteira.

| Camada    | Onde                                                    |
| --------- | ------------------------------------------------------- |
| Domínio   | `classifyAppointmentPlacement()` em `appointment-conflict.ts` |
| Aplicação | `actions.ts` antes de persistir                         |
| Banco     | `010_appointment_conflict.sql` e `031_appointment_induction.sql` |

Mensagem de bloqueio: `Horário indisponível para {nome do dentista}`.

Terceira consulta no mesmo início: `Esse horário já tem duas consultas. Não é possível marcar outra.`

### Encaixe na meia hora de medicação

A recepção não preenche um campo de medicação. Ela marca a cirurgia, por exemplo 19:00 às 21:00, e em seguida o procedimento curto no mesmo início, até o fim que ela digitar. O aviso **Já existe uma consulta nesse horário** aparece. **Voltar** não grava. **Marcar as duas** grava as duas.

A consulta mais longa guarda `induction_minutes` igual à duração da mais curta. No exemplo, a cirurgia fica com o paciente das 19:00 às 21:00 e o dentista exclusivo das 19:30 às 21:00. O curto fica com zero e ocupa das 19:00 às 19:30. Os trechos exclusivos se encostam às 19:30.

Editar ou arrastar qualquer uma das duas passa de novo pela mesma conta. No arraste que forma o par, o aviso de medicação é a única confirmação. Afastar ou cancelar uma das duas zera o tempo de medicação da que permanece.

A fila não usa esse aviso. Oferta e aceite continuam ocupando a visita inteira, inclusive a janela das 19:00 às 19:30. Lembrete e mensagem ao paciente seguem na chegada.

O calendário (`agenda-calendar.tsx`) não foi alterado: o empilhamento padrão já coloca o curto ao lado do topo do longo. Na lista do dia as duas entram em ordem de início.

### Cadastro na nova consulta

A recepção pesquisa o nome no diálogo **Nova consulta**. A busca continua a partir de dois caracteres. Com três ou mais, e ninguém escolhido, aparece **+ Novo paciente:** seguido do texto, sem os espaços das pontas. Se a lista vier vazia, o atalho fica no lugar de **Nenhum paciente encontrado**. Se houver homônimos, a lista e o atalho aparecem juntos.

O clique abre, no mesmo diálogo, os campos de **Novo paciente**: nome preenchido, nascimento, CPF, telefone, e-mail, segundo telefone, consentimento e nome da assinatura. Dentista, data, início, fim, situação, procedimento e observação continuam. **Usar paciente já cadastrado** fecha o painel, limpa esses campos e volta à busca, sem gravar.

**Cadastrar e marcar** confere a pessoa e a consulta antes de escrever. Se os dois passam, grava a pessoa e depois a consulta nesse dentista e nesse horário. O diálogo fecha. O bloco entra na agenda. A ficha não abre. Enquanto grava, o botão fica **Salvando...** e desabilitado.

Quem já escolheu um nome na lista segue em **Salvar**, só a consulta. A edição de uma consulta já marcada não mostra o atalho nem o painel.

CPF já cadastrado não cria outra pessoa. A mensagem é **CPF já cadastrado para {nome}.** **Usar {nome}** escolhe essa pessoa. O **Salvar** seguinte grava só a consulta.

Se a pessoa for gravada e o horário for recusado, ela permanece, o painel fecha, ela fica escolhida e o diálogo mostra o erro da agenda. O **Salvar** seguinte tenta só a consulta. Se o horário pedir **Marcar as duas**, a confirmação grava só a consulta. **Voltar** não grava a consulta e não cadastra outra pessoa.

No celular não há clique no vão vazio. **Nova consulta** abre o mesmo diálogo, e o atalho entra nele.

A auditoria do cadastro feito aqui registra origem `agenda-nova-consulta`. O cadastro em `/pacientes/novo` continua com origem `lista-pacientes`.

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

### Par de medicação

1. Marcar uma consulta das 19:00 às 21:00
2. Marcar outra das 19:00 às 19:30, mesmo dentista e outro paciente
3. O aviso nomeia quem já está na agenda. **Voltar** mantém o formulário e não grava
4. **Marcar as duas** grava. A mais longa fica com 30 minutos de medicação. A curta fica com zero
5. Tentar uma terceira no mesmo início: `Esse horário já tem duas consultas. Não é possível marcar outra.`
6. Na fila, oferecer 19:00–19:30 ou 19:30–20:00 nesse dentista continua indisponível, sem o aviso de medicação

### Cadastrar e marcar a partir do vão

1. Login `reception@clinroma.dev` no desktop → **Agenda**
2. Clicar um horário livre. **Nova consulta** abre com dentista, data, início e fim
3. Digitar um nome de pelo menos três caracteres que ninguém tem
4. No lugar de **Nenhum paciente encontrado**, ver **+ Novo paciente:** seguido do texto
5. Abrir o painel, marcar o consentimento, informar a assinatura e tocar **Cadastrar e marcar**
6. O diálogo fecha. O bloco entra na coluna. A ficha não abre

### Homônimo, paciente já existente e CPF repetido

1. Buscar um nome parecido com alguém da lista. O atalho continua abaixo dos resultados
2. Escolher o nome da lista. O atalho some. **Salvar** grava só a consulta
3. No painel, informar um CPF que já existe. Nada de novo é gravado. **Usar {nome}** escolhe quem já tem esse CPF. **Salvar** grava só a consulta

### Horário recusado depois do cadastro

1. Cadastrar uma pessoa num horário que a agenda recusa, ou que peça **Marcar as duas**
2. A pessoa permanece. O painel fecha. Ela fica escolhida
3. Ajustar o horário e tocar **Salvar**, ou confirmar **Marcar as duas**. Só a consulta é gravada
4. **Voltar** no aviso de medicação não grava a consulta e não cria outra pessoa

### Edição sem atalho

1. Abrir uma consulta já marcada
2. A busca não mostra **+ Novo paciente** nem o painel. O botão é **Salvar**

### O mesmo diálogo no celular

1. Viewport estreito, login `reception@clinroma.dev`
2. **Nova consulta** abre o mesmo diálogo, sem dentista vindo de um clique no calendário
3. Escolher o dentista, usar o atalho e **Cadastrar e marcar**. A consulta aparece na lista do período

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
