# Spec · Encaixe na meia hora de medicação

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Status**       | draft                                                                 |
| **Data**         | 2026-10-06                                                            |
| **Slug**         | agenda-encaixe-medicacao                                              |
| **Plano origem** | `docs/plans/plano-agenda-encaixe-medicacao.md` (aprovado no chat em 2026-10-06) |
| **Fase**         | Fatia da agenda. Atualiza os docs da Fase 2 ao fechar. **Não** reabre a fase inteira. |
| **Autonomia**    | medium                                                                |

---

## 1. Contexto

Na Clínica Neo Roma, a recepção marca dois pacientes no mesmo dentista quando um vai para cirurgia e o outro faz um procedimento curto enquanto a medicação faz efeito. Os dois chegam no mesmo minuto. O paciente da cirurgia espera. O dentista atende o procedimento curto e, em seguida, fica com a cirurgia.

Hoje a agenda recusa qualquer cruzamento de dois horários ativos do mesmo dentista, com a mensagem **Horário indisponível para {dentista}**. A consulta guarda só a chegada e a saída do paciente. O nome do procedimento é texto livre. O calendário já empilha blocos que se cruzam. O que impede o caso da recepção é a regra, não o desenho da coluna.

A recepção não ganha um campo de medicação. Ela marca a cirurgia e, em seguida, o procedimento curto no mesmo início, com o fim que já digita hoje. Trinta minutos é o caso comum. Vinte, quarenta ou outro fim digitado seguem a mesma conta.

**Pré-requisito:** a agenda já distingue consulta ativa (Agendado, Confirmado, Em atendimento, Concluído, Faltou) de consulta fora da trava (Cancelado, Remarcado). A fila já recusa horário que cruza uma consulta ativa.

---

## 2. Objetivo

1. A recepção marca uma consulta que começa junto com outra já existente do mesmo dentista e termina antes do fim dela.
2. O sistema mostra o aviso e só grava se ela escolher **Marcar as duas**.
3. A consulta mais longa guarda o tempo de medicação, em minutos, igual à duração da mais curta. O dentista fica exclusivo depois desses minutos, até a saída do paciente. A mais curta guarda zero e ocupa o dentista do início ao fim dela.
4. Início diferente, horários iguais, terceira consulta no mesmo início e cruzamento no meio continuam bloqueados.
5. Oferta e aceite da fila seguem ocupando a visita inteira do paciente, da chegada à saída, sem este aviso.

**Valor entregue:** a recepção encaixa o procedimento curto no começo da cirurgia, com confirmação explícita, e o dentista não fica com dois atendimentos exclusivos ao mesmo tempo.

No exemplo canônico, a cirurgia fica com o paciente das 19:00 às 21:00 e o dentista exclusivo das 19:30 às 21:00. O procedimento curto ocupa 19:00 às 19:30. Os trechos exclusivos se encostam às 19:30 e não se cruzam.

---

## 3. Atores

| Ator | Interesse |
| ---- | --------- |
| Administrador | Marcar, editar e arrastar o par. Ver os dois blocos |
| Recepção | O mesmo, no dia a dia |
| Dentista | Ver os dois blocos na agenda e na lista do dia. Não marca |
| Visualizador | Ver os dois blocos. Não marca |
| Auxiliar de sala | Não entra na agenda |
| Paciente da fila | Aceita um horário oferecido. Não vê este aviso |
| Quem oferece vaga na fila | A janela do início da cirurgia continua ocupada |

---

## 4. Modelo de domínio

### 4.1 Dois tempos

A consulta continua sendo a visita do paciente: da chegada à saída.

O dentista tem um segundo tempo, o trecho exclusivo. Numa consulta comum, os dois tempos coincidem: o tempo de medicação é zero e o dentista está exclusivo da chegada à saída.

No par, só a consulta mais longa guarda o tempo de medicação. Esse valor é a duração da mais curta, em minutos. O trecho exclusivo da mais longa começa depois desses minutos e termina na saída do paciente. A mais curta permanece com zero.

O tempo de medicação é zero ou maior, e estritamente menor que a duração da visita. O trecho exclusivo nunca fica vazio.

