# Spec · Conversar com o paciente no WhatsApp

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Status**       | draft                                                                 |
| **Data**         | 2026-10-06                                                            |
| **Slug**         | conversar-whatsapp-paciente                                           |
| **Plano origem** | `docs/plans/plano-conversar-whatsapp-paciente.md` (aprovado no chat em 2026-10-06) |
| **Fase**         | Fatia operacional (agenda, ficha, fila e canal já existente). **Não** fecha a Fase 7. |
| **Autonomia**    | medium                                                                |

---

## 1. Contexto

No modal da consulta, na ficha do paciente, na lista do dia e no card da fila, a equipe precisa abrir o WhatsApp daquele paciente no computador em que está. Hoje o ClinRoma só dispara mensagem pelo número pareado da clínica (pós-cirurgia, questionário, oferta da fila). Não há um jeito, nessas quatro telas, de a recepção puxar a conversa no aparelho local.

O ClinRoma continua sem inbox. O clique não envia texto pelo número da clínica. Antes de abrir o chat, o servidor confere duas coisas: a sessão da clínica está em operação, e o canal confirma que aquele número existe no WhatsApp.

O telefone não viaja com a agenda nem com a fila. O botão só indica qual paciente é. O servidor lê os telefones do cadastro na hora do clique, com a mesma regra já usada para escolher o destino de um disparo: o telefone do paciente, se for aproveitável; senão o segundo contato.

**Pré-requisito:** sessão única da clínica, status persistido que o chip do menu já lê, e a regra de destino (telefone do paciente, depois segundo contato) já em uso nos disparos.

---

## 2. Objetivo

1. Admin, dentista ou recepção clica em **Conversar** no modal da consulta, na ficha, na lista do dia e no card da fila.
2. Com a sessão da clínica em operação e o número existente no WhatsApp, o chat abre neste computador, sem procedimento, observação ou nome na conversa.
3. Sessão fora de operação avisa **WhatsApp não está logado.** e para.
4. Número ausente no WhatsApp avisa **Este número não está no WhatsApp.** e para.
5. Visualizador e auxiliar não veem o botão. O servidor recusa os dois mesmo que o clique chegue por outro caminho.

**Valor entregue:** a pessoa que já acompanha o paciente abre a conversa no WhatsApp deste computador, depois de o ClinRoma confirmar que a clínica está logada e que o número existe. Nenhuma mensagem sai pelo número pareado.

---

## 3. Atores

| Ator | Interesse |
| ---- | --------- |
| Administrador | Ver **Conversar** nas quatro superfícies e abrir o chat |
| Recepção | Igual ao administrador no dia a dia |
| Dentista | Ver **Conversar** no modal, na ficha, na lista do dia e no card da fila, mesmo onde só lê o quadro |
| Visualizador | Vê agenda e ficha. Não vê o botão |
| Auxiliar de sala | Não entra nessas telas. Não vê o botão |
| Canal do WhatsApp da clínica | Diz se a sessão segue em operação e se o número existe. Não envia a conversa |
| Paciente | Não usa este botão. O chat abre no aparelho da equipe |

O inbox externo não participa.

---

## 4. Modelo de domínio

### 4.1 O que o clique faz

O clique pede ao servidor para preparar a conversa daquele paciente. O servidor:

1. Exige pessoa autenticada da clínica.
2. Recusa visualizador e auxiliar.
3. Lê os telefones do paciente que essa sessão pode ver.
4. Escolhe o destino.
5. Lê o status já guardado da sessão da clínica (o mesmo que o chip do menu usa).
6. Se a sessão não está em operação, devolve o aviso e não pergunta ao canal se o número existe.
7. Se está em operação, pergunta ao canal se o número existe.
8. Só com confirmação explícita devolve o endereço do chat.

Sucesso devolve só esse endereço. A tela abre o WhatsApp neste computador. A chave do canal permanece no servidor.

### 4.2 Destino

| Situação | Destino |
| -------- | ------- |
| Telefone do cadastro aproveitável | Esse número |
| Cadastro sem telefone aproveitável e segundo contato aproveitável | O segundo contato |
| Nenhum dos dois aproveitável | Não há destino. O clique para com o pedido de cadastro |

