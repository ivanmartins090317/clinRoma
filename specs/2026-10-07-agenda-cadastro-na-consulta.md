# Spec · Cadastro de paciente na nova consulta

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Status**       | draft                                                                 |
| **Data**         | 2026-10-07                                                            |
| **Slug**         | agenda-cadastro-na-consulta                                           |
| **Plano origem** | `docs/plans/plano-agenda-cadastro-na-consulta.md` (aprovado no chat em 2026-10-07) |
| **Fase**         | Fatia da agenda e do cadastro. Atualiza os docs da Fase 2 e da Fase 3 ao fechar. **Não** reabre as fases. |
| **Autonomia**    | medium                                                                |

---

## 1. Contexto

Na Clínica Neo Roma, a recepção marca a consulta a partir do horário. Ela pesquisa o nome ali mesmo. Quando a pessoa ainda não existe, hoje precisa sair da agenda, abrir **Novo paciente**, preencher o cadastro com o consentimento, ir até a ficha e voltar para achar o vão de novo.

O cadastro que já existe permanece. Nome, consentimento e nome da assinatura continuam obrigatórios. Nascimento, CPF, telefone, e-mail e segundo telefone continuam opcionais, com as mesmas regras. A lista de pacientes e a ficha não mudam de caminho.

O que muda é o lugar: o atalho e o painel ficam dentro de **Nova consulta**, com o dentista e o horário que ela já escolheu.

**Pré-requisito:** a agenda já abre **Nova consulta** pelo vão livre no desktop e pelo botão **Nova consulta** no celular. A busca já lista pacientes a partir de dois caracteres, por nome ou CPF. A consulta só grava com um paciente já escolhido. O aviso **Marcar as duas** da medicação já existe e continua valendo para o horário.

---

## 2. Objetivo

1. Com três caracteres ou mais e ninguém escolhido, a busca de **Nova consulta** mostra **+ Novo paciente: {nome digitado}**.
2. O clique abre, no mesmo diálogo, os mesmos dados de **Novo paciente**, com o nome preenchido e o horário intacto.
3. **Cadastrar e marcar** grava a pessoa e a consulta nesse horário, fecha o diálogo e mostra o bloco na agenda. Não abre a ficha.
4. CPF já usado não cria outra pessoa. A recepção usa quem já existe e o próximo **Salvar** grava só a consulta.
5. Se a pessoa for gravada e o horário falhar, ela permanece, o painel fecha, ela fica escolhida e o diálogo segue aberto com o erro ou com o aviso **Marcar as duas**. A confirmação desse aviso grava só a consulta.
6. Escolher alguém que já existe continua só em **Salvar**. A edição de consulta não oferece o atalho.

**Valor entregue:** a recepção cadastra e marca sem sair do horário, com o mesmo consentimento de hoje.

---

## 3. Atores

| Ator | Interesse |
| ---- | --------- |
| Administrador | Cadastrar e marcar no diálogo **Nova consulta** |
| Recepção | O mesmo, no dia a dia |
| Dentista | Cadastra pela lista de pacientes. Não marca consulta, então não vê este atalho |
| Visualizador | Vê a agenda. Não marca e não cadastra por aqui |
| Auxiliar de sala | Não entra neste fluxo |

Quem já escreve na agenda é administrador e recepção. Os dois também cadastram paciente. Esta fatia não abre a agenda para outro papel.

---

## 4. Modelo de domínio

### 4.1 Dois modos no mesmo diálogo

**Nova consulta** tem dois modos, só na criação.

No modo busca, o campo lista quem já existe. Com pelo menos três caracteres, sem espaços nas pontas, e ninguém escolhido, aparece o atalho **+ Novo paciente: {texto}**. A busca em si continua a partir de dois caracteres. Com dois caracteres e lista vazia, o texto segue **Nenhum paciente encontrado**, sem atalho.

No modo cadastro, o painel pede os dados da pessoa. Dentista, data, início, fim, situação, procedimento e observação permanecem no diálogo, com as regras de hoje.

**Usar paciente já cadastrado** fecha o painel, limpa o que foi digitado nele e devolve a busca. Nada é gravado nesse retorno.