Consultas já gravadas entram com tempo de medicação zero. A troca da trava não invalida a agenda atual.

### 4.2 O par

Há par quando, para o mesmo dentista, as duas consultas estão ativas, começam no mesmo minuto e uma termina antes da outra.

Os trechos exclusivos se encostam e não se cruzam. Encostar no minuto em que a mais curta termina e o trecho exclusivo da mais longa começa não é cruzamento.

O tempo de medicação mora só na mais longa. Se a edição inverter qual das duas é a mais longa, os minutos passam para a nova mais longa na mesma gravação, e a outra volta a zero.

### 4.3 Ordem da decisão

Para criar, editar ou arrastar, nesta ordem:

1. Já existem duas consultas ativas daquele dentista naquele início: bloqueio da terceira. Sem **Marcar as duas**.
2. O horário forma par com exatamente uma consulta ativa, e não cruza nenhuma outra de outro jeito: aviso. A gravação espera **Marcar as duas**.
3. O trecho exclusivo cruza outra consulta ativa do mesmo dentista, ou o horário cruza uma visita de um jeito que não é o par: bloqueio **Horário indisponível para {dentista}**.
4. O horário só encosta, ou não encontra outra visita ativa daquele dentista: grava como consulta comum, com tempo de medicação zero.

A confirmação só autoriza o par do item 2, naquele formato. Ela não autoriza a terceira, o cruzamento no meio, o início diferente nem duas visitas com o mesmo começo e o mesmo fim.

Outro dentista no mesmo horário não entra nessa conta.

### 4.4 O que muda na outra consulta

A gravação do par deixa as duas certas juntas. No fim, só a mais longa tem os minutos. A mais curta tem zero.

Editar ou arrastar uma das duas passa de novo pela mesma ordem.

| Resultado da alteração | O que acontece |
| ---------------------- | -------------- |
| Continua um par válido | Aviso de novo. Com **Marcar as duas**, os minutos são recalculados na mais longa |
| Cruza de um jeito que não é o par, ou vira a terceira | A alteração é recusada. As duas ficam como estavam |
| Deixa de cruzar a outra | Grava. O tempo de medicação das duas volta a zero |
| Uma das duas é cancelada | A que permanece ativa volta a ocupar o dentista da chegada à saída |

Cancelado e Remarcado continuam fora da trava. Não formam par e não seguram o dentista.

### 4.5 Fila, lembrete e mensagem

A oferta e o aceite ocupam a visita inteira, da chegada à saída, inclusive a janela em que o paciente da cirurgia espera a medicação. Não usam o par e não abrem o aviso.

Lembrete e mensagem ao paciente continuam na chegada. No exemplo, os dois pacientes são chamados para as 19:00.

---

## 5. Matriz de acesso

Quem escreve na agenda é administrador e recepção. Esta fatia não muda o que cada papel pode abrir.

| Ação | Admin | Recepção | Dentista | Visualizador | Auxiliar |
| ---- | :---: | :------: | :------: | :----------: | :------: |
| Ver os dois blocos e a lista do dia | Sim | Sim | Sim | Sim | Não entra |
| Criar, editar, arrastar e confirmar o par | Sim | Sim | Não | Não | Não entra |
| Oferecer horário na fila | Como hoje | Como hoje | Como hoje | Como hoje | Como hoje |
| Aceitar horário pelo link | O paciente, como hoje | | | | |

Dentista e visualizador veem o par. Não veem o aviso, porque não gravam. Se um pedido de gravação chegar mesmo assim, o servidor recusa, como já recusa escrita na agenda.

---

## 6. Escopo funcional

### 6.1 Criar

O formulário de horário permanece o de hoje. Sem campo de medicação.

A recepção marca a cirurgia, por exemplo 19:00 às 21:00. Em seguida marca o procedimento curto no mesmo início, 19:00 até o fim que ela digitar. O aviso aparece. **Voltar** fecha o aviso e mantém o formulário, sem gravar. **Marcar as duas** grava as duas.

Se a cirurgia for marcada depois do procedimento curto, o mesmo aviso aparece. Os minutos ficam na mais longa, e a janela exclusiva passa a ter o tamanho da mais curta.