Aproveitável segue a regra já fechada dos disparos: dez ou onze dígitos (o país 55 entra na hora) ou doze ou treze dígitos já começando por 55. O endereço do chat usa esses dígitos, com o 55. Sem texto junto.

Não há marca de "este número tem WhatsApp". Mãe ou responsável pode ser o destino quando o segundo contato é o escolhido.

### 4.3 As duas conferências

| Conferência | Quando | Se falhar |
| ----------- | ------ | --------- |
| Sessão da clínica em operação | Sempre, antes de falar com o canal | **WhatsApp não está logado.** O canal não é consultado |
| O número existe no WhatsApp | Só com a sessão em operação | **Este número não está no WhatsApp.** O chat não abre |

A primeira leitura é o status guardado, não uma pergunta ao vivo na montagem da tela. Se esse status diz que está em operação e, na consulta, o canal responde que a sessão parou, a tela usa **WhatsApp não está logado.** O número do paciente não é acusado.

Só a confirmação explícita de que o número existe libera o endereço. Corpo inesperado, resposta ruim ou tempo esgotado é falha de canal, não "número ausente".

A consulta espera no máximo 15 segundos. O registro do clique, se houver, mostra o destino mascarado.

### 4.4 O que abre neste computador

O endereço é o chat público daquele número, neste computador. Procedimento, observação e nome ficam no ClinRoma.

A sessão da clínica serve para saber se está logada e se o número existe. A conversa sai da conta de WhatsApp que estiver aberta neste computador. Se esse aparelho não for o número da clínica, a mensagem não sai pelo número pareado.

### 4.5 O botão

Um único botão, rótulo **Conversar**, alvo de toque de 44 px. Enquanto a resposta não volta, um segundo clique não dispara outra consulta. Um aviso por clique. O botão recebe só qual paciente é e se aquele papel pode abrir.

O botão continua visível mesmo sem telefone aproveitável. Quem decide é o servidor, no clique.

### 4.6 O que esta fatia não grava

Não grava auditoria do clique. Não grava mensagem de paciente. Não entra na rotina que dispara lembretes, ofertas ou pós-cirurgia. Não cria regra nova de acesso no banco. Não usa credencial de serviço.

O contrato de disparo (um destino e um texto, pelo número da clínica) permanece o de hoje.

---

## 5. Matriz de acesso

Quem vê o botão é quem já pode ler o status da sessão da clínica: administrador, dentista e recepção. Na fila, o dentista só lê o quadro; o botão não exige permissão de escrever no card.

| Superfície | Admin | Recepção | Dentista | Visualizador | Auxiliar |
| ---------- | :---: | :------: | :------: | :----------: | :------: |
| Modal da consulta | Sim | Sim | Sim | Não | Não entra |
| Ficha do paciente | Sim | Sim | Sim | Não | Não entra |
| Lista do dia (e a lista quando a agenda está em intervalo) | Sim | Sim | Sim | Não | Não entra |
| Card da fila | Sim | Sim | Sim | Não | Não entra |

O visualizador continua vendo agenda e ficha, sem o botão. O auxiliar continua fora dessas telas.

O chip **WhatsApp ligado / desligado** do menu não muda: segue só para quem gerencia o pareamento. O dentista não ganha chip nem tela de pareamento por causa deste botão.

Se o papel não pode abrir, o servidor recusa e não consulta o canal.

---

## 6. Escopo funcional

### 6.1 Modal da consulta

O botão aparece para quem lê a agenda, dentista inclusive. O clique não altera horário, status nem observação da consulta.

### 6.2 Ficha do paciente

O botão fica no resumo do paciente, no mesmo lugar em que a ficha já mostra quem é a pessoa. A ficha decide se o papel pode abrir, com a mesma permissão de ler o status da sessão.

### 6.3 Lista do dia

O botão fica em cada consulta do dia. O item da lista continua abrindo o modal da consulta. O clique em **Conversar** não sobe para esse item: a recepção não abre o detalhe junto com o WhatsApp.

A agenda em intervalo mostra a mesma lista. A permissão desce por ali. O botão aparece nos dois modos.

A lista não recebe o telefone. Só o identificador do paciente.

