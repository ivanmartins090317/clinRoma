# Manual do usuário · ClinRoma

Guia prático para a equipe da clínica usar o ClinRoma no dia a dia.

**Público:** recepção, dentistas, auxiliar de sala, administradores e demais colaboradores.  
**Não é necessário** conhecimento técnico para seguir este manual.

**Piloto:** Clínica Neo Roma · **Atualizado:** agosto/2026

---

## Índice

1. [O que é o ClinRoma e como entrar](#1-o-que-é-o-clinroma-e-como-entrar)
2. [Perfis de acesso: quem pode fazer o quê](#2-perfis-de-acesso-quem-pode-fazer-o-quê)
3. [Guia dos módulos](#3-guia-dos-módulos)
4. [Rotinas do dia a dia](#4-rotinas-do-dia-a-dia)
5. [Dúvidas frequentes](#5-dúvidas-frequentes)
6. [Glossário](#6-glossário)

---

## 1. O que é o ClinRoma e como entrar

### O que é o ClinRoma?

O ClinRoma é o sistema da clínica para organizar o trabalho do dia a dia. Com ele você pode:

- Ver as consultas de hoje e da semana
- Cadastrar pacientes e guardar o prontuário
- Controlar a fila de encaixe (quando um horário abre)
- Controlar insumos (luvas, materiais etc.) com leitura de QR code
- Enviar lembretes internos após consultas concluídas

O sistema foi pensado para funcionar bem no **celular** (dentista na sala, auxiliar escaneando QR) e no **computador** (recepção na agenda).

### Como entrar

1. Abra o endereço do ClinRoma que a clínica informou (no navegador do celular ou do computador).
2. Informe seu **e-mail** e **senha** cadastrados pela administração.
3. Toque ou clique em **Entrar**.

Se a senha estiver errada várias vezes, aguarde alguns minutos e tente de novo. Se continuar sem acesso, fale com o administrador da clínica.

**Sair do sistema:** use o botão **Sair** no menu lateral (computador) ou no topo da tela. Sempre saia se estiver usando um aparelho compartilhado.

### Tela inicial: Hoje

Depois do login, você cai na página **Hoje**. Ela mostra um resumo do dia:

- Consultas agendadas (agrupadas por dentista)
- Situação da fila de encaixe
- Alertas de estoque baixo
- Lembretes com falha (somente administrador)

### Menu principal

No **computador**, o menu fica na barra lateral esquerda (fundo bordô).

No **celular**, o menu fica na **barra inferior** com ícones:

| Ícone | Módulo | Para que serve |
| ----- | ------ | -------------- |
| Casa | **Hoje** | Resumo do dia |
| Calendário | **Agenda** | Marcar e consultar horários |
| Pessoas | **Pacientes** | Cadastro e prontuário |
| Grade | **Fila Kanban** | Lista de encaixe |
| Caixa | **Estoque** | Insumos e materiais |

**Importante:** cada pessoa vê só os módulos permitidos para seu perfil. Se você não enxergar um item do menu, é porque sua função não tem acesso a ele. Isso é normal e intencional.

A leitura de QR do estoque fica **dentro do módulo Estoque**, no caminho **Scan QR** (principalmente para a auxiliar de sala no celular).

### Celular x computador

| Situação | Computador | Celular |
| -------- | ---------- | ------- |
| Recepção marcando consulta | Calendário completo, arrastar horários | Lista do dia (consulta e detalhes) |
| Dentista documentando atendimento | Todas as abas do prontuário | Evolução com foto e áudio |
| Auxiliar retirando insumo | Possível, mas o fluxo ideal é mobile | Scan QR com câmera traseira |

**Dica para auxiliar:** no celular, você pode **adicionar o ClinRoma à tela inicial** (como um aplicativo). Assim o atalho **Scan estoque** abre direto a câmera de leitura.

---

## 2. Perfis de acesso: quem pode fazer o quê

Cada colaborador tem um **perfil**. O perfil define o que aparece no menu e o que você pode alterar no sistema.

Existem **5 perfis** no ClinRoma:

| Perfil | Quem costuma ser | Em uma frase |
| ------ | ---------------- | ------------ |
| **Administrador** | Dono, gerente ou TI da clínica | Acesso total |
| **Recepção** | Atendimento na recepção | Agenda, pacientes e fila |
| **Dentista** | Profissional clínico | Prontuário e evolução do paciente |
| **Auxiliar de sala** | Quem prepara materiais na sala | Estoque e scan de QR |
| **Visualizador** | Quem só precisa consultar | Leitura, sem alterar nada clínico |

### O que cada perfil vê no menu

| Módulo | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ------ | :---: | :------: | :------: | :------: | :----------: |
| Hoje | Sim | Sim | Sim | Não | Sim |
| Agenda | Sim | Sim | Sim* | Não | Sim* |
| Pacientes | Sim | Sim | Sim | Não | Sim** |
| Fila Kanban | Sim | Sim | Sim* | Não | Não |
| Estoque | Sim | Sim* | Sim* | Sim | Não |
| Scan QR | Sim | Não | Não | Sim | Não |

\* Somente **consultar** (sem criar ou alterar, conforme o módulo).  
\*\* Somente **dados cadastrais** (nome, contato). Sem prontuário clínico.

### Ações do dia a dia

#### Pacientes

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Buscar paciente na lista | Sim | Sim | Sim | Não | Sim |
| Cadastrar paciente novo | Sim | Sim | Sim | Não | Não |
| Ver prontuário (anamnese, odontograma) | Sim | Sim | Sim | Não | Não |
| Preencher anamnese e odontograma | Sim | Sim | Sim | Não | Não |
| Registrar evolução (texto, foto, áudio) | Sim | Não | Sim | Não | Não |

#### Agenda

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Ver consultas | Sim | Sim | Sim | Não | Sim |
| Marcar consulta nova | Sim | Sim | Não | Não | Não |
| Remarcar ou cancelar | Sim | Sim | Não | Não | Não |
| Marcar consulta como concluída | Sim | Sim | Não | Não | Não |

#### Fila de encaixe

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Ver fila | Sim | Sim | Sim | Não | Não |
| Incluir paciente na fila | Sim | Sim | Não | Não | Não |
| Enviar oferta de horário (link) | Sim | Sim | Não | Não | Não |

#### Estoque

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Ver saldos e alertas | Sim | Sim | Sim | Sim | Não |
| Cadastrar ou editar insumo | Sim | Não | Não | Não | Não |
| Registrar compra e gerar QR | Sim | Não | Não | Sim | Não |
| Escanear QR para retirada | Sim | Não | Não | Sim | Não |

#### Somente administrador

- Ver histórico de auditoria do prontuário
- Reenviar lembretes que falharam
- Gerenciar perfis de outros usuários
- Corrigir retirada de estoque em casos excepcionais

### Por que a recepção não registra evolução clínica?

A **evolução** (nota do atendimento, foto, gravação de áudio da prescrição) é responsabilidade do **dentista** ou do **administrador**. A recepção cuida do cadastro, da agenda e da fila, e pode ajudar com anamnese e odontograma quando orientada, mas não registra evolução sozinha.

Isso protege o registro clínico e deixa claro quem documentou o atendimento.

### Por que o dentista não marca consulta?

No piloto, **marcar, remarcar, cancelar e concluir horários** fica com a **recepção** (e o administrador). O dentista consulta a agenda, abre o prontuário a partir da consulta e, ao terminar, avisa a recepção para marcar a consulta como **Concluída**.

### Recebi mensagem "Acesso negado"

Significa que você tentou abrir uma página fora do seu perfil (por exemplo, recepção tentando abrir o Scan QR).

**O que fazer:** volte ao menu e use só os módulos disponíveis. Se acredita que deveria ter acesso, fale com o administrador da clínica para revisar seu perfil.

---

## 3. Guia dos módulos

### Hoje

**Para que serve:** painel rápido do dia. É a primeira tela após o login.

**Quem usa:** recepção, dentistas, administrador e visualizador (auxiliar de sala não entra aqui).

**O que aparece:**

- **Consultas de hoje**, agrupadas por dentista
- **Resumo da fila** (quantos pacientes aguardam encaixe, ofertas pendentes)
- **Alertas de estoque** (insumos abaixo do mínimo ou zerados)
- **Lembretes com falha** (somente administrador: e-mails que não foram enviados)

**Ações comuns:**

- Toque ou clique em uma consulta para ver detalhes
- Use **Abrir prontuário** para ir direto à ficha do paciente daquela consulta

### Agenda

**Para que serve:** ver e gerenciar horários dos dentistas (até 5 no piloto Neo Roma).

**Quem consulta:** recepção, dentistas, administrador e visualizador.  
**Quem altera horários:** recepção e administrador.

**No computador:**

- Calendário com **uma coluna por dentista**
- Visão por **dia** ou **semana**
- Clique em um horário vazio para **nova consulta**
- Arraste um horário para **remarcar** (confirme na janela que aparece)
- Clique na consulta para **editar, cancelar** ou **abrir prontuário**

**No celular:**

- Lista do dia, agrupada por dentista
- Filtro por dentista no topo
- Toque na consulta para ver **detalhes** (sem editar no celular; remarcação fica no computador da recepção)

**Ao marcar uma consulta:**

1. Escolha o **paciente** (busque pelo nome; se não existir, cadastre antes em Pacientes)
2. Escolha o **dentista**
3. Informe **data, horário de início e fim**
4. Opcional: procedimento e observações
5. Salve

O sistema **não permite** dois atendimentos no mesmo horário para o mesmo dentista.

**Status da consulta:**

| Status | Significado |
| ------ | ----------- |
| Agendada | Horário reservado |
| Confirmada | Paciente confirmou (ex.: aceitou encaixe pela fila) |
| Em atendimento | Consulta em andamento |
| Concluída | Atendimento finalizado |
| Faltou | Paciente não compareceu |
| Cancelada | Horário liberado |
| Remarcada | Consulta antiga; existe outra no lugar |

Quando a **recepção ou administrador** marca a consulta como **Concluída**, o sistema prepara um **lembrete por e-mail** para o dentista (com resumo e link para o prontuário).

### Pacientes

**Para que serve:** cadastro de pacientes e prontuário odontológico.

**Quem cadastra:** recepção, dentista e administrador.  
**Quem vê prontuário clínico:** recepção, dentista e administrador (visualizador vê só dados básicos).

**Lista de pacientes:**

- Busque pelo **nome**
- Botão **Novo paciente** (se seu perfil permitir)

**Cadastrar paciente novo:**

1. **Novo paciente**
2. Preencha nome, data de nascimento, telefone, e-mail e CPF (quando houver)
3. Marque o **consentimento LGPD** e informe o nome de quem autorizou
4. Salve

Sem o consentimento LGPD o cadastro não é concluído.

**Ficha do paciente (prontuário):**

| Aba | Conteúdo |
| --- | -------- |
| **Resumo** | Dados cadastrais e visão geral |
| **Anamnese** | Questionário de saúde (histórico, alergias, medicamentos etc.) |
| **Odontograma** | Mapa dos dentes com condições registradas |
| **Evoluções** | Notas de cada atendimento, com foto e áudio |

**Anamnese:** formulário padronizado da clínica. Se passou de **12 meses** desde a última atualização, o sistema avisa para revisar.

**Odontograma:** toque ou clique no dente para registrar condição. No celular, use zoom e arraste para navegar no mapa.

**Evoluções (somente dentista e administrador):**

1. Abra a aba **Evoluções**
2. Crie uma nova evolução (se veio da agenda, a consulta já pode estar vinculada)
3. Opcional: tire **foto** (ex.: etiqueta de medicamento)
4. Opcional: **grave áudio** com a prescrição ou orientações
5. O áudio é transcrito automaticamente; aguarde alguns segundos na tela

**Dica para dentista:** prefira gravar o áudio no **celular**, com o aparelho perto da boca e ambiente silencioso.

**Abrir prontuário pela agenda:** na Agenda ou em Hoje, abra a consulta e use **Abrir prontuário**. Assim a evolução fica ligada ao horário correto.

### Fila Kanban

**Para que serve:** organizar pacientes que **esperam um encaixe** quando surge horário vago (cancelamento, desistência etc.).

**Quem opera:** recepção e administrador.  
**Quem só consulta:** dentista.

**As colunas:**

| Coluna | O que significa |
| ------ | --------------- |
| **Aguardando** | Paciente na fila, sem oferta ativa |
| **Oferta enviada** | Link enviado; paciente tem **40 minutos** para responder |
| **Agendado** | Paciente aceitou e consulta foi criada na agenda |

**Prioridade (cor do card):** dentro de **Aguardando**, vermelho é mais urgente, amarelo é média e verde é menor urgência.

**Fluxo típico:**

1. Recepção inclui paciente na fila (**Nova entrada**)
2. Surge horário livre (ex.: cancelamento na agenda)
3. Recepção usa **Oferecer vaga na fila**, escolhe paciente e horário
4. Sistema gera um **link**; recepção copia e envia ao paciente (WhatsApp, SMS etc.) **manualmente**
5. Paciente abre o link no celular, aceita os termos LGPD e responde **Aceitar** ou **Recusar**
6. Se aceitar: consulta **confirmada** aparece na Agenda e em Hoje
7. Se recusar ou o tempo expirar: card volta para **Aguardando**

O link expira em **40 minutos**. Depois disso a oferta perde validade sozinha.

### Estoque

**Para que serve:** controlar insumos (luvas, alginato, anestésico etc.) com saldo e QR code por pacote.

**Quem cadastra insumos:** administrador.  
**Quem registra compra e pacotes QR:** administrador e auxiliar de sala.  
**Quem escaneia retirada:** administrador e auxiliar de sala.  
**Quem só consulta saldo:** recepção e dentista (alertas também aparecem em Hoje).

**Lista de insumos:** cada item mostra nome, unidade, saldo atual e situação (**OK**, **Abaixo do mínimo** ou **Zerado**).

**Registrar compra (entrada de material):**

1. Em Estoque, **Registrar compra**
2. Opcional: foto da planilha do fornecedor (referência visual; o sistema **não lê** a foto automaticamente)
3. Digite manualmente os itens, quantidades e lotes
4. Gere **etiquetas com QR** e imprima para colar nos pacotes

Cada pacote recebe um código único (ex.: `CR-XXXXXXXXXXXX`).

**Scan QR (retirada):**

1. Abra **Scan QR** (ideal no celular da auxiliar)
2. Aponte a câmera traseira para o QR do pacote
3. Confirme a quantidade retirada
4. O saldo do insumo é atualizado na hora

**Modo contínuo:** após uma retirada, a câmera fica pronta para o próximo scan.

**Dica:** instale o ClinRoma na tela inicial do celular para abrir o scan com um toque.

### Lembretes pós-consulta (automático)

Quando uma consulta é marcada como **Concluída**, o sistema envia um **e-mail ao dentista** com nome parcial do paciente (por privacidade) e link para o prontuário.

Se o e-mail falhar, o **administrador** vê o aviso em **Hoje** e pode **Reenviar**.

Por enquanto o lembrete vai **só para o dentista**, não para o paciente.

---

## 4. Rotinas do dia a dia

### Recepção

**Abertura do dia:**

1. Entrar no ClinRoma
2. Abrir **Hoje** e conferir consultas do dia
3. Verificar se há alertas de estoque (avisar auxiliar se necessário)
4. Conferir **Fila Kanban** (pacientes aguardando encaixe)

**Paciente novo chegando:**

1. **Pacientes** → **Novo paciente**
2. Preencher dados e consentimento LGPD
3. **Agenda** → marcar a consulta (paciente, dentista, horário)

**Remarcar ou cancelar:**

1. **Agenda** (computador)
2. Localizar a consulta
3. Arrastar para novo horário **ou** abrir e escolher cancelar/remarcar
4. Se cancelou e há fila: considerar **Oferecer vaga na fila**

**Encaixe pela fila:**

1. **Fila** → incluir paciente (se ainda não estiver)
2. Quando surgir horário: **Oferecer vaga na fila**
3. Copiar link e enviar ao paciente por WhatsApp ou SMS
4. Acompanhar coluna **Oferta enviada** (40 min de validade)
5. Após aceite: confirmar consulta na **Agenda** e em **Hoje**

**Durante o atendimento:**

- Se o dentista pedir: abrir prontuário pela consulta e ajudar com **anamnese** (se orientada)
- **Não** registrar evolução clínica (isso é com o dentista)

**Fim do atendimento:**

1. Confirmar com o dentista se a evolução foi registrada
2. Editar a consulta na **Agenda** e marcar situação como **Concluída** (dispara lembrete por e-mail ao dentista)

### Dentista

**Antes do primeiro paciente:**

1. Entrar no ClinRoma (celular ou computador)
2. **Hoje** ou **Agenda** → ver sua lista do dia
3. No celular, filtro pode já mostrar só seus horários

**Durante o atendimento:**

1. Abrir a consulta → **Abrir prontuário**
2. Revisar **Anamnese** se necessário
3. Atualizar **Odontograma** se houver achado
4. Aba **Evoluções**: criar evolução, foto se precisar, gravar **áudio**, aguardar transcrição

**Após o atendimento:**

1. Conferir se evolução e áudio foram salvos
2. Avise a **recepção** para marcar a consulta como **Concluída** na agenda

**O que o dentista não faz no piloto atual:**

- Marcar, remarcar ou cancelar horários na agenda
- Marcar consulta como concluída
- Operar fila de encaixe
- Escanear QR de estoque

### Auxiliar de sala

**Preparação de materiais:**

1. Entrar no ClinRoma no **celular**
2. **Estoque** → conferir saldos
3. Se recebeu compra nova: **Registrar compra**, gerar etiquetas QR e colar nos pacotes

**Durante o procedimento:**

1. Abrir **Scan QR** (ou atalho na tela inicial do celular)
2. Escanear QR do pacote usado
3. Confirmar quantidade retirada
4. Repetir para cada material consumido

**Quando o saldo está baixo:** avise recepção ou administrador para repor.

**O que a auxiliar não acessa:** agenda, pacientes e fila.

### Administrador

Pode fazer **tudo** que os outros perfis fazem, mais:

| Tarefa | Onde |
| ------ | ---- |
| Cadastrar e editar insumos | Estoque |
| Corrigir retirada excepcional de estoque | Detalhe do insumo |
| Reenviar lembretes com falha | Hoje |
| Gerenciar usuários e perfis | Via suporte técnico |

**Checklist semanal sugerido:**

- [ ] Revisar lembretes com falha em **Hoje**
- [ ] Conferir insumos zerados ou abaixo do mínimo
- [ ] Validar se novos colaboradores têm o perfil correto

### Visualizador

Perfil de **somente leitura**: vê **Hoje** e **Agenda**, busca pacientes e vê **dados cadastrais**. **Não** vê prontuário clínico, fila nem estoque.

### Cenários combinados (equipe)

**Cancelamento de última hora com fila cheia:**

1. Recepção cancela consulta na **Agenda**
2. Sistema sugere oferta à **Fila**
3. Recepção escolhe paciente prioritário (vermelho primeiro)
4. Envia link; se aceitar em até 40 min, horário preenchido

**Primeira consulta de paciente novo:**

1. Recepção cadastra em **Pacientes**
2. Marca consulta na **Agenda**
3. No dia: recepção ou dentista preenche **Anamnese**
4. Dentista registra **Evolução** ao final

**Dia com muitos procedimentos e consumo de material:**

1. Auxiliar prepara pacotes com QR visíveis
2. A cada procedimento: **Scan QR** das retiradas
3. Fim do dia: administrador ou auxiliar confere saldos em **Estoque**

---

## 5. Dúvidas frequentes

### Acesso e login

**Esqueci minha senha**  
Fale com o **administrador da clínica**.

**Entrei mas não vejo Agenda / Pacientes / Fila**  
Seu perfil pode não incluir esse módulo. Veja a [seção 2](#2-perfis-de-acesso-quem-pode-fazer-o-quê). Se a função mudou na clínica, peça ao administrador para ajustar seu perfil.

**Apareceu "Acesso negado"**  
Você abriu uma página que seu perfil não permite. Volte ao menu e use os módulos disponíveis.

**O sistema pediu login de novo**  
A sessão expira após um tempo sem uso. Entre novamente com e-mail e senha.

### Agenda

**Não consigo salvar a consulta: "Horário indisponível"**  
Já existe outra consulta naquele horário para o **mesmo dentista**. Escolha outro horário ou outro dentista.

**No celular não consigo remarcar**  
Use o **computador da recepção** para alterações de horário.

**Paciente não aparece na busca ao marcar consulta**  
Cadastre-o antes em **Pacientes** → **Novo paciente**.

### Pacientes e prontuário

**Não consigo salvar o paciente**  
Verifique se marcou o **consentimento LGPD** e preencheu o nome de quem autorizou.

**Sou recepção e não vejo a aba Evoluções para escrever**  
Normal. **Evolução clínica** é do **dentista** ou **administrador**.

**Visualizador não vê prontuário**  
Correto. Visualizador vê só **nome, contato e dados cadastrais**.

**Áudio gravou mas a transcrição não aparece**  
Aguarde alguns segundos, verifique internet e, se persistir, avise o administrador.

**Anamnese com aviso de "12 meses"**  
Revise com o paciente e salve de novo.

### Fila de encaixe

**O paciente diz que o link não funciona**  
Link vale **40 minutos**; gere **nova oferta** se expirou. Confirme se o paciente abriu o link completo.

**Paciente aceitou mas consulta não apareceu**  
Atualize **Agenda** e **Hoje**. Se ainda não aparecer, chame o administrador.

**Posso enviar o link por WhatsApp?**  
Sim. O sistema **não envia** automaticamente; a recepção copia e envia manualmente.

### Estoque

**QR não lê no celular**  
Permita acesso à **câmera**, use boa iluminação, confirme que está em **Scan QR** e recarregue a página se necessário.

**Escaneei duas vezes o mesmo pacote**  
O sistema ignora leituras repetidas muito rápidas. Confira o saldo no detalhe do insumo.

**Recepção precisa retirar material na urgência**  
Chame a **auxiliar de sala** ou o **administrador**.

**Foto da planilha na compra preenche os campos?**  
**Não.** A foto serve só de referência. Digite os itens manualmente.

### Lembretes

**Consulta concluída mas dentista não recebeu e-mail**  
Confirme e-mail cadastrado. Administrador vê falhas em **Hoje** → **Reenviar**. Lembrete vai ao **dentista**, não ao paciente.

### Celular e navegador

**Como instalar no celular como app?**  
Safari (iPhone) ou Chrome (Android): **Adicionar à tela inicial**.

**Funciona offline?**  
**Não.** É necessário internet para salvar dados, transcrever áudio e sincronizar estoque.

### Quem procurar

| Situação | Procurar |
| -------- | -------- |
| Senha, perfil errado, acesso bloqueado | Administrador da clínica |
| Horário, fila, cadastro de paciente | Recepção |
| Prontuário, evolução, odontograma | Dentista |
| Material, QR, retirada de insumo | Auxiliar de sala |
| Erro técnico, sistema fora do ar | Administrador + suporte técnico |

---

## 6. Glossário

| Termo | Significado simples |
| ----- | ------------------- |
| **Prontuário** | Ficha clínica completa do paciente |
| **Anamnese** | Questionário de saúde e histórico |
| **Odontograma** | Mapa dos dentes e condições |
| **Evolução** | Registro do que foi feito na consulta |
| **LGPD** | Lei de proteção de dados; consentimento do paciente |
| **Encaixe / Fila** | Lista de quem espera horário que abrir |
| **QR / Scan** | Código no pacote de material; leitura pela câmera |
| **Perfil** | Tipo de acesso (recepção, dentista etc.) |

---

*ClinRoma · Clínica Neo Roma · Manual do usuário · agosto/2026*