### 6.2 Editar

Editar horário, dentista ou duração de qualquer uma das duas passa pela ordem do §4.3.

Se o par continua válido, o aviso abre de novo. Os nomes trocam de papel em relação à criação: a consulta que está sendo editada entra como a que já está na agenda, e a outra entra como a que a pergunta pede para manter junto. **Marcar as duas** grava e recalcula. **Voltar** não grava.

Se a edição muda o dentista, a conta recomeça no dentista novo. No dentista anterior, a consulta que ficou sem par volta a tempo de medicação zero.

### 6.3 Arrastar

O arraste que forma o par abre o aviso de medicação. Essa é a única confirmação desse gesto: a pergunta genérica de remarcar não aparece junto.

**Marcar as duas** grava no lugar novo e recalcula os minutos. **Voltar** devolve o bloco para onde estava.

O arraste que cai no bloqueio não oferece **Marcar as duas**. O bloco volta. A pessoa vê a mensagem do §6.7.

O arraste que afasta uma consulta da outra, sem cruzar, segue a remarcação que já existe e zera o tempo de medicação das duas.

### 6.4 Calendário e lista do dia

No calendário, os dois blocos ficam empilhados na coluna daquele dentista: o curto ao lado do topo do longo. O ajuste do calendário só entra se o empilhamento atual não fizer isso.

Na lista do dia, as duas entram em ordem de início. Nenhuma fica escondida atrás da outra.

### 6.5 Fila

Oferta e aceite não abrem o aviso. Um horário que cai dentro da visita, da chegada à saída, continua indisponível. A janela das 19:00 às 19:30 de uma cirurgia com meia hora de medicação não vira vaga.

### 6.6 Textos

| Situação | O que a pessoa vê |
| -------- | ----------------- |
| Par, na criação | Título **Já existe uma consulta nesse horário**. Corpo **{Paciente existente} já está marcado com {dentista} das {início} às {fim}. Deseja marcar {paciente novo} também, das {início novo} às {fim novo}?** Linha de apoio **Isso serve para o início de uma cirurgia, enquanto a medicação faz efeito.** Botões **Marcar as duas** e **Voltar** |
| Par, na edição ou no arraste | O mesmo título, a mesma linha de apoio e os mesmos botões. No corpo, os nomes trocam de papel, como no §6.2 |
| Terceira consulta naquele início | **Esse horário já tem duas consultas. Não é possível marcar outra.** Sem **Marcar as duas** |
| Cruzamento no meio, início diferente ou horários iguais | **Horário indisponível para {dentista}** |
| Fila | O aviso de horário indisponível que a fila já usa. Sem o texto de medicação |

{Paciente existente}, na criação, é quem já está na agenda. {Paciente novo} é quem está no formulário. Os horários usam o relógio da clínica, no formato que a agenda já mostra. Copy em pt-BR, sem travessão.

Enquanto a gravação não volta, um segundo toque em **Marcar as duas** não grava de novo. Os botões do aviso têm alvo de toque de 44 px.

---

## 7. Fora de escopo

- Medicação no fim da cirurgia.
- Terceira consulta no mesmo início.
- Cruzamento com inícios diferentes.
- Sala, cadeira ou catálogo de procedimentos.
- Quebrar a cirurgia em duas consultas.
- Soltar a trava para qualquer sobreposição.
- Mudança em lembrete ou mensagem ao paciente.
- Campo de medicação no formulário.
- Reabrir ou fechar a Fase 2 inteira. Os docs da fase só registram esta fatia, ao fechar.

---

## 8. Caminhos felizes

### 8.1 Cirurgia primeiro

1. A recepção marca a cirurgia das 19:00 às 21:00. A consulta grava como visita comum.
2. Ela marca o procedimento curto do outro paciente, das 19:00 às 19:30, no mesmo dentista.
3. O aviso nomeia o paciente da cirurgia e pergunta se marca o curto também.
4. Ela escolhe **Marcar as duas**.
5. A cirurgia fica com 30 minutos de medicação e dentista exclusivo das 19:30 às 21:00. O curto fica com zero e ocupa das 19:00 às 19:30.
6. Os dois blocos aparecem na coluna, o curto ao lado do topo do longo, e os dois entram na lista do dia.

