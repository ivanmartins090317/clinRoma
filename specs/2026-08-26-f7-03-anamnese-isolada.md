# Spec · F7-03 · Anamnese isolada e questionário papel

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-26                                         |
| **Slug**         | f7-03-anamnese-isolada                             |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 4                 |
| **Fase**         | 7 de `docs/PLANO.md`                               |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`   |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)                  |

---

## 1. Contexto

A Fase 3 entregou anamnese **versionada** na ficha, com formulário de **texto livre** (saúde geral, alergias, medicamentos, condições, hábitos) e assinatura (confirmação + nome). Esse formulário **não** é o questionário que o Felipe usa no papel.

Na demo de 2026-08-25 ele pediu: (1) o questionário **igual ao papel** (Sim/Não, doenças, bloco para mulheres, declaração); (2) o paciente preencher **em casa pelo link** ou **no tablet do consultório**, **sem** ver menu, agenda, estoque nem o restante do prontuário.

Hoje a equipe preenche texto livre na aba da ficha. O paciente não tem superfície própria. Sem o papel digital e sem o isolamento, a anamnese continua diferente da clínica real e o tablet com sessão da equipe vaza o sistema.

Esta spec cobre **apenas F7-03**. Não inclui WhatsApp, pós-cirurgia, e-mail financeiro, busca, odontograma cruz, segundo telefone nem redesenho do card.

**Pré-requisito:** prontuário da Fase 3 no `main` (anamnese versionada, validade 12 meses, aba na ficha). F7-09 (recorte no card) pode já estar na branch: esta fatia **grava** a versão papel de um jeito que o recorte já previsto continue a ler; **não** redesenha o card.

**Fonte da verdade do conteúdo:** fotos `docs/assets/anamnese-questionario-p1.png` e `docs/assets/anamnese-questionario-p2.png`, copiadas letra a letra no apêndice. Não resumir, não inventar pergunta.

---

## 2. Objetivo

Substituir o preenchimento **novo** pelo **questionário papel** (versão 2) e oferecer **dois modos isolados** para o paciente responder: **pré-consulta** (link) e **consultório** (tablet do dia), ambos **sem o menu da clínica**.

A equipe continua vendo o histórico na aba Anamnese da ficha. Versões antigas de texto livre **permanecem consultáveis**. Conteúdo antigo **não** é reescrito.

**Valor entregue:** o paciente preenche o mesmo questionário do papel, em casa ou no tablet, sem enxergar o resto do sistema; o dentista lê a versão vigente na ficha.

---

## 3. Atores

| Ator             | Interesse |
| ---------------- | --------- |
| Paciente         | Preencher o questionário no celular (casa) ou no tablet (consultório), só essa tela |
| Recepção         | Gerar o convite pré-consulta, abrir o convite no tablet, e também preencher na ficha se o paciente estiver no balcão |
| Dentista         | Ler histórico; gerar convite; preencher na ficha quando atender |
| Administrador    | Mesmas ações da equipe clínica, para suporte |
| Visualizador     | Sem conteúdo clínico; **não** vê anamnese nem gera convite |
| Auxiliar de sala | Sem módulo de pacientes; fora desta feature |
| Parente          | Pode abrir o link se a recepção encaminhar; não tem tela própria |

---

## 4. Modelo de domínio

### 4.1 Versão do questionário

Cada anamnese gravada carrega a **versão do questionário** usada naquele envio.

| Versão | O que é | Uso daqui em diante |
| ------ | ------- | ------------------- |
| **1** (texto livre) | Formulário atual da Fase 3 | Só **leitura** no histórico. Nenhum envio novo. Conteúdo **não** migra. |
| **2** (papel) | Questionário do apêndice | **Única** versão aceita em envio novo, na ficha e no convite |

A versão vigente continua sendo a anamnese **mais recente** daquele paciente (pela data da declaração; se faltar, pela data de registro). Validade **12 meses** (regra já existente) **não muda**.

### 4.2 O que é um convite

Um **convite de anamnese** liga **um paciente** a **um preenchimento isolado**.

| Finalidade | Quem usa | Validade |
| ---------- | -------- | -------- |
| **Pré-consulta** | Paciente no próprio celular, a partir do link que a equipe copiou | **7 dias** a partir da geração |
| **Consultório** | Paciente no tablet da clínica, no dia do atendimento | Até **o fim do dia** da clínica (fuso `America/Sao_Paulo`, meia-noite local) |

Regras:

- O **segredo do convite** aparece **somente** no link entregue. O sistema guarda só a **impressão digital** do segredo, nunca o valor em claro.
- O link é **opaco** (não sequencial, não contém nome, documento nem identificador previsível do paciente).
- **No máximo um convite aberto** (ainda não usado e ainda na validade) **por paciente e por finalidade**. Gerar de novo **invalida** o anterior daquela finalidade: evita dois links vivos, dois envios e versões duplicadas. O de outra finalidade não se mistura: pode existir um pré-consulta e um de consultório ao mesmo tempo.
- Após um envio **bem-sucedido**, o convite fica **usado** e não serve para outro envio.
- O tablet **nunca** usa a sessão da equipe. O paciente não autentica. Quem tem o link válido preenche.

### 4.3 Superfícies

| Superfície | O que aparece | O que não aparece |
| ---------- | ------------- | ----------------- |
| **Página do convite** | Cabeçalho profissional, título do questionário, **nome completo** do paciente (só leitura), o questionário, consentimento, declaração | Menu da clínica, agenda, estoque, fila, outras abas, cadastro além do nome, CPF, telefone, odontograma, evoluções, histórico de respostas anteriores |
| **Aba Anamnese da ficha** | Histórico (v1 e v2), alerta de 12 meses, questionário papel para nova versão, ações de gerar convite | O paciente não usa esta tela |

A página do convite **não** usa o envoltório autenticado da clínica (sem menu, sem nome da equipe logada).

### 4.4 Questionário papel (comportamento)

O conteúdo letra a letra está no **apêndice**. Comportamento:

**Pergunta Sim/Não**

- Duas marcas **Sim** e **Não**, como no papel (não um único interruptor).
- São **exclusivas**: marcar uma desmarca a outra.
- No envio, **uma das duas** é obrigatória.

**Complemento** (`Por quê?`, `Qual(is)?`, `Se sim, qual(is)?`)

- Só nas perguntas do apêndice que têm complemento.
- Na tela, o campo **abre ao marcar Sim** (no papel as três primeiras já trazem a linha; na tela isso evita lixo).
- Se a resposta for **Sim**, o complemento é **obrigatório** (depois de remover espaços nas pontas).
- Se a resposta for **Não**, o complemento **não** é gravado (mesmo que tenha sido digitado antes de trocar).

**Já foi acometido de alguma dessas doenças?**

- Lista de marcas (pode marcar **várias**).
- **Não** é Sim/Não por doença.
- Nenhuma marcada é **válido**.
- Campo de texto **outra doença, condição ou problema** fica sempre visível e é opcional.

**Sexo** (só para aplicar o bloco do papel; **não** é pergunta do questionário impresso)

- No preenchimento (ficha e convite), **Sexo** é obrigatório: **Feminino** ou **Masculino**.
- **Não** entra no cadastro do paciente nesta fatia.
- Identificador estável: `sex` (`female` | `male`).

**Apenas para mulheres** (menopausa, osteoporose/família, grávida)

| Sexo informado | Bloco | As três perguntas |
| -------------- | ----- | ----------------- |
| **Feminino** | visível | Sim/Não obrigatório; entram no conteúdo gravado |
| **Masculino** | **oculto** | não aparecem; **não** são gravadas |
| Ausente (não deve ocorrer no envio válido) | visível (falha segura, como o papel que sempre imprime) | Sim/Não obrigatório |

Trocar de Feminino para Masculino **esconde** o bloco e **descarta** respostas já marcadas nesse bloco (não grava lixo).

**Declaração**

- Texto **exato**: *Atesto serem verdadeiras as informações supracitadas a respeito do Questionário para Paciente.*
- Confirmação explícita + **nome digitado** (mínimo 2 caracteres, espaços nas pontas removidos), como a assinatura da Fase 3.

### 4.5 Cabeçalho da página do convite

Nesta ordem, visível no celular:

1. Dr. Fellipe S. Roma
2. Cirurgião-Dentista
3. Especialista em Cirurgia e Traumatologia Buco-Maxilo-Facial
4. Título **QUESTIONÁRIO PARA O PACIENTE**
5. Nome do paciente (somente leitura)

Na aba da ficha o cabeçalho profissional **pode** ser mais curto (a equipe já está no prontuário); o questionário, as regras e a declaração são os mesmos.

### 4.6 Consentimento na página do convite

Antes de enviar, o paciente marca um consentimento visível (LGPD): tratamento dos dados de saúde deste questionário pela clínica. Sem a marca, o envio **não** conclui.

Na ficha, a equipe já opera com o consentimento de cadastro da Fase 3; o envio da equipe exige a **declaração** do questionário, não um segundo bloco LGPD nesta fatia.

### 4.7 Se já existe anamnese vigente

| Superfície | Comportamento |
| ---------- | ------------- |
| **Página do convite** | Informa a **data** da vigente (“Você já preencheu em dd/mm/aaaa”) e oferece preencher de novo. **Não** mostra respostas anteriores (mínimo de dado de saúde na tela pública). |
| **Aba da ficha** | Histórico completo. Resumo da vigente (como hoje) + nova versão pelo questionário papel. |

Preencher de novo cria **nova versão**. A anterior permanece no histórico.

### 4.8 O que o envio grava

Uma **nova versão imutável**, como na Fase 3, com:

- versão do questionário **2**;
- sexo informado no preenchimento;
- cada resposta Sim/Não dos blocos visíveis;
- doenças marcadas (identificadores estáveis do apêndice);
- texto de outra doença, se houver;
- complementos só das perguntas Sim que os têm;
- bloco para mulheres **somente** se o sexo for feminino (ou ausente, falha segura);
- texto da declaração, nome, confirmação, data e hora;
- origem: **equipe na ficha** ou **paciente pelo convite** (finalidade pré-consulta ou consultório).

O recorte do card (F7-09) já espera esta versão papel: doenças marcadas, medicamento e alergia quando Sim, e até cinco Sim relevantes na ordem já definida naquela spec. Esta fatia **não** muda o card; só grava conteúdo que aquela leitura já compreende.

### 4.9 Identificadores das perguntas

Os identificadores do apêndice são o contrato com o recorte do card. **Não** renomear. Em especial o card já lê: `taking_medication`, `has_allergy`, `pregnant` e a lista `disease_*` do apêndice. `sex` e o bloco 6 só entram no card se existirem no conteúdo (masculino: `pregnant` ausente, logo não aparece nos Sim relevantes).

---

## 5. Matriz de acesso

| Ação                                              | admin | dentist | reception | viewer | auxiliar | paciente (com convite válido) |
| ------------------------------------------------- | :---: | :-----: | :-------: | :----: | :------: | :---------------------------: |
| Ver histórico de anamnese na ficha                |  Sim  |   Sim   |    Sim    |  Não   |   Não    | Não                           |
| Preencher nova versão na ficha                    |  Sim  |   Sim   |    Sim    |  Não   |   Não    | Não                           |
| Gerar convite pré-consulta ou de consultório      |  Sim  |   Sim   |    Sim    |  Não   |   Não    | Não                           |
| Copiar o link do convite                          |  Sim  |   Sim   |    Sim    |  Não   |   Não    | Não                           |
| Abrir a página do convite e enviar o questionário |  Não* |  Não*   |   Não*    |  Não   |   Não    | **Sim**                       |
| Ver menu, agenda, estoque ou outras abas no convite | Não |  Não    |    Não    |  Não   |   Não    | Não                           |

**\*** A equipe **não** preenche pela página do convite usando a sessão logada. Se abrir o link num aparelho da clínica, é o **paciente** quem responde, sem login.

A recusa vale na interface **e** no servidor. Falha segura: papel sem permissão não gera convite nem lê histórico. Convite inválido não revela se o paciente existe.

Auditoria:

- Gerar convite: escrita (sem o segredo em claro, sem corpo do questionário).
- Envio pela ficha: escrita de anamnese (já existe na F3), sem corpo no registro.
- Envio pelo convite: escrita de anamnese com origem “convite”; metadados: finalidade, paciente, **sem** respostas, **sem** IP em claro (só impressão digital se precisar limitar tentativas).
- Abrir a página do convite **não** gera auditoria de leitura do prontuário completo.

---

## 6. Escopo funcional

### 6.1 Aba Anamnese na ficha

Quando a equipe com escrita clínica abre a aba:

- o formulário **novo** é o questionário papel (versão 2), não o texto livre;
- o histórico lista versões antigas: v1 como hoje (prévia de texto); v2 com prévia curta (ex.: doenças marcadas e data), sem despejar o formulário inteiro na lista;
- ao abrir uma versão v2 no histórico, a equipe **lê** as respostas no formato Sim/Não (e complementos), sem editar aquela versão;
- permanecem o alerta de mais de 12 meses e o botão de salvar nova versão.

Ações novas na aba (alvos ≥ 44 px, usável no celular):

- **Gerar link pré-consulta**: cria o convite, mostra o link copiável e a validade (7 dias). Texto no sentido de: copie e envie ao paciente. **Não** dispara WhatsApp nesta fatia.
- **Abrir no tablet**: cria o convite de consultório e mostra o link (validade: hoje). A equipe cola ou abre no tablet **sem** entrar com a própria conta nesse aparelho.

Se já existir convite aberto daquela finalidade, gerar de novo substitui e avisa que o link anterior deixa de valer.

### 6.2 Página do convite

Estados:

| Estado | Tela |
| ------ | ---- |
| **Válido** | Cabeçalho §4.5, questionário, consentimento, declaração, enviar |
| **Válido com vigente** | Igual ao válido, mais a data da vigente e o convite a preencher de novo |
| **Inválido, expirado ou já usado** | Uma **única** mensagem genérica. Sem distinguir o motivo. Sem nome do paciente. Sem formulário |

Não exibir o segredo do convite na tela. Fonte 16 px nos campos. Marcas Sim/Não e botão enviar com alvo confortável no celular. Área segura (entalhe / home indicator).

### 6.3 Enviar (ficha ou convite)

1. Validar regras §4.4 (e consentimento no convite).
2. Gravar nova versão imutável (versão 2).
3. Se veio de convite: marcar o convite como usado.
4. Confirmar em pt-BR.
5. No convite, após sucesso: tela de agradecimento, **sem** voltar ao formulário e **sem** mostrar as respostas.
6. Na ficha: o histórico passa a listar a nova versão; ao recarregar, ela permanece.

### 6.4 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Título público: `QUESTIONÁRIO PARA O PACIENTE`
- Gerar pré-consulta: `Gerar link pré-consulta`
- Abrir tablet: `Abrir no tablet`
- Ajuda do link: `Copie este link e envie ao paciente. Vale por 7 dias.`
- Ajuda do tablet: `Abra este link no tablet da clínica. Vale até o fim de hoje. Não entre com a conta da equipe nesse aparelho.`
- Link substituído: `O link anterior desta finalidade não vale mais.`
- Consentimento público: `Li e concordo com o tratamento dos meus dados de saúde neste questionário pela clínica.`
- Enviar: `Enviar questionário`
- Sucesso na ficha: `Nova versão de anamnese salva.`
- Sucesso no convite: `Questionário enviado. Obrigado.`
- Já preenchido (só data): `Você já preencheu em 25/08/2026. Pode enviar uma nova versão.`
- Link genérico: `Link inválido ou expirado.`
- Pergunta sem Sim/Não: `Responda Sim ou Não em todas as perguntas.`
- Complemento vazio no Sim: `Informe o complemento desta resposta.`
- Sem declaração: `Confirme a declaração e informe o nome.`
- Sem consentimento (público): `Confirme o consentimento para enviar.`
- Sem permissão para gerar convite: `Sem permissão para gerar o link de anamnese.`
- Sexo: `Sexo` (opções `Feminino` e `Masculino`)
- Sexo ausente: `Informe o sexo.`

---

## 7. Fora de escopo

- F7-01, F7-02, F7-04, F7-05, F7-06, F7-07, F7-08, F7-09 (redesenho).
- Disparo do link por WhatsApp (encaixa na F7-04; aqui o link é **copiável**).
- Campo de sexo no **cadastro** do paciente (sexo vive só no preenchimento desta anamnese).
- Reescrever anamneses v1 para o formato papel.
- Continuar oferecendo o formulário v1 para envio novo.
- Inbox, bot ou conversa WhatsApp.
- Template de pós-cirurgia, e-mail financeiro, odontograma, busca.
- Playwright.
- Fechamento documental da Fase 7 inteira.
- Tela de configurações.

---

## 8. Fluxos

### 8.1 Caminho feliz · Equipe preenche o papel na ficha

1. Dentista autentica, abre a ficha e a aba **Anamnese**.
2. Vê o questionário Sim/Não (não os campos de texto livre da v1).
3. Informa sexo **Feminino**; o bloco **Apenas para mulheres** aparece.
4. Responde todas as perguntas visíveis; marca Sinusite na lista de doenças; deixa as outras desmarcadas.
5. Em “Tem alguma alergia?” marca **Não** (complemento não aparece).
6. Confirma a declaração, informa o nome, salva.
7. O histórico mostra a nova versão. Recarregar a ficha: a versão permanece. Versões v1 antigas, se houver, continuam listadas e legíveis.

**Pronto quando este fluxo passa** com o questionário do apêndice, não com o v1.

### 8.2 Caminho feliz · Pré-consulta no celular do paciente

1. Recepção abre a ficha de **Maria Silva** e aciona **Gerar link pré-consulta**.
2. Copia o link. O segredo não aparece em outro lugar da ficha além do campo de copiar.
3. Paciente abre o link no celular, **sem login**.
4. Vê o cabeçalho do Dr. Fellipe, o título, o próprio nome, e **não** vê menu nem outras telas da clínica.
5. Marca consentimento, informa sexo **Feminino**, preenche o questionário (incluindo um Sim com complemento, ex.: alergia a dipirona), declara e envia.
6. Vê `Questionário enviado. Obrigado.`
7. Recepção recarrega a ficha: a versão 2 está no histórico.
8. Paciente recarrega o mesmo link: mensagem genérica `Link inválido ou expirado.` (convite usado).

### 8.3 Caminho feliz · Tablet do consultório

1. Recepção aciona **Abrir no tablet** na ficha do paciente do dia.
2. Abre o link no tablet **sem** entrar com a conta da equipe.
3. Paciente preenche e envia, igual ao §8.2 no que diz respeito ao isolamento e ao conteúdo.
4. O convite não vale no dia seguinte (depois da meia-noite de São Paulo).

### 8.4 Caminho feliz · Já existe vigente, preenche de novo pelo link

1. Maria já tem anamnese (v1 ou v2).
2. Paciente abre um convite válido.
3. Vê a data da vigente, **sem** as respostas.
4. Preenche e envia uma nova versão.
5. O histórico na ficha tem as duas; a vigente passa a ser a nova.

### 8.5 Caminho feliz · Histórico misto v1 e v2

1. Ficha da Maria com a anamnese v1 do seed.
2. Equipe salva uma v2.
3. A lista mostra as duas. Abrir a v1 continua mostrando o texto livre. Abrir a v2 mostra Sim/Não e doenças.

### 8.6 Caminho feliz · Visualizador

1. Visualizador abre a ficha.
2. **Não** vê aba clínica de anamnese nem botões de convite (comportamento atual de conteúdo clínico).

### 8.7 Caminho feliz · Complemento só no Sim

1. Em “Está tomando algum medicamento?” marca **Sim**: aparece `Qual(is)?`. Preenche `Losartana`.
2. Troca para **Não**: o campo some.
3. Envio grava **Não** e **não** grava `Losartana`.

### 8.8 Caminho feliz · Masculino oculta o bloco para mulheres

1. Na ficha ou no convite, informa sexo **Masculino**.
2. O bloco **Apenas para mulheres** **não** aparece.
3. Envia o restante do questionário + declaração.
4. A versão gravada tem `sex = male` e **não** traz menopausa, osteoporose nem gravidez.
5. No histórico, essa versão também **não** mostra o bloco.

### 8.9 Caminho feliz · Novo convite invalida o anterior

1. Recepção gera link pré-consulta e copia.
2. Gera de novo a mesma finalidade. A ficha avisa que o link anterior não vale mais.
3. Abrir o **primeiro** link: mensagem genérica `Link inválido ou expirado.`
4. Abrir o **segundo** link: questionário válido. Só esse envio grava uma versão.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Link inválido, expirado ou já usado | Mesma mensagem genérica; sem nome, sem formulário | Anti-enumeração |
| Tentativas repetidas de adivinhar o link | Limitar tentativas; depois a mesma mensagem genérica | Impressão digital de origem; fail secure |
| Sessão da equipe no tablet do paciente | Fora do desenho; o convite não exige e não usa login | Copy §6.4; layout sem menu |
| Papel sem permissão tenta gerar convite | Recusa; `Sem permissão para gerar o link de anamnese.` | Matriz §5 |
| Visualizador tenta ler histórico | Não recebe conteúdo clínico | Fail secure, igual F3 |
| Sexo ausente ao enviar | Recusa; `Informe o sexo.` | Cliente e servidor |
| Envio com pergunta Sim/Não em branco (incluindo o bloco mulheres se visível) | Recusa; `Responda Sim ou Não em todas as perguntas.` | Cliente e servidor |
| Sim sem complemento obrigatório | Recusa; `Informe o complemento desta resposta.` | Cliente e servidor |
| Declaração ou nome ausente | Recusa | Igual espírito da F3 |
| Consentimento ausente no convite | Recusa | Só na página pública |
| Duplo envio rápido no mesmo convite | O primeiro grava; o segundo vê convite usado / mensagem genérica | Convite de uso único |
| Gerar segundo convite da mesma finalidade | O anterior deixa de valer; aviso na ficha; só o link novo aceita envio | Um aberto por finalidade; evita duplicidade §4.2 |
| Convite pré-consulta após 7 dias | Tratado como inválido genérico | Validade §4.2 |
| Convite de consultório no dia seguinte | Tratado como inválido genérico | Meia-noite São Paulo |
| Paciente inexistente no convite | Mensagem genérica (não revelar) | Anti-enumeração |
| Abrir convite de outro paciente | Só o paciente daquele convite; nunca misturar fichas | Convite amarra um paciente |
| Logs / Sentry | Sem corpo do questionário, sem segredo do link, sem IP em claro, sem CPF | Metadados: finalidade, identificadores |
| Auditoria falha | O envio clínico **mesmo assim** persiste | Igual F3 |
| Formulário v1 ainda visível para envio novo | Não permitido | Só leitura no histórico |
| Card do paciente após salvar v2 | Recorte papel da F7-09 (doenças, medicamento, alergia, Sim relevantes) | Identificadores §4.9; sem redesenhar o card nesta spec |
| Sexo masculino | Bloco mulheres oculto; três perguntas não gravadas | §4.4 |
| Sexo feminino | Bloco visível; três perguntas obrigatórias | §4.4 |
| Troca Feminino → Masculino com bloco já preenchido | Bloco some; respostas do bloco descartadas | Evita lixo |
| Sexo ausente no conteúdo (dado antigo / falha) | Bloco visível na leitura e no envio (falha segura) | Como o papel |
| Lista de doenças vazia | Válido | §4.4 |
| Texto de outra doença só com espaços | Trata como vazio; não grava | Trim |
| Sair da página pública sem enviar | Respostas locais se perdem | Sem rascunho nesta fatia |
| Falha de rede ao enviar | Mensagem amigável; o preenchimento permanece na tela para tentar de novo | Não limpar o formulário no erro |
| Terceiro com o link | Pode preencher enquanto o convite for válido | Risco aceito v1; link longo + validade curta; uso único |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho feliz §8.1: nova versão na ficha é o questionário papel; v1 antiga permanece legível.
- [ ] Caminho feliz §8.2: link pré-consulta, página sem menu, envio, convite usado na segunda visita.
- [ ] Caminho feliz §8.3: convite de consultório vale só no dia (fuso São Paulo).
- [ ] Caminho §8.4: vigente existente mostra só a data na página pública; nova versão grava.
- [ ] Caminho §8.5: histórico misto v1 + v2.
- [ ] Caminho §8.7: complemento some e não grava ao mudar para Não.
- [ ] Caminho §8.8: masculino oculta o bloco; feminino mostra e exige as três perguntas.
- [ ] Caminho §8.9: gerar de novo invalida o convite anterior da mesma finalidade.
- [ ] Conteúdo do apêndice presente **letra a letra** (perguntas, doenças, bloco mulheres, declaração).
- [ ] Matriz §5 na interface e no servidor.
- [ ] Convite: segredo só no link; só impressão digital persistida; mensagem genérica se inválido/expirado/usado.
- [ ] Página do convite: mínimo de dado de saúde; sem CPF, sem outras abas, sem respostas anteriores.
- [ ] Validação §4.4 no servidor, mensagens em pt-BR.
- [ ] Auditoria de geração e de envio **sem** PHI no registro.
- [ ] Regras de domínio (Vitest): validade por finalidade (7 dias / fim do dia); impressão digital do convite; uso único; exclusão Sim/Não; complemento só no Sim e obrigatório; convite aberto único por finalidade (gerar de novo invalida o anterior); mensagem genérica não distingue motivos; bloco mulheres só se feminino (ou sexo ausente); masculino não persiste as três perguntas.
- [ ] Questionário versão 2: ids do apêndice cobertos em teste (pelo menos um Sim/Não com complemento, lista de doenças, sexo, bloco mulheres quando feminino, declaração).
- [ ] Autorização revalidada na escrita da ficha e na geração do convite; políticas de acesso do convite: quem tem o link válido envia, quem não tem o segredo não lê o paciente.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor, fail secure, sem PHI em logs, sem segredo no cliente, superfície pública sem enumeração, consentimento visível no convite.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas (questionário: esquema num arquivo de domínio; interface por bloco se passar do teto).
- [ ] `docs/state/PENDENCIAS.md`: item **F7-03** marcado como implementado; homologação em dispositivo real, se pendente, na seção de homologação.

### Qualidade

- [ ] Celular: campos 16 px; Sim/Não, consentimento e enviar com alvo ≥ 44 px.
- [ ] Viewport estreito: cabeçalho + primeiras perguntas sem esconder o título; tablet/consultório rolável até a declaração.
- [ ] Viewport de mesa: a aba da ficha permanece usável; o questionário não estoura o teto de largura da ficha.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (ficam no fechamento da Fase 7; viewport mobile nesta fatia basta).
- Envio do link por WhatsApp (F7-04).
- Docs `docs/implementation/F7-*.md` e capítulo `docs/manual-dev/` da Fase 7 inteira (só no fechamento da fase).
- Cobertura 80% global do repositório (apenas domínio tocado).
- Seed obrigatório de uma versão 2 da Maria (o seed v1 permanece; o caminho §8.1 cria a v2). Um convite de desenvolvimento documentado no seed **é** desejável para abrir a página pública localmente, no mesmo espírito da fila.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-26-f7-03-anamnese-isolada.md` | Esta spec |
| `src/features/records/domain/anamnesis-form-v2.ts` | Questionário papel: ids, textos, blocos, regras de complemento |
| `src/features/records/domain/anamnesis-form-v2.test.ts` | Testes: Sim/Não, complemento, doenças, sexo, mulheres visível/oculto, declaração |
| `src/features/records/lib/anamnesis-token.ts` | Gerar convite, impressão digital, validade por finalidade, uso único |
| `src/features/records/lib/anamnesis-token.test.ts` | Testes de convite e validade |
| `src/features/records/components/anamnesis-yes-no-field.tsx` | Par Sim/Não + complemento (se o formulário passar de ~300 linhas) |
| `src/features/records/components/anamnesis-disease-list.tsx` | Lista de doenças (mesmo critério de tamanho) |
| `src/features/records/components/anamnesis-public-header.tsx` | Cabeçalho da página do convite |
| `src/app/anamnese/layout.tsx` | Envoltório **sem** menu da clínica |
| `src/app/anamnese/[token]/page.tsx` | Página pública do convite |
| `supabase/migrations/022_anamnesis_convites_f7.sql` | Persistência do convite (impressão digital, paciente, validade, finalidade, usado em), políticas de acesso, seed opcional de um convite de desenvolvimento da Maria |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/records/components/anamnesis-form.tsx` | Passar a usar o questionário papel; origem ficha |
| `src/features/records/components/anamnesis-history.tsx` | Renderizar v1 e v2; prévia da v2 |
| `src/features/records/components/patient-chart.tsx` | Ações de gerar convite / abrir no tablet na aba Anamnese |
| `src/features/records/actions.ts` | Salvar v2; gerar convite; enviar pelo convite (autorização, auditoria) |
| `src/features/records/schemas.ts` | Validação na borda do envio v2 e da geração de convite |
| `src/features/records/queries.ts` | Ler conteúdo v2 no histórico; dados mínimos da página do convite |
| `src/features/records/permissions.ts` | Quem gera convite (espelho de quem já grava anamnese) |
| `src/lib/supabase/database.types.ts` | Regenerar após a migration `022` |
| `docs/SECURITY.md` | Incluir a superfície pública do convite de anamnese (token opaco, impressão digital, mínimo de dados, consentimento, anti-enumeração) |
| `docs/state/PENDENCIAS.md` | Marcar F7-03 após o código (não nesta spec draft) |

### Permitido com restrição

| Arquivo | Restrição |
| ------- | --------- |
| `src/features/records/domain/patient-card-summary.ts` | **Só** se a gravação v2 desta spec não casar com a leitura **já prevista** na F7-09. Sem redesenhar o recorte, sem mudar ordem dos Sim relevantes. |
| `.env.example` | **Só** se for preciso documentar o convite de desenvolvimento (sem secretos reais). Reutilizar o segredo de impressão digital de origem já usado na fila, se existir. |

### Proibido alterar nesta feature

- `src/features/records/domain/anamnesis-form-v1.ts` (permanece para ler o histórico).
- `src/features/records/domain/anamnesis-expiry.ts` (12 meses intactos), salvo import se o histórico precisar.
- Card visual: `src/features/patients/components/patient-summary.tsx`.
- Cadastro, segundo telefone, evoluções, odontograma, WhatsApp, estoque, fila, agenda, lembretes.
- `src/app/(app)/layout.tsx` (o convite **não** entra nesse envoltório).
- `supabase/migrations/001` a `021`.
- Conteúdo extra em `022` além de convites de anamnese e seed mínimo do convite de desenvolvimento.
- `.env.local`, secrets reais.
- Spec pai da Fase 7 e specs F7-01, F7-02, F7-04 a F7-09, salvo pedido explícito.
- Disparo WhatsApp (`src/lib/whatsapp/**`).

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Envio **novo** é sempre questionário **versão 2** (papel) |
| 2 | v1 permanece **consultável**; **não** migrar conteúdo |
| 3 | Dois convites: **pré-consulta** (7 dias) e **consultório** (fim do dia em São Paulo) |
| 4 | Superfície do convite **sem** menu da clínica |
| 5 | Segredo só no link; só impressão digital persistida; uso único após sucesso |
| 6 | Um convite **aberto** por paciente e finalidade; gerar de novo **invalida** o anterior daquela finalidade (segurança + evita duplicidade de envio) |
| 7 | Link **copiável**; WhatsApp fica na F7-04 |
| 8 | Tablet **sem** sessão da equipe |
| 9 | Página pública: nome completo; **sem** respostas da vigente; sem CPF |
| 10 | Inválido / expirado / usado: **mesma** mensagem genérica |
| 11 | Sim e Não são marcas exclusivas; complemento só no Sim e obrigatório se a pergunta o tiver |
| 12 | Doenças: várias marcas; nenhuma é válido |
| 13 | Bloco **Apenas para mulheres** só se sexo **feminino**; se masculino, oculto e não gravado; se sexo ausente, visível (falha segura) |
| 14 | Declaração com o texto **exato** do papel + nome + confirmação |
| 15 | Consentimento LGPD visível **só** na página do convite |
| 16 | Identificadores do apêndice estáveis (contrato com o card F7-09) |
| 17 | Sem rascunho não salvo nesta fatia |
| 18 | Sexo **obrigatório no preenchimento** (Feminino / Masculino); **não** entra no cadastro |
| 19 | Migration incremental `022`; não editar `001`–`021` |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Página pública vazar prontuário | Só nome + questionário em branco; sem respostas anteriores; sem outras abas §4.3 |
| Enumeração de convites | Mensagem genérica; limite de tentativas; link longo §9 |
| PHI em log | Auditoria e Sentry sem corpo, sem segredo, sem IP em claro |
| Tablet com login da equipe | Convite não usa sessão; copy explícito; layout sem menu |
| Terceiro com o link preenche | Aceito v1 (igual espírito da fila); validade + uso único |
| Formulário passar de 300 linhas | Esquema no domínio; interface por bloco §11 |
| Card F7-09 quebrar na v2 | Ids §4.9 iguais aos que o recorte já lê; teste de gravação compatível |
| Escopo inflar para WhatsApp | Fora de escopo §7; link copiável basta |
| Equipe continuar gravando v1 | Formulário de envio só v2 §6.1 |
| Dois links vivos da mesma finalidade | Gerar de novo invalida o anterior §4.2 / §8.9 |
| Homem ver ou gravar perguntas de gravidez | Sexo no preenchimento; bloco só se feminino §4.4 |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 4 · F7-03 · apêndice do questionário
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-03
- Spec F3: `specs/2026-08-18-fase-3-pacientes-prontuario.md` §4.2, §4.3, §6.5 (anamnese versionada, 12 meses, assinatura)
- Spec F4: `specs/2026-08-18-fase-4-fila-kanban.md` (link opaco, impressão digital, página sem menu, mensagem genérica)
- Spec F7-09: `specs/2026-08-25-f7-09-card-paciente.md` §4.3–4.4 (recorte da versão papel)
- Fotos: `docs/assets/anamnese-questionario-p1.png`, `docs/assets/anamnese-questionario-p2.png`
- `docs/SECURITY.md` · PHI, auditoria, fail secure, link ao paciente
- `docs/state/PENDENCIAS.md` · F7-03
- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente F7-03** na branch `feature/fase-7-ajustes-demo-felipe`, sem F7-04/F7-05 no mesmo passo até você pedir.

---

## Apêndice · Questionário papel (versão 2)

Fonte: fotos do Felipe. Não resumir, não inventar pergunta clínica. Textos **exatos**.

**Sexo** (não está no papel; existe só para o bloco 6):

| id | Tipo | Texto | Valores |
| -- | ---- | ----- | ------- |
| `sex` | escolha | Sexo | `female` (Feminino) · `male` (Masculino) |

### Bloco 1 · Saúde geral

| id | Tipo | Texto | Complemento |
| -- | ---- | ----- | ----------- |
| `health_ok` | Sim/Não | Está bem de saúde atualmente? | `Por quê?` se Sim |
| `under_medical_care` | Sim/Não | Está ou esteve recentemente sob cuidados médicos? | `Por quê?` se Sim |
| `taking_medication` | Sim/Não | Mesmo não estando em tratamento, está tomando algum medicamento? | `Qual(is)?` se Sim |

**Já foi acometido de alguma dessas doenças?** (várias marcas, ids `disease_*`):

Anemia · Úlcera · Sífilis · Problemas Cardíacos · Hepatite · Tuberculose · Doença de Chagas · Asma · Diabetes · Febre Reumática · Hemofilia · Problemas Hepáticos · Nefrite · Epilepsia · Hipertensão · Sinusite

Identificadores estáveis (contrato com o card): `disease_anemia`, `disease_ulcer`, `disease_syphilis`, `disease_heart`, `disease_hepatitis`, `disease_tuberculosis`, `disease_chagas`, `disease_asthma`, `disease_diabetes`, `disease_rheumatic_fever`, `disease_hemophilia`, `disease_liver`, `disease_nephritis`, `disease_epilepsy`, `disease_hypertension`, `disease_sinusitis`.

| id | Tipo | Texto |
| -- | ---- | ----- |
| `other_disease` | texto | Você tem alguma outra doença, condição ou problema não citado acima? |

### Bloco 2 · Sangramento

| id | Tipo | Texto |
| -- | ---- | ----- |
| `bleeding_prior_surgery` | Sim/Não | Apresentou hemorragia em cirurgias anteriores? |
| `bleeds_much_when_cut` | Sim/Não | Perde muito sangue ao cortar-se? |
| `bleeding_lasts_long` | Sim/Não | Continua por muito tempo o sangramento? |
| `bruises_easily` | Sim/Não | Tem facilmente hematomas em contusões? |

### Bloco 3 · Respiratório e cardiovascular

| id | Tipo | Texto |
| -- | ---- | ----- |
| `shortness_of_breath` | Sim/Não | Sente falta de ar? |
| `tired_climbing_stairs` | Sim/Não | Normalmente sente muito cansaço ao subir escada? |
| `ankle_swelling` | Sim/Não | Apresenta inchaço nos tornozelos? |
| `chest_back_pain` | Sim/Não | Apresenta dores no peito ou costas (Palpitações)? |
| `headache_nausea` | Sim/Não | Tem cefaléias frequentes ou náuseas? |

### Bloco 4 · Família, hábitos e cicatrização

| id | Tipo | Texto |
| -- | ---- | ----- |
| `family_diabetes` | Sim/Não | Tem algum diabético em sua família? |
| `urinates_often` | Sim/Não | Urina com muita frequência? |
| `drinks_lots_of_liquid` | Sim/Não | Ingere muito líquido? |
| `eats_lots_of_sweets` | Sim/Não | Come muito doce? |
| `slow_wound_healing` | Sim/Não | Sua cicatriz de ferimento é demorada? |

### Bloco 5 · Nervosismo, alergia e histórico

| id | Tipo | Texto | Complemento |
| -- | ---- | ----- | ----------- |
| `nervous_sedatives` | Sim/Não | Considera-se nervoso? Já tomou sedativos? | |
| `depression_medication` | Sim/Não | Toma medicamento para depressão? | |
| `took_penicillin` | Sim/Não | Já tomou penicilina? | |
| `bronchial_asthma` | Sim/Não | Sofre de asma brônquica? | |
| `prior_dental_anesthesia` | Sim/Não | Já foi anestesiado em dentista anteriormente? Passa mal? | |
| `has_allergy` | Sim/Não | Tem alguma alergia? | `Qual(is)?` se Sim |
| `drug_reaction` | Sim/Não | Já apresentou alguma reação a algum medicamento? | `Se sim, qual(is)?` se Sim |
| `high_blood_pressure` | Sim/Não | A pressão é alta? | |
| `epileptic_relative` | Sim/Não | Algum parente epilético? | |
| `faint_or_seizure` | Sim/Não | Já teve algum desmaio ou convulsão? | |
| `blood_transfusion` | Sim/Não | Já recebeu transfusão de sangue? | |
| `hospitalized_or_surgery` | Sim/Não | Já foi hospitalizado? Sofreu cirurgia? | |
| `dental_treatment_complication` | Sim/Não | Alguma complicação durante tratamento odontológico? | |
| `drinks_alcohol_habitually` | Sim/Não | Toma habitualmente bebidas alcoólicas? | |

### Bloco 6 · Apenas para mulheres

Visível e obrigatório só se `sex = female` (ou `sex` ausente). Oculto e omitido no conteúdo se `sex = male`.

| id | Tipo | Texto |
| -- | ---- | ----- |
| `menopause` | Sim/Não | Já entrou na menopausa? |
| `osteoporosis_or_family` | Sim/Não | Tem osteoporose ou alguém da família teve? |
| `pregnant` | Sim/Não | Está grávida? |

### Declaração

Texto fixo: *Atesto serem verdadeiras as informações supracitadas a respeito do Questionário para Paciente.*
