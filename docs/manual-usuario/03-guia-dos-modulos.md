# 3 · Guia dos módulos

Este capítulo explica **cada parte do sistema** de forma direta: para que serve, quem usa e os passos principais.

---

## Hoje

**Para que serve:** painel rápido do dia. É a primeira tela após o login.

**Quem usa:** recepção, dentistas, administrador e visualizador (auxiliar de sala não entra aqui).

### O que aparece

- **Consultas de hoje**, agrupadas por dentista
- **Resumo da fila** (quantos pacientes aguardam encaixe, ofertas pendentes)
- **Alertas de estoque** (insumos abaixo do mínimo ou zerados)
- **Lembretes com falha** (somente administrador: e-mails que não foram enviados)

### Ações comuns

- Toque ou clique em uma consulta para ver detalhes
- Use **Abrir prontuário** para ir direto à ficha do paciente daquela consulta

---

## Agenda

**Para que serve:** ver e gerenciar horários dos dentistas (até 5 no piloto Neo Roma).

**Quem consulta:** recepção, dentistas, administrador e visualizador.  
**Quem altera horários:** recepção e administrador.

### No computador

- Calendário com **uma coluna por dentista**
- Visão por **dia** ou **semana**
- Clique em um horário vazio para **nova consulta**
- Arraste um horário para **remarcar** (confirme na janela que aparece)
- Clique na consulta para **editar, cancelar** ou **abrir prontuário**

### No celular

- Lista do dia, agrupada por dentista
- Filtro por dentista no topo
- Toque na consulta para ver **detalhes** (sem editar no celular; remarcação fica no computador da recepção)

### Ao marcar uma consulta

1. Escolha o **paciente** (busque pelo nome; se não existir, cadastre antes em Pacientes)
2. Escolha o **dentista**
3. Informe **data, horário de início e fim**
4. Opcional: procedimento e observações
5. Salve

O sistema **não permite** dois atendimentos no mesmo horário para o mesmo dentista.

### Status da consulta

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

---

## Pacientes

**Para que serve:** cadastro de pacientes e prontuário odontológico.

**Quem cadastra:** recepção, dentista e administrador.  
**Quem vê prontuário clínico:** recepção, dentista e administrador (visualizador vê só dados básicos).

### Lista de pacientes

- Busque pelo **nome**
- Botão **Novo paciente** (se seu perfil permitir)

### Cadastrar paciente novo

1. **Novo paciente**
2. Preencha nome, data de nascimento, telefone, e-mail e CPF (quando houver)
3. Marque o **consentimento LGPD** e informe o nome de quem autorizou
4. Salve

Sem o consentimento LGPD o cadastro não é concluído.

### Ficha do paciente (prontuário)

A ficha tem abas:

| Aba | Conteúdo |
| --- | -------- |
| **Resumo** | Dados cadastrais e visão geral |
| **Anamnese** | Questionário de saúde (histórico, alergias, medicamentos etc.) |
| **Odontograma** | Mapa dos dentes com condições registradas |
| **Evoluções** | Notas de cada atendimento, com foto e áudio |

#### Anamnese

- Formulário padronizado da clínica
- Se passou de **12 meses** desde a última atualização, o sistema avisa para revisar

#### Odontograma

- Toque ou clique no dente para registrar condição
- No celular: use zoom e arraste para navegar no mapa

#### Evoluções (somente dentista e administrador)

1. Abra a aba **Evoluções**
2. Crie uma nova evolução (se veio da agenda, a consulta já pode estar vinculada)
3. Opcional: tire **foto** (ex.: etiqueta de medicamento)
4. Opcional: **grave áudio** com a prescrição ou orientações
5. O áudio é transcrito automaticamente; aguarde alguns segundos na tela

**Dica para dentista:** prefira gravar o áudio no **celular**, com o aparelho perto da boca e ambiente silencioso.

### Abrir prontuário pela agenda

Na Agenda ou em Hoje, abra a consulta e use **Abrir prontuário**. Assim a evolução fica ligada ao horário correto.

---

## Fila Kanban

**Para que serve:** organizar pacientes que **esperam um encaixe** quando surge horário vago (cancelamento, desistência etc.).

**Quem opera:** recepção e administrador.  
**Quem só consulta:** dentista.

### As colunas

| Coluna | O que significa |
| ------ | --------------- |
| **Aguardando** | Paciente na fila, sem oferta ativa |
| **Oferta enviada** | Link enviado; paciente tem **40 minutos** para responder |
| **Agendado** | Paciente aceitou e consulta foi criada na agenda |

### Prioridade (cor do card)

Dentro de **Aguardando**, os cards são ordenados por urgência:

- **Vermelho:** mais urgente
- **Amarelo:** média
- **Verde:** menor urgência

### Fluxo típico

1. Recepção inclui paciente na fila (**Nova entrada**)
2. Surge horário livre (ex.: cancelamento na agenda)
3. Recepção usa **Oferecer vaga na fila**, escolhe paciente e horário
4. Sistema gera um **link**; recepção copia e envia ao paciente (WhatsApp, SMS etc.) **manualmente**
5. Paciente abre o link no celular, aceita os termos LGPD e responde **Aceitar** ou **Recusar**
6. Se aceitar: consulta **confirmada** aparece na Agenda e em Hoje
7. Se recusar ou o tempo expirar: card volta para **Aguardando**

O link expira em **40 minutos**. Depois disso a oferta perde validade sozinha.

---

## Estoque

**Para que serve:** controlar insumos (luvas, alginato, anestésico etc.) com saldo e QR code por pacote.

**Quem cadastra insumos:** administrador.  
**Quem registra compra e pacotes QR:** administrador e auxiliar de sala.  
**Quem escaneia retirada:** administrador e auxiliar de sala.  
**Quem só consulta saldo:** recepção e dentista (alertas também aparecem em Hoje).

### Lista de insumos

Cada item mostra:

- Nome e unidade (unidade, caixa, rolo, frasco)
- Saldo atual
- Situação: **OK**, **Abaixo do mínimo** ou **Zerado**

### Registrar compra (entrada de material)

1. Em Estoque, **Registrar compra**
2. Opcional: foto da planilha do fornecedor (referência visual; o sistema **não lê** a foto automaticamente)
3. Digite manualmente os itens, quantidades e lotes
4. Gere **etiquetas com QR** e imprima para colar nos pacotes

Cada pacote recebe um código único (ex.: `CR-XXXXXXXXXXXX`).

### Scan QR (retirada)

1. Abra **Scan QR** (ideal no celular da auxiliar)
2. Aponte a câmera traseira para o QR do pacote
3. Confirme a quantidade retirada
4. O saldo do insumo é atualizado na hora

**Modo contínuo:** após uma retirada, a câmera fica pronta para o próximo scan.

**Dica:** instale o ClinRoma na tela inicial do celular para abrir o scan com um toque.

---

## Lembretes pós-consulta (automático)

Quando uma consulta é marcada como **Concluída**, o sistema envia um **e-mail ao dentista** com:

- Nome parcial do paciente (por privacidade)
- Link para abrir o prontuário

Se o e-mail falhar, o **administrador** vê o aviso em **Hoje** e pode **Reenviar**.

Por enquanto o lembrete vai **só para o dentista**, não para o paciente.

---

## Próximo passo

Rotinas completas por função: [04-rotinas-do-dia-a-dia.md](./04-rotinas-do-dia-a-dia.md).