### 6.4 Card da fila

O botão fica no card, para quem lê o quadro, dentista inclusive. Mover o card, oferecer horário e responder ao link do paciente continuam como hoje. O card não recebe o telefone.

### 6.5 Aviso na tela

| Resultado | O que a pessoa vê |
| --------- | ----------------- |
| Chat liberado, telefone do próprio paciente | O WhatsApp abre. Sem aviso extra de sucesso |
| Chat liberado, segundo contato | **Abrindo conversa com o segundo contato.** e o WhatsApp abre |
| Sessão fora de operação, ou o canal diz que a sessão parou | **WhatsApp não está logado.** |
| Canal confirma que o número não existe | **Este número não está no WhatsApp.** |
| Sem telefone aproveitável | **Cadastre o telefone do paciente ou um segundo contato.** |
| Canal não respondeu, resposta ruim ou tempo esgotado | **Não foi possível falar com o WhatsApp da clínica. Tente de novo em instantes.** |
| Papel sem permissão | Recusa no servidor, sem consultar o canal. O botão não está na tela |

Copy em pt-BR, sem travessão.

---

## 7. Fora de escopo

- Card **Consultas de hoje** na Hoje e a lista geral de pacientes.
- Mensagem pré-preenchida, histórico, inbox e o produto de conversa externo.
- Disparo pelo número da clínica: pós-cirurgia, questionário, oferta da fila e qualquer envio já existente.
- Auditoria do clique.
- Mudança de banco, regra nova de acesso, credencial de serviço.
- Visualizador e auxiliar como público do botão.
- Fechar a Fase 7.
- Pareamento, QR, desconectar e os jobs que já disparam mensagem.

---

## 8. Caminhos felizes

### 8.1 Modal da consulta

1. A recepção abre uma consulta de um paciente com telefone de cadastro aproveitável.
2. A sessão da clínica está em operação.
3. Clica em **Conversar**. O botão espera e não aceita outro clique.
4. O canal confirma que o número existe.
5. O WhatsApp abre neste computador, sem texto clínico.

### 8.2 Ficha

1. O administrador abre a ficha do mesmo paciente.
2. **Conversar** está no resumo.
3. O clique segue as mesmas duas conferências e abre o mesmo chat.

### 8.3 Lista do dia

1. O dentista está na lista do dia.
2. Clica em **Conversar** numa consulta.
3. O modal daquela consulta não abre.
4. Com sessão em operação e número existente, o chat abre.

### 8.4 Agenda em intervalo

1. A recepção muda a agenda para um intervalo de datas.
2. A lista desse intervalo mostra **Conversar** nas consultas, com a mesma regra da lista do dia.

### 8.5 Card da fila

1. O dentista lê o quadro, sem permissão de mover o card.
2. Vê **Conversar** no card.
3. O clique abre o chat do paciente, sem exigir escrita na fila.

### 8.6 Segundo contato

1. O paciente não tem telefone aproveitável no cadastro e tem segundo contato aproveitável.
2. A sessão está em operação e o canal confirma o número.
3. A tela avisa **Abrindo conversa com o segundo contato.** e abre o chat desse número.

---

## 9. Erros e bordas

| Situação | Comportamento |
| -------- | ------------- |
| Sessão guardada fora de operação | **WhatsApp não está logado.** O canal não é consultado |
| Status guardado em operação, mas o canal responde que a sessão parou | **WhatsApp não está logado.** O número não é tratado como inexistente |
| Canal confirma que o número não existe | **Este número não está no WhatsApp.** O chat não abre |
| Resposta ruim, corpo sem confirmação explícita, rede ou 15 s estourados | **Não foi possível falar com o WhatsApp da clínica. Tente de novo em instantes.** |
| Sem telefone aproveitável | Botão visível. Aviso **Cadastre o telefone do paciente ou um segundo contato.** O canal não é consultado |
| Telefone fixo de dez dígitos | Passa como destino. Se o canal disser que não existe, o aviso de número ausente está certo |
| Segundo clique enquanto espera | Ignorado |
| Clique em **Conversar** na lista | Não abre o modal da consulta |
| Visualizador na agenda ou na ficha | Sem botão. Se o pedido chegar ao servidor, recusa sem consultar o canal |
| Auxiliar | Não entra nessas telas. Pedido ao servidor recusado, sem consulta ao canal |
| Pessoa sem sessão, ou paciente que essa sessão não pode ler | O clique para. O canal não é consultado |
| Este computador logado em outro WhatsApp | A conferência usa a sessão da clínica. A conversa abre na conta deste computador |
| Papel que só lê a fila | Dentista vê o botão. Mover card e ofertar horário não mudam |