A edição de uma consulta já marcada fica só na busca de quem já existe. Sem atalho e sem painel.

### 4.2 O que o painel pede

Os campos e as regras são os do cadastro atual:

| Campo | Regra |
| ----- | ----- |
| Nome completo | Obrigatório. Vem preenchido com o texto da busca e pode ser corrigido. No mínimo 3 caracteres, no máximo 200 |
| Data de nascimento | Opcional |
| CPF | Opcional. Quando informado, válido e de uma só pessoa |
| Telefone | Opcional |
| E-mail | Opcional. Quando informado, válido |
| Segundo telefone e observação do contato | Opcionais, com as regras atuais: observação sem telefone não vale; telefone até 40 caracteres; observação até 120 |
| Consentimento | Obrigatório. O texto é o mesmo: o paciente ou responsável autoriza o tratamento dos dados para atendimento e comunicação |
| Nome para assinatura | Obrigatório, no mínimo 2 caracteres |

O histórico do cadastro distingue a origem. Quem entra por **Nova consulta** fica registrado como vindo da agenda. Quem entra pela lista de pacientes continua registrado como vindo da lista. Sem esse cuidado, o cadastro da lista mudaria de origem.

### 4.3 Uma confirmação, duas gravações

**Cadastrar e marcar** só existe com o painel aberto.

Antes de escrever, os dados da pessoa e os dados da consulta são conferidos juntos. Se um dos dois não passa, nada é gravado.

Se os dois passam, a pessoa é gravada primeiro. Em seguida a consulta é gravada para essa pessoa, nesse dentista e nesse horário. Conflito de horário e par de medicação seguem as regras que a agenda já usa.

Quem já escolheu um paciente na busca não passa por esse caminho. **Salvar** grava só a consulta.

O botão fica desabilitado enquanto a gravação não volta. Um segundo toque não grava de novo.

### 4.4 Quando para no meio

| O que falhou | O que permanece |
| ------------ | --------------- |
| Dados da pessoa ou da consulta inválidos antes de gravar | Nada novo. O diálogo continua no modo em que estava, com o erro no campo |
| CPF já cadastrado | Nenhuma pessoa nova. A mensagem é **CPF já cadastrado para {nome}.** O diálogo oferece usar essa pessoa. O próximo **Salvar** grava só a consulta |
| Pessoa gravada e o horário recusado (indisponível, validação ou outra recusa já usada hoje) | A pessoa permanece. O painel fecha. Ela fica escolhida. O diálogo mostra o erro. O próximo **Salvar** tenta só o horário |
| Pessoa gravada e o horário pede **Marcar as duas** | A consulta ainda não foi gravada. O painel fecha. A pessoa fica escolhida. **Marcar as duas** grava só a consulta. **Voltar** deixa a consulta por gravar, com a pessoa já escolhida |

A pessoa gravada não é apagada se o horário falhar. Enquanto o diálogo ainda estivesse no modo cadastro depois dessa gravação, outro **Cadastrar e marcar** criaria outra pessoa com o mesmo nome, sobretudo sem CPF. Por isso, assim que a pessoa existe, o diálogo sai do painel e os salvamentos seguintes gravam só a consulta.

### 4.5 O que não muda na consulta

A regra de quem já está cadastrado permanece. Conflito, par de medicação, calendário, fila, arraste, lembrete e mensagem ao paciente seguem como estão. Marcar a consulta não dispara lembrete nem WhatsApp.

O clique no vão livre continua só no desktop. No celular, **Nova consulta** abre o mesmo diálogo, sem coluna pré-escolhida, e o atalho entra nele. O horário preenchido pelo clique continua sendo o do desktop.

---

## 5. Matriz de acesso

| Ação | Admin | Recepção | Dentista | Visualizador | Auxiliar |
| ---- | :---: | :------: | :------: | :----------: | :------: |
| Ver o atalho e cadastrar marcando | Sim | Sim | Não | Não | Não entra |
| Escolher paciente já existente e salvar a consulta | Sim | Sim | Não | Não | Não entra |
| Cadastrar pela lista de pacientes | Como hoje | Como hoje | Como hoje | Como hoje | Como hoje |
| Editar consulta | Sem atalho | Sem atalho | Não marca | Não marca | Não entra |

