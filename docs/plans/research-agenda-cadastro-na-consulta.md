# Research · Cadastro de paciente na nova consulta

> Agenda · Status: **decisão de produto · sem código**
> Data: **2026-10-07**
> Origem: recepção da Clínica Neo Roma. No Clinicorp, quem marca a consulta pesquisa o paciente no próprio horário. Se o nome não existe, cadastra ali e confirma a consulta sem sair da agenda.

Nenhum código até esta decisão ser aprovada para implementação.

Vídeo analisado: `WhatsApp Video 2026-10-07 at 11.18.59.mp4` (58 s, tela do Clinicorp e, no fim, a agenda do ClinRoma). A imagem enviada no chat é o mesmo diálogo, com a busca `LIL` e o atalho `+ Novo paciente`.

---

## Decisão

A recepção continua no diálogo **Nova consulta**. A busca de paciente ganha o atalho **+ Novo paciente: {nome digitado}**. Esse atalho abre o cadastro que já existe, no mesmo diálogo, com o horário que ela clicou ainda preenchido. Um único botão grava o paciente e a consulta.

O cadastro não fica mais leve. Nome, consentimento LGPD e nome da assinatura continuam obrigatórios. Nascimento, CPF, telefone, e-mail e telefone secundário continuam opcionais, com as mesmas regras de hoje. A ficha em `/pacientes/novo` permanece para quem entra pela lista de pacientes.

| Situação | O que o sistema faz |
| -------- | ------------------- |
| Clique num horário livre (desktop) ou botão **Nova consulta** | Abre o diálogo já usado hoje, com dentista, data e horário quando o clique trouxe esses dados. |
| Busca com 3 caracteres ou mais | Lista quem já existe. Abaixo da lista, ou no lugar dela se não houver ninguém, mostra **+ Novo paciente: {texto}**. |
| Clique no atalho | Abre o painel de cadastro dentro do diálogo. O nome vem preenchido com o texto da busca e pode ser corrigido. Dentista, data, início, fim, situação, procedimento e observação continuam na tela. |
| **Cadastrar e marcar** | Grava o paciente com as regras atuais e, em seguida, a consulta nesse paciente e nesse horário. O diálogo fecha. O bloco aparece na agenda. Não abre a ficha. |
| A busca achou a pessoa | Ela escolhe o nome, como hoje, e salva só a consulta. O painel de cadastro não aparece. |
| CPF já cadastrado | Não cria outro paciente. Mostra o aviso atual e oferece usar o paciente que já tem esse CPF, ainda dentro do diálogo. |
| Paciente gravado e o horário falha (conflito, medicação, validação) | O paciente permanece. O diálogo continua aberto, já com ele selecionado, e mostra o erro da consulta. O próximo **Salvar** tenta só o horário. |
| Edição de consulta já marcada | Sem atalho de paciente novo. Trocar o paciente continua sendo busca de quem já existe. |

### Texto do atalho

Botão, abaixo dos resultados da busca: **+ Novo paciente: {nome digitado}**

O nome é o texto do campo, sem espaços nas pontas. O botão só aparece com pelo menos 3 caracteres, o mínimo do nome no cadastro. Aparece também quando já existem pacientes parecidos, para dois homônimos não se bloquearem.

Botão principal, com o painel aberto: **Cadastrar e marcar**

Voltar à busca: **Usar paciente já cadastrado**. Limpa o painel e devolve a lista.

---

## O que a recepção mostrou no Clinicorp

Fluxo gravado em 07/10/2026, coluna do Dr. Felipe Silva Roma, horário livre das 22:00:

1. Clique no vão livre das 22:00. O calendário sugere o slot (`Clique para criar um agendamento` no vão ao lado).
2. Abre **Nova consulta**, com duas abas: **Consulta** e **Compromisso**. A aba usada é **Consulta**.
3. O primeiro campo é o nome. Conforme digita (`LIL`, `LILIANE R`, `LILIANE ROMERO`), se não há seleção, o diálogo oferece **+ Novo paciente:** seguido do texto digitado.
4. O clique nesse atalho não troca de página. O mesmo diálogo passa a mostrar o nome no topo, um selo **Novo paciente**, celular e e-mail.
5. O restante já estava no formulário da consulta: primeira consulta (marcada), como conheceu, múltiplos agendamentos, observações, procedimentos, data **07 out, 2026**, profissional **Felipe Silva Roma** (a coluna clicada), categoria, grade de horários com **22:00** em destaque (22:00–22:30, ajustável para 22:00–23:00), confirmação, alerta e canal de envio.
6. **Confirmar consulta** grava os dois de uma vez. Toast: **Consulta criada com sucesso!** O bloco **LILIANE ROMERO**, 22h–23h, entra na coluna.

No vídeo, o único dado novo além do nome foi o celular. O e-mail ficou no placeholder. Não houve tela separada de ficha, CPF nem termo LGPD.

---

## O que o ClinRoma faz hoje

O clique no horário livre já existe no desktop. `AgendaCalendar` chama `onSelectSlot`, e a agenda abre **Nova consulta** com dentista, data, início e fim daquele clique. O botão **Nova consulta**, sem clique, usa o próximo horário livre da clínica.

A busca também já existe. `PatientCombobox` consulta `searchPatientsAction` a partir de 2 caracteres, por nome ou CPF. Se não acha ninguém, o texto é **Nenhum paciente encontrado**. Não há ação em seguida.

A consulta exige um paciente já gravado (`patientId` uuid em `createAppointmentAction`). Sem esse id, **Salvar** não segue.

