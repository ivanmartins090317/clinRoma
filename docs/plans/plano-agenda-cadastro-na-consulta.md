# Plano · Cadastro de paciente na nova consulta

> Agenda · Autonomia: **medium**
> Status: **rascunho · aguardando aprovação**
> Data: **2026-10-07**
> Origem: [`research-agenda-cadastro-na-consulta.md`](research-agenda-cadastro-na-consulta.md). A recepção pesquisa o paciente no horário. Se não existir, faz o cadastro que já temos e marca a consulta sem sair da agenda.

**Pronto quando:** no diálogo **Nova consulta**, a busca mostra **+ Novo paciente: {nome digitado}**; o painel pede os mesmos dados de `/pacientes/novo`, com LGPD; **Cadastrar e marcar** grava o paciente e a consulta no horário já escolhido e fecha o diálogo na agenda; CPF repetido não cria outro paciente; se o horário falhar, o paciente fica e o diálogo segue aberto com ele selecionado; escolher alguém que já existe continua só em **Salvar**; a edição de consulta não oferece o atalho.

Nenhum código até este plano ser aprovado.

---

## 1. Abordagem (5 passos)

**Passo 1. Atalho na busca.** Em `PatientCombobox`, com 3 caracteres ou mais e ninguém selecionado, mostrar **+ Novo paciente: {texto}** abaixo dos resultados. Se a lista vier vazia, o atalho substitui **Nenhum paciente encontrado**. A busca em si continua a partir de 2 caracteres. O combobox só exibe o atalho quando o formulário passa um callback. Na edição esse callback não existe.

**Passo 2. Painel no diálogo de criação.** Clique no atalho abre os campos do cadastro atual (nome preenchido com a busca, nascimento, CPF, telefone, e-mail, telefone secundário, consentimento LGPD, nome da assinatura). Dentista, data, início, fim, situação, procedimento e observação permanecem. **Usar paciente já cadastrado** fecha o painel e devolve a busca. Não usar `PatientForm`: ele redireciona para a ficha. A validação é `createPatientSchema`.

**Passo 3. Action única, duas gravações já existentes.** Nova action valida os dois payloads antes de escrever. Cria o paciente por `createPatientAction` com origem de auditoria `agenda-nova-consulta` (a lista continua `lista-pacientes`). Em seguida chama `createAppointmentAction` com o id novo. Quem já escolheu um paciente não passa por essa action.

**Passo 4. Falha no meio do caminho.** CPF já cadastrado: nenhum insert, devolve o id existente e o texto atual. A tela oferece usar essa pessoa e o próximo **Salvar** grava só a consulta. Horário inválido, conflito ou aviso de medicação: o paciente permanece, o painel fecha, ele fica selecionado e o diálogo mostra o erro ou o aviso **Marcar as duas**. A confirmação do par chama só `createAppointmentAction`, para não cadastrar de novo.

**Passo 5. Testes.** Paciente e consulta gravados juntos; CPF duplicado não cria linha e devolve o id; falha de horário mantém o paciente e não grava a consulta; paciente já selecionado não chama a action nova. Docs da Fase 2 e da Fase 3 só quando a fatia fechar.

---

## 2. Arquivos a criar / alterar

**Criar**

- `src/features/agenda/components/appointment-new-patient-panel.tsx`
- `src/features/agenda/create-patient-and-appointment.ts` (a action; `actions.ts` já passa de 300 linhas e não entra refatoração nesta fatia)
- `src/features/agenda/create-patient-and-appointment.test.ts`

**Alterar**

- [`src/features/agenda/components/patient-combobox.tsx`](../../src/features/agenda/components/patient-combobox.tsx) (atalho)
- [`src/features/agenda/components/appointment-form.tsx`](../../src/features/agenda/components/appointment-form.tsx) (painel, botão **Cadastrar e marcar**, troca para paciente já criado quando o horário falha)
- [`src/features/patients/actions.ts`](../../src/features/patients/actions.ts) (origem da auditoria com default `lista-pacientes`)

Não alterar `createAppointmentAction`, conflito, calendário, fila nem a rota `/pacientes/novo`.

---

## 3. Fora de escopo

- Aba Compromisso ou bloqueio sem paciente
- Cadastro só com nome e celular, sem LGPD
- Grade de horários, categoria, como conheceu, múltiplos agendamentos, primeira consulta
- Anamnese, odontograma ou evolução neste diálogo
- Abrir `/pacientes/novo` ou a ficha ao salvar
- Clique em horário vazio no calendário do celular
- Lembrete, WhatsApp, fila, edição e arraste
- Migration ou coluna nova

---

## 4. Riscos técnicos

- **Segundo paciente sem CPF.** Se a consulta falhar e o diálogo continuar no modo "novo", outro clique grava outra pessoa com o mesmo nome. Ao receber `patientId`, a tela sai do painel e os salvamentos seguintes chamam só `createAppointmentAction`. O botão fica desabilitado enquanto a action roda.
- **Aviso de medicação depois do insert.** `createAppointmentAction` pode devolver `overlap` sem gravar a consulta. A confirmação **Marcar as duas** não pode repetir o cadastro.
- **Origem da auditoria.** `createPatientAction` grava `lista-pacientes` fixo. O parâmetro novo precisa ter default, senão o cadastro pela lista muda de origem.
- **Dois formulários.** O painel repete os campos de `PatientForm` e os dois passam por `createPatientSchema`. A ficha não muda. Se um campo novo entrar só num dos dois, o outro fica para trás.
- **Diálogo longo no celular.** O painel entra no scroll que o diálogo já tem (`max-h-[90vh]`). Não abre segunda janela.

---

## 5. Path crítico

**Sim, estreito.**

Toca:

- O diálogo **Nova consulta** na criação (busca e gravação quando o paciente ainda não existe)
- `createPatientAction`, só para informar a origem da auditoria
- O encadeamento que chama essa action e, em seguida, `createAppointmentAction`

Não altera a regra de quem já está no banco: **Salvar** segue em `createAppointmentAction`. Não mexe em `hasAppointmentConflict`, na constraint `appointments_no_active_overlap`, na fila, no arraste, na edição, no lembrete nem no WhatsApp.

---

## Premissas (apontar se discordar)

1. Sem migration. O paciente e a consulta usam as tabelas atuais.
2. Paciente gravado não é apagado se o horário falhar.
3. O atalho não aparece na edição.
4. Docs da Fase 2 e da Fase 3 entram ao fechar a fatia, não neste rascunho.