### 8.2 Procedimento curto primeiro

1. A recepção marca primeiro o curto, das 19:00 às 19:30.
2. Marca a cirurgia das 19:00 às 21:00.
3. O mesmo aviso aparece.
4. Com **Marcar as duas**, os minutos ficam na cirurgia. O curto permanece com zero.

### 8.3 Outra duração

1. O fim digitado do curto é 19:20, 19:40 ou outro minuto anterior ao fim da cirurgia, com o mesmo início.
2. A conta é a mesma. Os minutos da mais longa são a duração da mais curta.

### 8.4 Editar o par

1. A recepção abre a consulta curta e altera o fim para 19:40, ainda começando às 19:00, com a cirurgia até 21:00.
2. O aviso abre com os nomes trocados.
3. **Marcar as duas** grava. A cirurgia passa a ter 40 minutos de medicação.

### 8.5 Arrastar o par

1. A recepção arrasta o curto para um início que coincide com outra consulta mais longa do mesmo dentista, terminando antes do fim dela.
2. O aviso de medicação é a confirmação do arraste.
3. **Marcar as duas** grava o par e recalcula os minutos.

### 8.6 Afastar uma das duas

1. A recepção move o curto para um horário que não cruza a cirurgia.
2. A remarcação comum grava.
3. A cirurgia volta a ocupar o dentista das 19:00 às 21:00.

---

## 9. Erros e bordas

| Situação | Comportamento |
| -------- | ------------- |
| Sem **Marcar as duas** | Nada é gravado. **Voltar**, fechar o aviso ou ausência da confirmação deixam a agenda como estava |
| Confirmação de um formato e gravação de outro | A gravação é recusada. A confirmação só vale para aquele par |
| Terceira consulta no mesmo início | **Esse horário já tem duas consultas. Não é possível marcar outra.** Sem botão de confirmar |
| Mesmo início e mesmo fim | **Horário indisponível para {dentista}**. O trecho exclusivo não fica vazio |
| Começa depois e invade o meio | **Horário indisponível para {dentista}** |
| Começa junto com uma e ainda cruza outra consulta do mesmo dentista | Bloqueio de horário indisponível. O aviso do par não abre |
| Início diferente, sem cruzar | Grava como consulta comum |
| Encosta no minuto em que o exclusivo começa | Grava sem aviso |
| Cancelar uma das duas | A que fica volta a tempo de medicação zero e ocupa o dentista a visita inteira |
| Editar ou arrastar até o par deixar de ser válido, ainda cruzando | Recusa. Minutos e horários anteriores permanecem |
| Duas consultas ativas no mesmo início e uma terceira inativa (Cancelado ou Remarcado) | A inativa não conta. O par com a que está ativa pode ser confirmado |
| Outro dentista no mesmo horário | Cada um segue a própria conta |
| Oferta ou aceite dentro da visita, inclusive na janela da medicação | Horário indisponível da fila. Sem aviso de medicação |
| Oferta exatamente quando o exclusivo da cirurgia começa (19:30 no exemplo) | Continua ocupado, porque o paciente da cirurgia segue na clínica |
| Lembrete e mensagem | Seguem na chegada das duas consultas |
| Dentista ou visualizador | Veem os blocos. Não gravam |
| Pedido de gravação sem permissão de escrita | Recusa, como a agenda já recusa |
| Segundo toque em **Marcar as duas** enquanto grava | Ignorado |
| Entre o aviso e a gravação, alguém marca a terceira | A gravação volta com a mensagem da terceira. O par parcial não fica |
| Entre o aviso e a gravação, a outra consulta é cancelada | A que está sendo marcada grava como consulta comum, com tempo de medicação zero |
| Consultas já existentes | Permanecem com tempo de medicação zero |

---

## 10. Critérios de Done