---

## 10. Critérios de Done

- [ ] **Conversar** aparece no modal da consulta, na ficha, na lista do dia (inclusive no intervalo) e no card da fila para admin, dentista e recepção.
- [ ] Visualizador e auxiliar não veem o botão. O servidor recusa os dois e não consulta o canal.
- [ ] Na fila, o dentista vê o botão sem permissão de escrever no card.
- [ ] Sessão fora de operação mostra **WhatsApp não está logado.** e não consulta o canal.
- [ ] Número ausente mostra **Este número não está no WhatsApp.**
- [ ] As duas conferências ok abrem o chat neste computador, sem texto clínico. Se o destino for o segundo contato, o aviso é **Abrindo conversa com o segundo contato.**
- [ ] Sem telefone aproveitável, o aviso pede o cadastro e o canal não é consultado.
- [ ] Falha de canal, corpo inesperado ou tempo esgotado usa o aviso de não foi possível falar com o WhatsApp da clínica. Não acusa o número.
- [ ] Erro de sessão vindo do canal, com status guardado em operação, mostra **WhatsApp não está logado.**
- [ ] O clique na lista não abre o modal. Um segundo clique durante a espera não dispara outra consulta. Alvo de toque de 44 px.
- [ ] Agenda e fila continuam sem levar o telefone. O botão só indica o paciente.
- [ ] Nenhum disparo pelo número da clínica. O contrato de envio permanece o de hoje. Sem auditoria do clique, sem mudança de banco, sem credencial de serviço.
- [ ] Testes: endereço sem texto clínico; só confirmação explícita de existência libera o chat; consulta ao canal cobre existe, não existe, resposta ruim e tempo esgotado; papel recusado não consulta o canal.
- [ ] Uma nota em `docs/SECURITY.md`: o clique não dispara mensagem; a chave continua no servidor; o registro mascara o destino.
- [ ] Copy pt-BR, sem travessão, com os textos do §6.5.
- [ ] Nenhum arquivo fora do §11.
- [ ] `npm run lint` nos arquivos tocados, `npm run build` e `npm run test` passam.
- [ ] Homologação manual com a sessão da clínica logada, um número que existe no WhatsApp e outro que não existe, nas quatro superfícies.
- [ ] Ao fechar a fatia: registrar em `docs/implementation/`, capítulo curto em `docs/manual-dev/` e pendência de homologação em `docs/state/PENDENCIAS.md`, sem fechar a Fase 7.

---

## 11. Escopo de arquivos permitidos

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/whatsapp/domain/chat-link.ts` | Endereço do chat e textos fixos |
| `src/features/whatsapp/domain/chat-link.test.ts` | Endereço sem texto clínico, confirmação de existência, textos |
| `src/features/whatsapp/lib/check-whatsapp-number.ts` | Pergunta ao canal se o número existe. Tempo máximo de 15 s. Destino mascarado no registro |
| `src/features/whatsapp/lib/check-whatsapp-number.test.ts` | Existe, não existe, resposta ruim, tempo esgotado |
| `src/features/whatsapp/open-patient-chat-action.ts` | Clique autenticado. Recusa visualizador e auxiliar. Não mistura com parear, QR ou desconectar |
| `src/features/whatsapp/open-patient-chat-action.test.ts` | Papel recusado não consulta o canal |
| `src/features/whatsapp/components/patient-whatsapp-chat-button.tsx` | Botão único: espera, um aviso, abre o chat |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/agenda/components/appointment-detail.tsx` | Botão no modal da consulta |
| `src/features/agenda/components/agenda-day-list.tsx` | Botão na lista do dia, sem abrir o modal |
| `src/features/agenda/components/agenda-range-list.tsx` | A lista do intervalo repassa a permissão |
| `src/features/agenda/components/agenda-view.tsx` | A permissão desce até a lista |
| `src/features/patients/components/patient-summary.tsx` | Botão no resumo da ficha |
| `src/features/records/components/patient-chart.tsx` | A ficha decide se o papel pode abrir |
| `src/features/waitlist/components/waitlist-card.tsx` | Botão no card, também para quem só lê |
| `src/app/(app)/agenda/page.tsx` | Repassa se o papel pode abrir |
| `src/app/(app)/fila/page.tsx` | Repassa se o papel pode abrir |
| `docs/SECURITY.md` | Uma nota na seção de disparo |