Se um pedido de gravação chegar sem permissão de escrita na agenda, o servidor recusa, como já recusa hoje. O atalho não cria um caminho novo de permissão.

---

## 6. Escopo funcional

### 6.1 Atalho na busca

O atalho aparece abaixo dos resultados quando a busca tem três caracteres ou mais e ninguém está escolhido. Se a lista vier vazia, ele substitui **Nenhum paciente encontrado**.

O nome do atalho é o texto do campo, sem espaços nas pontas. Homônimos não se bloqueiam: a lista de parecidos e o atalho aparecem juntos.

Assim que a recepção escolhe alguém da lista, o atalho some. **Salvar** volta a ser o botão da consulta.

### 6.2 Painel

O clique no atalho não troca de página e não abre segunda janela. O painel entra no scroll que o diálogo já tem.

Ordem na criação:

1. Busca, com a lista e o atalho.
2. Painel, só depois do atalho.
3. Dentista, data, início, fim, situação, procedimento e observação, no lugar e na regra de hoje.

O botão principal, com o painel aberto, é **Cadastrar e marcar**. **Usar paciente já cadastrado** volta à busca.

Campos com texto em 16 px. Atalho, **Cadastrar e marcar**, **Usar paciente já cadastrado** e **Salvar** com alvo de toque de 44 px.

### 6.3 Sucesso

A pessoa e a consulta ficam gravadas. O diálogo fecha. O bloco aparece na agenda, no dentista e no horário escolhidos. A ficha não abre. A recepção chega nela depois, pelo paciente ou por **Abrir prontuário**.

### 6.4 Textos

| Situação | O que a pessoa vê |
| -------- | ----------------- |
| Atalho | **+ Novo paciente: {nome digitado}** |
| Lista vazia com menos de 3 caracteres | **Nenhum paciente encontrado** |
| Voltar à busca | **Usar paciente já cadastrado** |
| Gravar os dois | **Cadastrar e marcar** |
| Enquanto grava | **Salvando...** O botão fica desabilitado |
| Nome curto | **Informe o nome completo** |
| Nome longo | **Nome muito longo** |
| Sem consentimento | **Consentimento LGPD é obrigatório** |
| Assinatura curta | **Informe o nome para assinatura do consentimento** |
| CPF inválido | **CPF inválido** |
| CPF repetido | **CPF já cadastrado para {nome}.** Em seguida, a ação de usar essa pessoa |
| E-mail inválido | **E-mail inválido** |
| Observação sem segundo telefone | **Informe o segundo telefone ou deixe a observação em branco.** |
| Segundo telefone longo | **Segundo telefone muito longo.** |
| Observação longa | **Observação muito longa.** |
| Horário recusado | A mensagem que a agenda já mostra, inclusive **Horário indisponível para {dentista}** |
| Par de medicação | O aviso que a agenda já mostra, com **Marcar as duas** e **Voltar** |
| Consulta gravada | O diálogo fecha, como o **Salvar** de hoje. Sem toast de ficha e sem abrir o prontuário |

Copy em pt-BR, sem travessão. O texto do consentimento é o da ficha: autorização para atendimento clínico e comunicação da clínica, com **Li e o paciente concorda com o tratamento dos dados.**

---

## 7. Fora de escopo

- Aba de compromisso ou bloqueio de horário sem paciente.
- Cadastro só com nome e celular, sem consentimento.
- Grade de horários, categoria, como conheceu, múltiplos agendamentos e marcação de primeira consulta.
- Anamnese, odontograma ou evolução neste diálogo.
- Abrir **Novo paciente** ou a ficha ao salvar.
- Clique em horário vazio no calendário do celular.
- Lembrete, WhatsApp, fila, edição de consulta e arraste.
- Coluna nova ou outro tipo de paciente.
- Mudar a regra de conflito, o aviso de medicação ou quem já pode gravar consulta.
- Reabrir ou fechar a Fase 2 ou a Fase 3 inteiras. Os docs das fases só registram esta fatia, ao fechar.

---

## 8. Caminhos felizes

### 8.1 Paciente novo a partir do vão