- [ ] Criar a cirurgia e, em seguida, o curto no mesmo início mostra o aviso. **Marcar as duas** grava. **Voltar** não grava.
- [ ] Marcar a mais longa depois da mais curta usa o mesmo aviso. Os minutos ficam na mais longa, iguais à duração da mais curta. A mais curta fica com zero.
- [ ] Vinte, quarenta ou o fim digitado seguem a mesma conta, desde que a mais curta comece junto e termine antes.
- [ ] Os trechos exclusivos se encostam e não se cruzam. O tempo de medicação é menor que a duração da visita.
- [ ] Início diferente com cruzamento, horários iguais e invasão do meio mostram **Horário indisponível para {dentista}**, sem **Marcar as duas**.
- [ ] A terceira no mesmo início mostra **Esse horário já tem duas consultas. Não é possível marcar outra.**
- [ ] Editar e arrastar qualquer uma das duas passam de novo pela mesma ordem. O arraste do par pede só o aviso de medicação. **Voltar** devolve o bloco.
- [ ] Afastar ou cancelar uma das duas zera o tempo de medicação da que permanece.
- [ ] A confirmação no cliente não basta: a gravação sem a confirmação daquele par não insere. A confirmação não fura a terceira nem o cruzamento.
- [ ] Oferta e aceite da fila ocupam a visita inteira. A janela da medicação não aparece como vaga e não abre o aviso.
- [ ] Lembrete e mensagem continuam na chegada.
- [ ] Calendário: curto ao lado do topo do longo. Lista do dia: as duas em ordem de início.
- [ ] Consultas já gravadas permanecem válidas, com tempo de medicação zero.
- [ ] Formulário sem campo de medicação. Copy pt-BR, sem travessão, com os textos do §6.6. Alvo de toque de 44 px nos botões do aviso.
- [ ] Testes da regra: par pede confirmação; início diferente, horário igual, terceira e invasão do meio continuam conflito; encostar no minuto passa sem aviso; sem confirmação não grava; com confirmação os minutos ficam só na mais longa; fila ocupa a visita inteira.
- [ ] `npm run lint` nos arquivos tocados, `npm run build` e `npm run test` passam.
- [ ] Homologação na agenda: criar, editar e arrastar o par; tentar a terceira; conferir que a fila não oferece a janela do início.
- [ ] Nenhum arquivo fora do §11.
- [ ] Ao fechar a fatia: atualizar `docs/implementation/F2-agenda.md`, `docs/manual-dev/04-fase-2-agenda.md`, os índices desses docs e `docs/state/PENDENCIAS.md`.

---