No fechamento da fatia, somente estes documentos vivos:

| Arquivo | Motivo |
| ------- | ------ |
| `docs/implementation/` (registro desta fatia e o índice) | O que foi entregue |
| `docs/manual-dev/` (capítulo curto e o índice) | Como a equipe abre a conversa |
| `docs/state/PENDENCIAS.md` | Homologação que ainda depender de pessoa |

### Proibido nesta feature

- Alterar o contrato de `src/lib/whatsapp/send-whatsapp.ts`.
- Coluna de telefone nas leituras da agenda ou da fila.
- Card de consultas na Hoje, lista geral de pacientes, pareamento, QR, jobs de disparo.
- Mensagem pré-preenchida, inbox, auditoria do clique.
- Migration, `.env`, `.env.example`, credencial de serviço, regra nova de acesso.
- `docs/PLANO.md` e specs de outras fatias.

**Branch sugerida (após aprovação):** `feature/conversar-whatsapp-paciente`.

---

## 12. Decisões fechadas

| # | Decisão |
| - | ------- |
| 1 | O chat abre neste computador. A sessão da clínica só diz se está logada e se o número existe |
| 2 | O endereço não leva procedimento, observação nem nome |
| 3 | O botão é de admin, dentista e recepção. Na fila, leitura basta |
| 4 | Sem telefone aproveitável, o botão continua visível e o aviso pede o cadastro |
| 5 | A pergunta "o número existe?" é leitura. Não grava mensagem e não entra na rotina de disparo |
| 6 | Telefone do cadastro primeiro; segundo contato só se o cadastro não servir. Mesma regra dos disparos |
| 7 | Agenda e fila não carregam o telefone. O clique só diz qual paciente é |
| 8 | Status guardado fora de operação não consulta o canal. Erro de sessão na consulta vira **WhatsApp não está logado.** |
| 9 | Sem confirmação explícita de existência, o chat não abre |
| 10 | Sem auditoria do clique neste corte |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| A resposta do canal não trazer uma confirmação clara | Só confirmação explícita abre o chat. O resto é falha de canal (§9) |
| O status guardado estar atrasado | Se o canal disser que a sessão parou, a tela avisa que o WhatsApp não está logado, sem acusar o número |
| Cada clique esperar o canal | Teto de 15 s. O botão fica em espera e ignora o segundo clique |
| O navegador bloquear a janela porque ela abre depois da espera | O chat precisa abrir a partir do mesmo clique |
| Este computador estar em outro WhatsApp | Premissa fechada (§12.1). A conferência não troca a conta local |
| O destino ser mãe ou responsável | O aviso de sucesso diz quando a origem é o segundo contato |
| O clique na lista abrir o modal junto | O botão impede o clique de subir (§6.3) |
| Telefone fixo passar na regra de destino | Se o canal negar o número, o aviso de ausência está certo |

---

## 14. Referências

- Plano aprovado: `docs/plans/plano-conversar-whatsapp-paciente.md`
- Destino já usado nos disparos: `src/features/records/domain/whatsapp-destination.ts`
- Quem lê o status da sessão: `src/features/whatsapp/permissions.ts`
- Status que o chip já lê: `src/features/whatsapp/queries.ts`
- Spec do pareamento (não reabrir): `specs/2026-08-29-tela-qr-whatsapp.md`
- Segurança do disparo: `docs/SECURITY.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Status atual:** `draft`.

A implementação começa somente depois da aprovação explícita desta spec no chat. A branch sugerida é `feature/conversar-whatsapp-paciente`.