1. No desktop, a recepção clica num horário livre. **Nova consulta** abre com dentista, data, início e fim daquele clique.
2. Ela digita um nome de pelo menos três caracteres que ninguém tem.
3. No lugar de **Nenhum paciente encontrado**, vê **+ Novo paciente:** seguido do texto.
4. O painel abre com o nome preenchido. Ela corrige o nome se precisar, marca o consentimento, informa a assinatura e, se quiser, nascimento, CPF, telefone, e-mail e segundo telefone.
5. **Cadastrar e marcar** grava a pessoa e a consulta.
6. O diálogo fecha. O bloco entra na coluna. A ficha não abre.

### 8.2 Homônimo

1. A busca acha pessoas parecidas.
2. O atalho continua abaixo da lista.
3. Ela cadastra outra pessoa. As duas permanecem. A consulta fica na recém-gravada.

### 8.3 Paciente que já existe

1. A recepção pesquisa e escolhe o nome na lista.
2. O atalho não fica disponível com alguém escolhido.
3. **Salvar** grava só a consulta. Nenhuma pessoa nova.

### 8.4 Celular

1. Na lista do período, **Nova consulta** abre o mesmo diálogo, sem dentista vindo de um clique.
2. Ela escolhe o dentista, pesquisa, usa o atalho e completa o painel.
3. **Cadastrar e marcar** grava os dois. O diálogo fecha e a consulta aparece na agenda.

### 8.5 CPF já usado

1. No painel, o CPF informado já pertence a outra pessoa.
2. Nada de novo é gravado. Ela vê **CPF já cadastrado para {nome}.**
3. Ela usa essa pessoa. O painel fecha e a pessoa fica escolhida.
4. **Salvar** grava só a consulta no horário do diálogo.

### 8.6 Horário recusado depois do cadastro

1. A pessoa é gravada.
2. O horário está indisponível, ou outra recusa da consulta acontece.
3. A pessoa permanece. O painel fecha. Ela fica escolhida. O diálogo mostra o erro.
4. A recepção ajusta o horário e toca **Salvar**. Só a consulta é gravada.

### 8.7 Medicação depois do cadastro

1. A pessoa é gravada e o horário forma par com outra consulta do mesmo dentista.
2. O aviso **Marcar as duas** abre. A consulta ainda não existe.
3. **Marcar as duas** grava só a consulta, com a regra de medicação que a agenda já tem.
4. **Voltar** não grava a consulta. A pessoa continua escolhida no diálogo.

---

## 9. Erros e bordas

| Situação | Comportamento |
| -------- | ------------- |
| Menos de 3 caracteres | Sem atalho. A busca, a partir de 2, segue como hoje |
| Espaços nas pontas | O nome do atalho e o nome gravado ignoram esses espaços |
| Alguém já escolhido na lista | Sem atalho. **Salvar** grava só a consulta |
| Edição de consulta | Sem atalho, sem painel, sem **Cadastrar e marcar** |
| **Usar paciente já cadastrado** | Fecha o painel, limpa os campos dele e volta à busca. Nada gravado |
| Nome, consentimento, assinatura, CPF, e-mail ou segundo telefone inválidos | Nada gravado. O erro aparece no diálogo. Dentista e horário permanecem |
| CPF repetido | Não cria outra pessoa. Oferece usar quem já tem esse CPF. O **Salvar** seguinte grava só a consulta |
| Pessoa gravada e horário inválido | A pessoa fica. A consulta não. O diálogo segue aberto, com ela escolhida |
| **Marcar as duas** nesse caso | Grava só a consulta. Não cadastra de novo |
| **Voltar** no aviso de medicação | A consulta não grava. A pessoa continua escolhida |
| Segundo toque enquanto grava | Ignorado. O botão fica desabilitado |
| Pedido sem permissão de escrita na agenda | Recusa, como a agenda já recusa |
| Dentista, visualizador ou auxiliar | Não usam este atalho |
| Sucesso | Diálogo fecha na agenda. Sem abrir a ficha e sem disparar lembrete ou WhatsApp |
| Cadastro pela lista de pacientes | Continua na ficha, com a origem de sempre. Esta fatia não muda essa tela |
| Entre a gravação da pessoa e a da consulta, o horário deixa de estar livre | A consulta volta com o erro de horário. A pessoa permanece e o diálogo não cria outra |