## 11. Escopo de arquivos permitidos

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `supabase/migrations/031_appointment_induction.sql` | Tempo de medicação, trecho exclusivo do dentista e trava reapontada para esse trecho. Consultas atuais entram com zero |
| `src/features/agenda/components/overlap-confirm-dialog.tsx` | Aviso do par, no criar, no editar e no arrastar |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/agenda/domain/appointment-conflict.ts` | A regra compara o trecho exclusivo e reconhece o par |
| `src/features/agenda/domain/appointment-conflict.test.ts` | Par, terceira, cruzamento, horário igual e encoste |
| `src/features/agenda/actions.ts` | Criar, editar, arrastar e cancelar: aviso sem gravar, gravação do par, recálculo e zeragem |
| `src/features/agenda/actions.test.ts` | Sem confirmação não grava. Com confirmação, os minutos ficam na mais longa. A terceira não confirma |
| `src/features/agenda/schemas.ts` | A confirmação explícita do par entra no que criar, editar e arrastar aceitam |
| `src/features/agenda/schemas.test.ts` | A confirmação ausente ou presente |
| `src/features/agenda/queries.ts` | A agenda lê o tempo de medicação para recalcular o par |
| `src/features/agenda/types.ts` | O intervalo da consulta carrega o tempo de medicação |
| `src/lib/supabase/database.types.ts` | Tipos alinhados ao registro novo |
| `src/features/agenda/components/appointment-form.tsx` | O aviso no criar e no editar. O formulário segue sem campo de medicação |
| `src/features/agenda/components/agenda-view.tsx` | O aviso no arraste, no lugar da pergunta genérica quando o gesto forma o par |
| `src/features/agenda/components/reschedule-confirm-dialog.tsx` | O arraste comum permanece. O par usa o aviso de medicação |
| `src/features/waitlist/actions.ts` | A oferta ocupa a visita inteira e não abre o aviso |
| `src/features/waitlist/lib/accept-slot-offer.ts` | O aceite ocupa a visita inteira e não abre o aviso |
| `src/features/agenda/components/agenda-calendar.tsx` | Somente se o empilhamento atual não colocar o curto ao lado do topo do longo |

No fechamento da fatia, somente estes documentos vivos:

| Arquivo | Motivo |
| ------- | ------ |
| `docs/implementation/F2-agenda.md` e `docs/implementation/README.md` | O que esta fatia entregou |
| `docs/manual-dev/04-fase-2-agenda.md` e `docs/manual-dev/README.md` | Como a recepção marca o par |
| `docs/state/PENDENCIAS.md` | Homologação que ainda depender de pessoa |

### Proibido nesta feature

- Lembrete, mensagem ao paciente e os jobs que já disparam.
- Catálogo de procedimento, sala, cadeira e quebra da cirurgia em duas consultas.
- Campo de medicação no formulário.
- Oferta ou aceite da fila com o aviso do par, ou tratando a janela da medicação como vaga.
- `.env`, `.env.example` e credencial de serviço.
- `docs/PLANO.md` e specs de outras fatias.
- Qualquer arquivo fora das tabelas acima. O calendário só entra na condição descrita.

**Branch sugerida (após aprovação):** `feature/agenda-encaixe-medicacao`.

---

## 12. Decisões fechadas

| # | Decisão |
| - | ------- |
| 1 | A visita do paciente vai da chegada à saída. O trecho exclusivo do dentista é o que a trava da agenda compara |
| 2 | O tempo de medicação mora só na consulta mais longa e é igual à duração da mais curta. A curta fica com zero |
| 3 | Trinta minutos é o caso da recepção. Outra duração vale se a mais curta começa junto e termina antes |
| 4 | A fila ocupa a visita inteira. A janela da medicação não é vaga |
| 5 | A gravação do par só ocorre com **Marcar as duas** para aquele formato. Sem isso, nada muda |
| 6 | A terceira, o horário igual, o início diferente com cruzamento e a invasão do meio continuam bloqueados |
| 7 | Encostar no minuto não é cruzamento |
| 8 | Cancelar ou afastar uma das duas zera o tempo de medicação da que permanece |
| 9 | No arraste que forma o par, o aviso de medicação é a única confirmação |
| 10 | Lembrete e mensagem seguem na chegada |
| 11 | Os docs da Fase 2 entram ao fechar a fatia |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| A troca da trava invalidar consultas já gravadas | Todas entram com tempo de medicação zero. O trecho exclusivo continua a visita inteira |
| A fila passar a olhar só o trecho exclusivo e oferecer a janela das 19:00 às 19:30 | Oferta e aceite seguem na visita inteira (§4.5, §6.5) |
| Editar uma das duas e deixar a outra com minutos velhos, a ponto de a trava recusar um par que a tela confirmou | A mesma gravação recalcula as duas. No fim, só a mais longa tem os minutos (§4.4) |
| A mais longa ficar com tempo de medicação igual à visita inteira | Horários iguais continuam bloqueados. O valor é estritamente menor que a duração (§4.1) |
| O aviso gravar sozinho | Sem **Marcar as duas**, a gravação não ocorre. A confirmação não autoriza outro formato (§4.3) |
| O arraste pedir duas confirmações | No par, só o aviso de medicação (§6.3) |
| O calendário esconder o curto atrás do longo | Os blocos ficam empilhados, o curto ao lado do topo. A lista mostra os dois (§6.4) |

---

## 14. Referências

- Plano aprovado: `docs/plans/plano-agenda-encaixe-medicacao.md`
- Research de origem: `docs/plans/research-agenda-encaixe-medicacao.md`
- Agenda já entregue: `docs/implementation/F2-agenda.md` e `docs/manual-dev/04-fase-2-agenda.md`
- Trava atual do horário: `supabase/migrations/010_appointment_conflict.sql`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Status atual:** `draft`.

A implementação começa somente depois da aprovação explícita desta spec no chat. A branch sugerida é `feature/agenda-encaixe-medicacao`.