O cadastro mora em outra rota. **Pacientes** → **Novo paciente** (`/pacientes/novo`) pede nome, nascimento, CPF, telefone, e-mail, telefone secundário, consentimento LGPD e nome da assinatura. `createPatientAction` grava, registra auditoria com origem `lista-pacientes` e a tela manda para a ficha `/pacientes/{id}`. Para marcar o horário, a recepção volta na agenda, acha o vão de novo e busca o nome que acabou de criar.

Quem escreve na agenda é administrador e recepção. Os dois também escrevem paciente. Dentista cadastra paciente na lista, mas não marca consulta. Visualizador e auxiliar não entram nesse fluxo.

No celular não há clique no calendário. A agenda estreita é a lista do período. **Nova consulta** abre o mesmo diálogo, sem coluna pré-escolhida. O atalho de paciente novo entra nesse diálogo, então o celular também cadastra e marca. O horário pré-preenchido pelo clique continua sendo o do desktop.

---

## O que não copiar do Clinicorp

**Aba Compromisso.** Bloqueio de horário sem paciente. A recepção não pediu isso. A agenda do ClinRoma já ocupa o dentista pela consulta.

**Grade de horários, categoria, como conheceu, múltiplos agendamentos e primeira consulta.** O horário já vem do clique, com início e fim editáveis. Procedimento e observação já são texto livre. Catálogo de procedimentos e origem do paciente ficam fora.

**Confirmação, alerta e canal dentro deste diálogo.** Lembrete e WhatsApp já têm fluxo próprio. Marcar a consulta não dispara mensagem nova.

**Cadastro só com nome e celular.** No vídeo o Clinicorp grava a pessoa sem CPF e sem termo. No ClinRoma o consentimento LGPD e o nome da assinatura são obrigatórios no `createPatientSchema`. Esta fatia reutiliza essa função. Não cria um paciente incompleto para acelerar a recepção.

**Abrir `/pacientes/novo` em outra aba do navegador.** O horário clicado se perde, e a recepção refaz a busca. O painel fica dentro de **Nova consulta**.

**Levar à ficha ao salvar.** O fim do fluxo é o bloco na agenda. A ficha continua acessível pelo paciente ou por **Abrir prontuário** depois.

---

## Como a decisão se apoia no que já existe

Não há coluna nova nem migration. O paciente é o mesmo registro de `patients`. A consulta é o mesmo `appointments`, com o `patient_id` recém-criado.

O painel reutiliza a validação de `createPatientSchema`: nome com pelo menos 3 caracteres, CPF válido e único quando informado, e-mail válido quando informado, telefone secundário com as regras atuais, consentimento marcado e nome da assinatura.

A gravação é uma ação só, nesta ordem:

1. Validar paciente e consulta antes de escrever.
2. Criar o paciente. A auditoria registra origem `agenda-nova-consulta` e o nome da assinatura, como a lista já faz com `lista-pacientes`.
3. Criar a consulta com o id retornado, dentista e horário do diálogo. Conflito e par de medicação seguem as actions atuais, inclusive o aviso **Marcar as duas**.
4. Se o passo 3 falhar, não apagar o paciente. Devolver o id e o erro da consulta. A interface fecha o painel, seleciona essa pessoa e mantém o diálogo aberto.

CPF repetido interrompe no passo 2, com o mesmo texto de hoje (`CPF já cadastrado para {nome}`) e o id existente para a recepção usar essa pessoa e salvar a consulta.

Quem só pesquisa e escolhe um paciente existente não passa pela criação. **Salvar** continua chamando só `createAppointmentAction`.

### Tela

Ordem no diálogo de criação:

1. Busca, com a lista e o atalho **+ Novo paciente**.
2. Painel de cadastro, visível só depois do atalho. Os campos são os de `/pacientes/novo`, nome já preenchido.
3. Dentista, data, início, fim, situação, procedimento, observação. Nada disso muda de lugar nem de regra.

O diálogo já rola (`max-h-[90vh]`). O painel entra nesse scroll. Não abre segunda janela.

Na edição, a busca permanece e o atalho não é renderizado.

### Fora desta fatia

- Aba de compromisso ou bloqueio sem paciente.
- Cadastro sem LGPD.
- Anamnese, odontograma ou evolução neste diálogo.
- Clique em horário vazio no calendário do celular.
- Disparo de lembrete ou WhatsApp ao confirmar.

---

## Corte de implementação

1. `PatientCombobox`: com busca de 3 caracteres ou mais e ninguém selecionado, mostrar **+ Novo paciente: {texto}** abaixo dos resultados. Com lista vazia, o atalho substitui a frase **Nenhum paciente encontrado**.
2. `AppointmentForm`, só na criação: painel com os campos do cadastro atual. Nome inicial igual ao texto da busca. **Usar paciente já cadastrado** fecha o painel.
3. Action única: validar os dois payloads, chamar a criação de paciente e depois a de consulta. Origem de auditoria `agenda-nova-consulta`. CPF duplicado devolve o paciente existente sem insert. Falha da consulta devolve o paciente criado e o erro já usado hoje, incluindo `overlap`.
4. Botão **Cadastrar e marcar** enquanto o painel estiver aberto. Sucesso fecha o diálogo e atualiza a agenda, sem `router.push` para a ficha.
5. Testes da action: paciente e consulta gravados juntos; CPF duplicado não cria linha nova e devolve o id; falha de horário mantém o paciente e não grava a consulta; busca com paciente já escolhido não chama criação.
6. Docs da Fase 2 e da Fase 3 só quando a fatia fechar.