---

## 10. Critérios de Done

- [ ] Em **Nova consulta**, com 3 caracteres ou mais e ninguém escolhido, a busca mostra **+ Novo paciente: {nome digitado}** abaixo dos resultados.
- [ ] Com a lista vazia, o atalho substitui **Nenhum paciente encontrado**. Com menos de 3 caracteres, o texto antigo permanece e o atalho não aparece.
- [ ] O clique abre o painel com os campos do cadastro atual, nome preenchido e editável, consentimento e assinatura obrigatórios. Dentista, data, início, fim, situação, procedimento e observação permanecem.
- [ ] **Usar paciente já cadastrado** fecha o painel, limpa os campos e devolve a busca, sem gravar.
- [ ] **Cadastrar e marcar** grava a pessoa e a consulta no horário já escolhido, fecha o diálogo e mostra o bloco na agenda, sem abrir a ficha.
- [ ] Escolher um paciente que já existe continua em **Salvar**, sem passar pelo cadastro junto.
- [ ] CPF repetido não cria outra pessoa, mostra **CPF já cadastrado para {nome}.** e o **Salvar** seguinte grava só a consulta.
- [ ] Se o horário falhar depois da pessoa gravada, ela permanece, o painel fecha, ela fica escolhida e o diálogo mostra o erro. O **Salvar** seguinte tenta só a consulta.
- [ ] No aviso **Marcar as duas**, a confirmação grava só a consulta. **Voltar** não grava a consulta e não cadastra outra pessoa.
- [ ] O botão fica desabilitado enquanto a gravação não volta.
- [ ] A edição de consulta não oferece o atalho nem o painel.
- [ ] O histórico do cadastro pela agenda registra a origem da nova consulta. O cadastro pela lista continua com a origem da lista.
- [ ] Conflito, medicação, calendário, fila, arraste, lembrete e WhatsApp permanecem como estão. O celular usa o mesmo diálogo, sem clique em vão vazio.
- [ ] Copy em pt-BR, sem travessão, com os textos do §6.4. Campos em 16 px. Alvo de toque de 44 px no atalho e nos botões do fluxo.
- [ ] Testes: pessoa e consulta gravadas juntas; CPF duplicado não cria outra pessoa e devolve quem já existe; falha de horário mantém a pessoa e não grava a consulta; paciente já escolhido não passa pelo cadastro junto; a confirmação da medicação não cadastra de novo.
- [ ] `npm run lint` nos arquivos tocados, `npm run build` e `npm run test` passam.
- [ ] Homologação: cadastrar e marcar a partir do vão; homônimo; paciente já existente; CPF repetido; horário recusado depois do cadastro; edição sem atalho; o mesmo diálogo no celular.
- [ ] Nenhum arquivo fora do §11.
- [ ] Ao fechar a fatia: atualizar `docs/implementation/F2-agenda.md`, `docs/implementation/F3-pacientes-prontuario.md`, `docs/manual-dev/04-fase-2-agenda.md`, `docs/manual-dev/05-fase-3-pacientes-prontuario.md`, os índices desses docs e `docs/state/PENDENCIAS.md`.

---

## 11. Escopo de arquivos permitidos

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/agenda/components/appointment-new-patient-panel.tsx` | Painel com os campos do cadastro, dentro de **Nova consulta** |
| `src/features/agenda/create-patient-and-appointment.ts` | Conferir os dois conjuntos, gravar a pessoa e em seguida a consulta |
| `src/features/agenda/create-patient-and-appointment.test.ts` | Os quatro resultados do §4.3 e do §4.4, mais a confirmação que não cadastra de novo |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/agenda/components/patient-combobox.tsx` | Atalho **+ Novo paciente**, só quando a criação pede |
| `src/features/agenda/components/appointment-form.tsx` | Painel, **Cadastrar e marcar** e a troca para a pessoa já gravada quando o horário falha |
| `src/features/patients/actions.ts` | Origem do cadastro, com o valor de sempre na lista de pacientes |

