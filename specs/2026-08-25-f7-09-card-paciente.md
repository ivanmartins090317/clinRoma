# Spec · F7-09 · Card do paciente (resumo clínico)

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-25                                         |
| **Slug**         | f7-09-card-paciente                                |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 1                 |
| **Fase**         | 7 de `docs/PLANO.md`                               |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`   |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)                  |

---

## 1. Contexto

A Fase 3 entregou a ficha do paciente com um **resumo cadastral** no topo (nome, nascimento, CPF, contato, LGPD). O conteúdo clínico fica nas abas. Na demo de 2026-08-25 o Felipe pediu um **resumo clínico rápido no card**: o dentista precisa ver a **anamnese vigente** e o **último procedimento** sem abrir as abas.

Hoje, para saber se a paciente tem alergia ou o que foi feito da última vez, a equipe entra em Anamnese ou Evoluções. Isso atrasa o olhar inicial no consultório.

Esta spec cobre **apenas F7-09**. Não inclui transcrição, segundo telefone, busca, odontograma cruz, questionário papel, WhatsApp nem e-mail financeiro.

**Pré-requisito:** ficha da Fase 3 no `main` (cadastro, anamnese versionada, evoluções, agenda com consulta concluída e nome de procedimento). F7-07 (segundo telefone no resumo cadastral) pode já estar na branch; esta fatia **não** altera esses campos.

**Dependência futura:** o questionário papel (F7-03) ainda não está nesta fatia. O recorte precisa funcionar com a anamnese **já existente** (texto livre) e já definir como o mesmo card se comporta quando a versão vigente for o questionário Sim/Não, para a F7-03 não redesenhar o card.

---

## 2. Objetivo

No topo da ficha, abaixo (ou junto) dos dados cadastrais, mostrar um **recorte clínico de uma olhada**: anamnese vigente + último procedimento, com alerta se a anamnese passou de 12 meses, e um toque que leva à aba correspondente.

**Valor entregue:** o dentista lê o essencial do paciente **sem entrar nas abas**.

---

## 3. Atores

| Ator             | Interesse |
| ---------------- | --------- |
| Dentista         | Ver alergias, medicamentos, doenças e o último procedimento ao abrir a ficha, no celular |
| Recepção         | Mesma leitura, para contextualizar o atendimento |
| Administrador    | Mesma leitura, para suporte |
| Visualizador     | Vê só o cadastro; **não** vê o recorte clínico |
| Auxiliar de sala | Sem módulo de pacientes; fora desta feature |
| Paciente         | Não usa esta tela |

---

## 4. Modelo de domínio

### 4.1 O que é o card

O **card do paciente** é o bloco do topo da ficha. Continua com o resumo cadastral. Esta feature acrescenta dois blocos clínicos:

| Bloco | Papel |
| ----- | ----- |
| **Anamnese** | Recorte da **versão vigente** (a mais recente assinada). Não é o formulário inteiro. |
| **Último procedimento** | O que foi feito da última vez que o atendimento **concluiu**, com data. |

A lista de pacientes **não** ganha esse recorte nesta fase.

### 4.2 Versão vigente da anamnese

A versão vigente é a anamnese **mais recente** daquele paciente (pela data de assinatura; se faltar assinatura, pela data de registro).

O recorte **nunca** lista o histórico de versões. Só a vigente.

Validade: a mesma regra já usada na ficha, **12 meses** a partir da assinatura.

| Situação | No card |
| -------- | ------- |
| Sem nenhuma anamnese | Estado vazio + atalho para a aba Anamnese. Alerta de desatualizada (ausente). |
| Vigente com menos de 12 meses | Data + recorte. Sem alerta. |
| Vigente com mais de 12 meses | Data + recorte **e** alerta de desatualizada. Não esconde o recorte. |
| Assinatura inválida ou ausente | Trata como ausente / desatualizada, igual à regra já existente da ficha. |

O alerta **não bloqueia** atendimento (igual à Fase 3).

### 4.3 Recorte da anamnese (o que entra)

O card mostra **somente** o recorte abaixo. Campos vazios (depois de remover espaços nas pontas) **não aparecem**.

**Sempre**

- Data da versão vigente (dia/mês/ano em pt-BR).
- Alerta se desatualizada ou ausente.

**Questionário de texto livre (versão hoje em produção)**

| Linha | Origem |
| ----- | ------ |
| Alergias | Texto de alergias da vigente |
| Medicamentos | Texto de medicamentos da vigente |
| Doenças | Texto de doenças / condições sistêmicas da vigente |

Não há respostas Sim/Não nesse questionário: o bloco de “Sim relevantes” **não aparece**.

**Questionário papel Sim/Não (quando a vigente for essa versão, F7-03)**

| Linha | Origem |
| ----- | ------ |
| Doenças | Nomes das doenças **marcadas** na lista “Já foi acometido…”. Se nenhuma marcada, omite a linha. |
| Medicamentos | Se a pergunta de medicamento estiver **Sim**, o complemento (`Qual(is)?`). Se Sim sem complemento, mostra só que está em uso. Se Não, omite a linha. |
| Alergias | Se a pergunta de alergia estiver **Sim**, o complemento (`Qual(is)?`). Se Sim sem complemento, mostra só que tem alergia. Se Não, omite a linha. |
| Sim relevantes | Até **5** perguntas com resposta **Sim**, na ordem de relevância da §4.4. Se houver menos de 5, mostra as que existirem. Se nenhuma, omite o bloco. |

O card **não** lista perguntas Não, **não** lista complementos de perguntas Não, **não** mostra a declaração nem a assinatura.

### 4.4 Ordem dos Sim relevantes

Só vale para o questionário papel. Só entram respostas **Sim**. Ordem fixa (a mais crítica primeiro); o card pega as primeiras até o teto de 5:

1. Está grávida?
2. Tem alguma alergia?
3. Já apresentou alguma reação a algum medicamento?
4. A pressão é alta?
5. Mesmo não estando em tratamento, está tomando algum medicamento?
6. Apresentou hemorragia em cirurgias anteriores?
7. Perde muito sangue ao cortar-se?
8. Está ou esteve recentemente sob cuidados médicos?
9. Já foi hospitalizado? Sofreu cirurgia?
10. Sofre de asma brônquica?
11. Já teve algum desmaio ou convulsão?
12. Considera-se nervoso? Já tomou sedativos?

Cada item no card é o **texto da pergunta** (curto o bastante para caber no celular). Complemento, se houver e estiver preenchido, pode ir na mesma linha depois de dois-pontos (ex.: alergia: dipirona).

Doenças da lista multi checkbox **não** entram neste bloco: já têm a linha “Doenças”.

### 4.5 Último procedimento

Uma única linha de origem, nesta ordem:

1. **Consulta concluída** mais recente **deste paciente** (pela data/hora de início).
2. Se essa consulta tem **nome de procedimento** preenchido: mostrar o nome + a data da consulta.
3. Se não há consulta concluída, **ou** a mais recente concluída **não** tem nome de procedimento: usar a **última evolução** deste paciente (pela data de registro). Mostrar um **trecho** do texto + a data da evolução. Preferir a evolução vinculada àquela consulta concluída, se existir; senão, a evolução mais recente do paciente.
4. Se não há consulta concluída nem evolução: estado vazio.

Regras:

- Consultas agendadas, confirmadas, canceladas, remarcadas ou falta **não** contam.
- O trecho da evolução tem no máximo **120** caracteres, com reticências se cortar no meio. Sem inventar título: a evolução da Fase 3 é texto livre.
- A data no card é dia/mês/ano em pt-BR.
- O recorte **não** lista o histórico de consultas nem todas as evoluções.

### 4.6 Navegação a partir do card

| Onde toca | Destino |
| --------- | ------- |
| Bloco Anamnese (incluindo estado vazio) | Aba **Anamnese** da mesma ficha |
| Bloco Último procedimento (incluindo estado vazio) | Aba **Evoluções** da mesma ficha |

Não abre outra ficha, não abre a agenda, não abre a lista de pacientes.

### 4.7 O que o card não é

- Não é o formulário de anamnese.
- Não é a timeline de evoluções.
- Não é busca no histórico (F7-02).
- Não é escrita clínica: o card só lê e navega.

---

## 5. Matriz de acesso

O recorte é **conteúdo clínico**. Quem já lê o prontuário vê o card; quem não lê, não vê.

| Ação                                      | admin | dentist | reception | viewer | auxiliar |
| ----------------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver resumo cadastral no topo              |  Sim  |   Sim   |    Sim    |  Sim   |   Não    |
| Ver recorte de anamnese e último procedimento | Sim |   Sim   |    Sim    |  Não   |   Não    |
| Tocar e ir para a aba Anamnese / Evoluções | Sim |   Sim   |    Sim    |  Não   |   Não    |
| Alterar anamnese ou evolução pelo card    |  Não  |   Não   |    Não    |  Não   |   Não    |

A recusa vale na interface **e** no servidor: o recorte clínico **não é montado** para papel sem permissão de leitura clínica. Falha segura: visualizador não recebe o recorte.

A auditoria de **leitura** da ficha já existe ao abrir o prontuário. Esta feature **não** cria um segundo registro só por renderizar o card.

---

## 6. Escopo funcional

### 6.1 Topo da ficha

No card já existente (nome, CPF, contato, LGPD, segundo telefone se houver):

- dois blocos novos, visíveis **sem escolher aba**;
- títulos **Anamnese** e **Último procedimento**;
- cada bloco é um controle acionável (botão ou ligação) com alvo de toque confortável no celular;
- o cadastro no topo **não muda** (F7-07 permanece).

### 6.2 Montagem do recorte

1. Equipe autenticada com leitura clínica abre a ficha.
2. Sistema monta o recorte **no servidor**: versão vigente da anamnese + consulta concluída mais recente +, se necessário, uma evolução para o trecho.
3. A interface do card recebe **só o recorte** (datas, alerta, linhas curtas, nome ou trecho, identificador da evolução se houver para o atalho). Não recebe o formulário inteiro nem a lista de evoluções.
4. Visualizador abre a mesma ficha e **não** vê os dois blocos.

### 6.3 Paciente seed (Maria)

O caminho de demonstração da spec pai é: abrir **Maria Silva** e ver anamnese vigente + último procedimento **sem entrar nas abas**.

Hoje o seed de Maria tem anamnese e uma consulta **confirmada** (não concluída). Esta feature **acrescenta** no seed de desenvolvimento, de forma incremental, uma **consulta concluída no passado** da Maria, com nome de procedimento preenchido. Não reescreve o seed antigo da agenda do dia.

### 6.4 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Título: `Anamnese`
- Título: `Último procedimento`
- Alerta: `Anamnese desatualizada (mais de 12 meses).`
- Ausente: `Nenhuma anamnese registrada.`
- Sem procedimento: `Nenhum procedimento registrado.`
- Rótulo: `Alergias`
- Rótulo: `Medicamentos`
- Rótulo: `Doenças`
- Rótulo: `Atenção` (bloco dos Sim relevantes)
- Atalho (acessível): `Abrir anamnese`
- Atalho (acessível): `Abrir evoluções`

---

## 7. Fora de escopo

- F7-01, F7-02, F7-03, F7-04, F7-05, F7-06, F7-07, F7-08.
- Redesenhar o questionário de anamnese (o papel Sim/Não é F7-03). Esta fatia só **lê** a vigente e recorta.
- Mostrar o recorte na **lista** de pacientes.
- Histórico completo de anamneses ou de consultas no card.
- Odontograma no card.
- Escrita (nova anamnese, nova evolução, marcar consulta como concluída) a partir do card.
- Busca `dente 24`.
- Playwright.
- Fechamento documental da Fase 7 inteira.

---

## 8. Fluxos

### 8.1 Caminho feliz · Abrir Maria e ler o card

1. Dentista autentica e abre a ficha de **Maria Silva** (pela lista ou pela agenda).
2. Sem tocar em nenhuma aba, o topo mostra:
   - cadastro (nome, CPF, contato, LGPD);
   - bloco **Anamnese** com a data da vigente e o recorte (alergias, medicamentos, doenças quando preenchidos);
   - bloco **Último procedimento** com o nome da consulta concluída do seed e a data.
3. Não há alerta de 12 meses (a vigente da Maria no seed está dentro do prazo).

**Pronto quando este fluxo passa.**

### 8.2 Caminho feliz · Atalho para as abas

1. No mesmo card, o dentista toca o bloco Anamnese.
2. A ficha vai para a aba **Anamnese** (formulário / histórico já existentes).
3. Volta ao topo (ou recarrega), toca Último procedimento.
4. A ficha vai para a aba **Evoluções**.

### 8.3 Caminho feliz · Consulta concluída sem nome, cai na evolução

1. Paciente tem uma consulta concluída **sem** nome de procedimento e uma evolução (vinculada a essa consulta, ou a mais recente).
2. O bloco Último procedimento mostra o **trecho** da evolução e a data da evolução.

### 8.4 Caminho feliz · Sem consulta concluída, só evolução

1. Paciente nunca teve consulta concluída, mas tem evolução.
2. O bloco mostra o trecho da última evolução e a data.

### 8.5 Caminho feliz · Ficha nova, sem clínica ainda

1. Recepção abre um paciente recém-cadastrado, sem anamnese, sem consulta concluída, sem evolução.
2. Anamnese: `Nenhuma anamnese registrada.` + alerta de desatualizada/ausente.
3. Último procedimento: `Nenhum procedimento registrado.`
4. Os atalhos para as abas continuam disponíveis para quem lê o prontuário.

### 8.6 Caminho feliz · Anamnese velha

1. A vigente tem assinatura há mais de 12 meses.
2. O card mostra o recorte **e** o alerta `Anamnese desatualizada (mais de 12 meses).`
3. Evolução e odontograma **não** são bloqueados (comportamento atual).

### 8.7 Caminho feliz · Visualizador

1. Visualizador abre a ficha de Maria.
2. Vê o resumo cadastral.
3. **Não** vê Anamnese nem Último procedimento no card.
4. **Não** vê as abas clínicas (comportamento atual).

### 8.8 Caminho feliz · Recepção lê

1. Recepção abre a mesma ficha.
2. Vê o recorte clínico (somente leitura).
3. Os atalhos abrem as abas. A recepção continua sem registrar evolução (regra da Fase 3).

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Visualizador (ou auxiliar) tenta obter o recorte | Não monta; sem dado clínico na resposta | Matriz §5; fail secure |
| Sessão expirada | Volta ao login; nada clínico vaza | Comportamento atual do app |
| Paciente inexistente | Recusa genérica, sem vazar se havia anamnese | Autorização + políticas de acesso |
| Vigente é texto livre | Recorte §4.3 (alergias, medicamentos, doenças). Sem bloco Sim | Discriminar pelo formato da vigente |
| Vigente é questionário papel | Recorte §4.3 + Sim relevantes §4.4 | Mesma função de recorte; testes com os dois formatos |
| Mais de 5 Sim na lista de relevância | Mostra só os 5 primeiros da ordem §4.4 | Teto |
| Doença marcada e também Sim de pressão alta | Doença na linha Doenças; pressão alta pode aparecer nos Sim | Sem deduplicar nesta fatia |
| Alergia/medicamento “Nenhuma conhecida” no texto livre | Mostra o texto (está preenchido) | Omitir só vazio |
| Consulta confirmada de hoje, concluída antiga | Último procedimento é a **concluída**, não a confirmada | §4.5 |
| Várias concluídas | A de início mais recente | §4.5 |
| Evolução com texto enorme | Corta em 120 caracteres + reticências | §4.5 |
| Evolução só com espaços | Trata como sem texto; cai no próximo fallback ou estado vazio | Trim |
| Falha ao ler agenda ou prontuário | Ficha cadastral permanece; blocos clínicos com estado vazio ou mensagem amigável, sem quebrar a página | Não derrubar o cadastro |
| Logs / Sentry | Sem corpo da anamnese, sem trecho completo da evolução, sem CPF | Só identificadores (paciente, se há vigente, se há procedimento) |
| Card pesado | Interface recebe só o recorte; não serializa o formulário nem todas as evoluções no card | Risco do plano; §6.2 |
| Lista de pacientes | Inalterada | Fora de escopo §7 |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho feliz §8.1: abrir Maria mostra anamnese vigente e último procedimento **sem entrar nas abas**.
- [ ] Caminho feliz §8.2: toque no bloco Anamnese abre a aba Anamnese; toque no último procedimento abre a aba Evoluções.
- [ ] Caminhos §8.3, §8.4 e §8.5: fallback consulta sem nome → evolução; só evolução; ficha vazia.
- [ ] Caminho §8.6: vigente com mais de 12 meses mostra recorte + alerta, sem bloquear o restante da ficha.
- [ ] Matriz §5: visualizador não vê o recorte; recepção e dentista vêem; recorte não montado no servidor para quem não lê clínica.
- [ ] Recorte de texto livre e recorte de questionário papel cobertos em regra de domínio (Vitest), incluindo teto de 5 Sim e ordem §4.4.
- [ ] Último procedimento: concluída com nome; concluída sem nome; só evolução; vazio. Testado em domínio.
- [ ] Validade de 12 meses reutiliza a regra já existente (não inventar outro prazo).
- [ ] Seed incremental: Maria passa a ter consulta concluída no passado com nome de procedimento. Migrations antigas **não** são editadas.
- [ ] Auditoria: sem segundo log só pelo card; abertura da ficha continua auditando leitura como hoje. Logs sem PHI.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor, fail secure, sem corpo de anamnese em logs, sem segredo no cliente.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas.
- [ ] `docs/state/PENDENCIAS.md`: item **F7-09** marcado como implementado; homologação em dispositivo real, se pendente, na seção de homologação.

### Qualidade

- [ ] Dois blocos usáveis no celular (alvo ≥ 44 px; texto 16 px nos atalhos).
- [ ] Viewport estreito: cadastro + anamnese + último procedimento sem esconder o nome do paciente.
- [ ] Recorte cabe em uma olhada: sem wall of text (teto de linhas da §4.3 / §4.4).

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (ficam no fechamento da Fase 7; viewport mobile nesta fatia basta).
- Entregar o questionário papel na UI (F7-03). Os testes de domínio do formato Sim/Não **sim** são exigidos, com dados de exemplo.
- Docs `docs/implementation/F7-*.md` e capítulo `docs/manual-dev/` da Fase 7 inteira (só no fechamento da fase). Registro curto desta fatia é permitido se o fluxo de close-phase da fatia já estiver em uso, mas **não** fecha a Fase 7.
- Cobertura 80% global do repositório (apenas domínio tocado).
- Recorte na lista de pacientes.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-25-f7-09-card-paciente.md` | Esta spec |
| `src/features/records/domain/patient-card-summary.ts` | Recorte puro: anamnese vigente (texto livre e papel) + último procedimento |
| `src/features/records/domain/patient-card-summary.test.ts` | Testes do recorte, teto de Sim, fallbacks, 12 meses |
| `supabase/migrations/020_seed_card_paciente_f7.sql` | **Somente** seed: consulta concluída no passado da Maria com nome de procedimento. Sem schema novo |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/patients/components/patient-summary.tsx` | Dois blocos clínicos no topo; esconder se não houver recorte (visualizador) |
| `src/features/records/components/patient-chart.tsx` | Passar o recorte; trocar de aba a partir do toque |
| `src/features/records/queries.ts` | Montar o recorte no servidor (vigente + consulta concluída + evolução de fallback, sem entregar o formulário ao card) |
| `src/features/agenda/queries.ts` | Leitura pontual da consulta concluída mais recente do paciente, se a montagem ficar mais clara aqui do que em records |
| `src/app/(app)/pacientes/[id]/page.tsx` | Encaminhar o recorte já montado, se a página precisar orquestrar a leitura |
| `docs/state/PENDENCIAS.md` | Marcar F7-09 após o código (não nesta spec draft) |

### Proibido alterar nesta feature

- `src/features/patients/components/patient-list.tsx` (lista sem recorte nesta fatia).
- `src/features/patients/components/patient-form.tsx`, `schemas.ts`, `actions.ts` (cadastro / segundo telefone não mudam).
- Formulário e histórico de anamnese (`anamnesis-form.tsx`, `anamnesis-history.tsx`, `anamnesis-form-v1.ts`). Sem criar o questionário papel aqui.
- Odontograma, transcrição, busca, WhatsApp, estoque, fila, lembretes.
- `supabase/migrations/001` a `019`.
- Conteúdo extra em `020_seed_card_paciente_f7.sql` além do seed da consulta concluída da Maria.
- `.env.local`, secrets, `docs/SECURITY.md`.
- Spec pai da Fase 7, salvo pedido explícito.
- Arquivos de F7-01 a F7-08.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Recorte no **topo da ficha**, visível sem escolher aba |
| 2 | Lista de pacientes **não** muda |
| 3 | Anamnese no card = **só a vigente**, nunca o formulário inteiro |
| 4 | Alerta se ausente ou **mais de 12 meses**; recorte **continua visível** quando expirada |
| 5 | Texto livre (hoje): alergias, medicamentos, doenças. Sem bloco Sim |
| 6 | Questionário papel (depois): doenças marcadas + medicamentos/alergias se Sim + até 5 Sim na ordem §4.4 |
| 7 | Último procedimento: **consulta concluída** mais recente com nome; senão **trecho da evolução** |
| 8 | Confirmada / agendada / cancelada / falta **não** contam |
| 9 | Trecho de evolução ≤ **120** caracteres |
| 10 | Toque: Anamnese → aba Anamnese; procedimento → aba Evoluções |
| 11 | Visualizador **não** vê o recorte; recorte não é montado para quem não lê clínica |
| 12 | Sem escrita pelo card |
| 13 | Sem migration de schema; seed incremental da Maria em arquivo novo |
| 14 | Sem segundo audit só pelo card |
| 15 | Função de recorte já trata os dois formatos de anamnese, para a F7-03 não redesenhar o card |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Card virar o prontuário inteiro | Teto de linhas §4.3 / §4.4; sem histórico |
| PHI no log do recorte | Só identificadores; §9 |
| Visualizador ver alergia no HTML | Matriz + não montar o recorte no servidor |
| Consulta de hoje confirmada “ganhar” do último feito | Só situação concluída §4.5 |
| Maria do seed sem procedimento no card | Seed §6.3 / arquivo `020` |
| F7-03 mudar o questionário e quebrar o card | Contrato §4.3 e testes do formato papel já nesta fatia |
| Carregar todas as evoluções só para uma linha | Card recebe recorte; leitura da evolução de fallback é a mais recente (e a vinculada, se houver), não a timeline completa **para o card** |
| Aba não muda no toque (estado só no cliente) | §8.2 no DoD; o gráfico da ficha precisa aceitar a aba pedida pelo card |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 1 · F7-09
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-09
- Spec F3: `specs/2026-08-18-fase-3-pacientes-prontuario.md` §4.3 (12 meses) e §6 (ficha)
- Spec F7-07: `specs/2026-08-25-f7-07-segundo-telefone.md` (resumo cadastral no mesmo topo; não misturar)
- Questionário papel (contrato futuro do recorte): apêndice de `docs/plans/plano-F7.md`
- `docs/SECURITY.md` · PHI, auditoria, fail secure
- `docs/state/PENDENCIAS.md` · F7-09
- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente F7-09** na branch `feature/fase-7-ajustes-demo-felipe`, sem F7-02/F7-03 no mesmo passo até você pedir.