No fechamento da fatia, somente estes documentos vivos:

| Arquivo | Motivo |
| ------- | ------ |
| `docs/implementation/F2-agenda.md` e `docs/implementation/README.md` | O que a agenda passou a fazer |
| `docs/implementation/F3-pacientes-prontuario.md` e `docs/implementation/README.md` | O cadastro também nasce na nova consulta. O índice entra uma vez, junto com o da Fase 2 |
| `docs/manual-dev/04-fase-2-agenda.md` e `docs/manual-dev/README.md` | Como a recepção cadastra no horário |
| `docs/manual-dev/05-fase-3-pacientes-prontuario.md` e `docs/manual-dev/README.md` | O mesmo cadastro, agora também no diálogo. O índice entra uma vez |
| `docs/state/PENDENCIAS.md` | Homologação que ainda depender de pessoa |

### Proibido nesta feature

- A ficha **Novo paciente** e o caminho que leva à ficha ao cadastrar pela lista.
- A gravação da consulta já existente, a regra de conflito e o aviso de medicação, além de chamá-los.
- Calendário, fila, arraste, lembrete e WhatsApp.
- Coluna nova ou migration.
- `.env`, `.env.example` e credencial de serviço.
- `docs/PLANO.md` e specs de outras fatias.
- Qualquer arquivo fora das tabelas acima.

**Branch sugerida (após aprovação):** `feature/agenda-cadastro-na-consulta`.

---

## 12. Decisões fechadas

| # | Decisão |
| - | ------- |
| 1 | O atalho fica na busca de **Nova consulta**, com 3 caracteres ou mais e ninguém escolhido |
| 2 | O painel repete os campos e as regras do cadastro atual, inclusive o consentimento |
| 3 | **Cadastrar e marcar** grava a pessoa e depois a consulta. Quem já escolheu alguém grava só a consulta |
| 4 | CPF repetido não cria outra pessoa. O próximo **Salvar** grava só a consulta |
| 5 | Pessoa gravada não é apagada se o horário falhar. O diálogo sai do painel e os salvamentos seguintes gravam só a consulta |
| 6 | **Marcar as duas**, nesse caso, não cadastra de novo |
| 7 | A edição não oferece o atalho |
| 8 | O cadastro pela lista conserva a origem de sempre. O da agenda registra que veio da nova consulta |
| 9 | O fim do fluxo é o bloco na agenda, sem abrir a ficha |
| 10 | Os docs da Fase 2 e da Fase 3 entram ao fechar a fatia |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Um segundo **Cadastrar e marcar**, depois da pessoa gravada e com a consulta recusada, cria outra pessoa com o mesmo nome | Ao existir a pessoa, o diálogo sai do painel. O botão fica desabilitado enquanto grava (§4.4) |
| A confirmação **Marcar as duas** cadastra a pessoa outra vez | Essa confirmação grava só a consulta (§4.4, §8.7) |
| O cadastro pela lista passar a constar como vindo da agenda | A origem nova só vale quando o diálogo pede. A lista conserva a origem de sempre (§4.2) |
| O painel e a ficha divergirem quando um campo novo entrar em um só deles | Os dois usam as mesmas regras do cadastro atual. A ficha não muda nesta fatia (§4.2, §11) |
| O diálogo ficar alto demais no celular | O painel entra no scroll que o diálogo já tem. Não abre segunda janela (§6.2) |

---

## 14. Referências

- Plano aprovado: `docs/plans/plano-agenda-cadastro-na-consulta.md`
- Research de origem: `docs/plans/research-agenda-cadastro-na-consulta.md`
- Agenda já entregue: `docs/implementation/F2-agenda.md` e `docs/manual-dev/04-fase-2-agenda.md`
- Cadastro já entregue: `docs/implementation/F3-pacientes-prontuario.md` e `docs/manual-dev/05-fase-3-pacientes-prontuario.md`
- Par de medicação, que este fluxo reutiliza: `specs/2026-10-06-agenda-encaixe-medicacao.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Status atual:** `draft`.

A implementação começa somente depois da aprovação explícita desta spec no chat. A branch sugerida é `feature/agenda-cadastro-na-consulta`.
