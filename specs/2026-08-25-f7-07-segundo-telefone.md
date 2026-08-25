# Spec · F7-07 · Segundo telefone no cadastro

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-25                                         |
| **Slug**         | f7-07-segundo-telefone                             |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 1                 |
| **Fase**         | 7 de `docs/PLANO.md`                               |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`   |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)                  |

---

## 1. Contexto

A Fase 3 entregou cadastro com um único telefone de contato. Na demo de 2026-08-25 o Felipe pediu um **segundo número**, porque **pacientes mais velhos muitas vezes não têm WhatsApp**. Esse número costuma ser de **parente próximo** (filho, esposa, cuidador). Sem o campo, a recepção anota no papel ou no e-mail, e o disparo futuro ao paciente (F7-04) não tem destino alternativo.

Esta spec cobre **apenas F7-07**. Não inclui transcrição, card clínico, busca, odontograma cruz, anamnese papel, WhatsApp nem e-mail financeiro.

**Pré-requisito:** cadastro e ficha da Fase 3 no `main` (nome, nascimento, CPF, telefone, e-mail, consentimento LGPD).

---

## 2. Objetivo

Permitir que recepção, dentista e administrador **registrem um segundo telefone opcional** no cadastro do paciente, com uma **observação de quem é o contato**, e que esses dados **apareçam no resumo cadastral** e **permaneçam** ao reabrir a ficha.

**Valor entregue:** a clínica guarda o telefone do parente no mesmo lugar do cadastro, com rótulo claro, sem obrigar o campo nesta fase.

---

## 3. Atores

| Ator          | Interesse |
| ------------- | --------- |
| Recepção      | Cadastrar e atualizar o segundo telefone e a observação no fluxo diário |
| Dentista      | Mesma escrita, quando atende o cadastro incompleto |
| Administrador | Mesma escrita, para suporte |
| Visualizador  | Lê o cadastro (incluindo o segundo contato); **não** edita |
| Auxiliar de sala | Sem módulo de pacientes; fora desta feature |
| Paciente / parente | Não usam esta tela; o número é cadastrado pela equipe |

---

## 4. Modelo de domínio

### 4.1 Contatos no cadastro

O cadastro do paciente passa a ter dois telefones independentes:

| Campo | Papel | Obrigatório nesta feature |
| ----- | ----- | ------------------------- |
| **Telefone** (já existe) | Número do próprio paciente | Não (continua como hoje) |
| **Segundo telefone** (novo) | Número alternativo, em geral de parente | **Não** |
| **Observação do segundo telefone** (novo) | Quem é: filho, esposa, cuidador, etc. | **Não** |

O segundo telefone **não substitui** o primeiro. Os dois podem coexistir. Os dois podem estar vazios.

### 4.2 Regras

- Segundo telefone e observação são **opcionais** no cadastro novo e na edição.
- Espaços nas pontas são removidos antes de gravar. Campo só com espaços vale como vazio.
- Observação **sem** segundo telefone: **recusa**. A observação descreve o contato; sem número, não há o que explicar.
- Segundo telefone **sem** observação: **permitido**.
- Esvaziar os dois na edição **remove** o segundo contato (volta ao estado sem parente).
- Segundo telefone igual ao telefone principal: **permitido** (sem unicidade entre os dois).
- Teto: segundo telefone até **40** caracteres; observação até **120** caracteres.
- Formato: texto livre, o mesmo espírito do telefone já existente (sem máscara obrigatória nesta fatia).

### 4.3 Onde aparece

| Superfície | Comportamento |
| ---------- | ------------- |
| Cadastro novo | Campos visíveis, opcionais, com texto de ajuda |
| Edição na ficha | Mesmos campos, preenchidos com o valor vigente |
| Resumo cadastral (topo da ficha) | Mostra segundo telefone e observação quando houver; senão, omite o bloco (não polui com "não informado") |
| Lista de pacientes | **Não** muda nesta feature (continua nome, CPF e telefone principal) |

---

## 5. Matriz de acesso

Igual a criar e editar cadastro na Fase 3. O segundo contato é dado cadastral, não conteúdo clínico.

| Ação                                         | admin | dentist | reception | viewer | auxiliar |
| -------------------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver segundo telefone e observação no resumo  |  Sim  |   Sim   |    Sim    |  Sim   |   Não    |
| Incluir ou alterar segundo telefone e observação | Sim |   Sim   |    Sim    |  Não   |   Não    |

A recusa vale na interface **e** no servidor. Falha segura: papel sem permissão não altera o cadastro.

---

## 6. Escopo funcional

### 6.1 Formulário de cadastro e edição

No bloco de contato, abaixo do telefone já existente:

- campo **Segundo telefone** (texto, fonte 16 px, alvo confortável no celular);
- campo **Observação** (texto, quem é o contato);
- texto de ajuda visível, em pt-BR, no sentido: pacientes mais velhos podem não ter WhatsApp; este número é de um parente próximo.

Os demais campos (nome, nascimento, CPF, telefone, e-mail, LGPD no cadastro novo) **não mudam**.

### 6.2 Salvar

1. Equipe preenche (ou deixa vazio) segundo telefone e observação e aciona cadastrar ou salvar.
2. Sistema valida permissão e regras §4.2, junto com as regras já existentes do cadastro.
3. Persiste no cadastro do paciente.
4. Confirma na tela com as mensagens já usadas (`Paciente cadastrado` / `Dados atualizados`).
5. Ao reabrir a ficha, o resumo mostra o segundo contato quando houver.
6. Auditoria registra **escrita** no cadastro (entidade paciente, verbo de criação ou atualização). Metadados **sem** o número completo: indicar só se o segundo contato foi informado ou removido.

### 6.3 Resumo cadastral

Quando houver segundo telefone:

- rótulo **Segundo telefone**;
- o número;
- a observação ao lado ou abaixo, se existir (ex.: `filho`).

Quando não houver segundo telefone: o bloco **não aparece**.

### 6.4 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Rótulo: `Segundo telefone`
- Rótulo: `Observação do contato`
- Ajuda: `Alguns pacientes mais velhos não têm WhatsApp. Este número é de um parente próximo.`
- Placeholder da observação: `filho, esposa, cuidador`
- Observação sem número: `Informe o segundo telefone ou deixe a observação em branco.`
- Telefone longo: `Segundo telefone muito longo.`
- Observação longa: `Observação muito longa.`
- Sem permissão: `Sem permissão para alterar pacientes.` (já existente)

---

## 7. Fora de escopo

- F7-01, F7-02, F7-03, F7-04, F7-05, F7-06, F7-08, F7-09.
- Disparar WhatsApp ou escolher destino da mensagem (usa estes dados **depois**, na F7-04).
- Tornar o segundo telefone obrigatório (default do plano: opcional; Felipe ainda pode mudar).
- Máscara, DDI ou validação de formato brasileiro.
- Busca na lista por segundo telefone.
- Mostrar o segundo telefone na lista de pacientes.
- Resumo clínico no card (anamnese + último procedimento): isso é F7-09.
- Consentimento LGPD, CPF, e-mail, nome.
- Playwright.
- Fechamento documental da Fase 7 inteira.

---

## 8. Fluxos

### 8.1 Caminho feliz · Cadastrar com parente

1. Recepção autentica e abre **Novo paciente**.
2. Preenche nome, consentimento LGPD e demais campos mínimos como hoje.
3. Em **Segundo telefone**, informa o número do filho; em **Observação**, `filho`.
4. Aciona **Cadastrar paciente**.
5. Sistema confirma **Paciente cadastrado** e abre a ficha.
6. O resumo mostra o segundo telefone e a observação `filho`.
7. Recepção sai e volta à ficha: os dados permanecem.

**Pronto quando este fluxo passa.**

### 8.2 Caminho feliz · Incluir depois, em paciente já existente

1. Recepção abre a ficha de um paciente que só tem o telefone principal (ou nenhum).
2. Na edição, informa segundo telefone e observação.
3. Aciona **Salvar alterações**.
4. Confirma **Dados atualizados**.
5. O resumo passa a exibir o segundo contato.

### 8.3 Caminho feliz · Cadastro sem segundo telefone

1. Recepção cadastra paciente **sem** preencher segundo telefone nem observação.
2. Cadastro conclui como hoje.
3. O resumo **não** mostra o bloco de segundo telefone.

### 8.4 Caminho feliz · Visualizador só lê

1. Visualizador abre a ficha de um paciente com segundo contato.
2. Vê número e observação no resumo.
3. Não vê formulário de edição (comportamento atual da ficha). Tentativa de escrita pelo servidor é recusada.

### 8.5 Caminho feliz · Remover o segundo contato

1. Recepção edita um paciente que tem segundo telefone.
2. Apaga os dois campos e salva.
3. O resumo deixa de mostrar o bloco.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Observação preenchida e segundo telefone vazio | Recusa; `Informe o segundo telefone ou deixe a observação em branco.` | Regra de domínio + validação na borda e no servidor |
| Segundo telefone acima de 40 caracteres | Recusa; `Segundo telefone muito longo.` | Teto §4.2 |
| Observação acima de 120 caracteres | Recusa; `Observação muito longa.` | Teto §4.2 |
| Só espaços nos campos novos | Trata como vazio; cadastro segue | Trim |
| Segundo telefone igual ao principal | Aceita | Sem unicidade entre os dois |
| Papel visualizador ou auxiliar tenta gravar | Recusa; fail secure | Matriz §5 |
| Sessão expirada ao salvar | Volta ao login; alteração não persiste | Comportamento atual do app |
| Paciente inexistente na edição | Recusa genérica, sem vazar dado | Autorização + políticas de acesso |
| CPF duplicado ou LGPD ausente no cadastro novo | Comportamento atual da F3; campos novos não interferem | Não reabrir regras da F3 |
| Falha de rede ao salvar | Mensagem amigável; valores permanecem no formulário | Não limpar o formulário no erro |
| Auditoria falha | Cadastro **mesmo assim** persiste | Igual à Fase 3: audit não bloqueia clínica |
| Logs / Sentry | Sem número completo | Metadados: identificador do paciente, se o segundo contato existe ou foi removido |
| Pacientes já cadastrados | Segundo telefone e observação vazios; ficha e lista continuam iguais | Campos novos nulos por omissão |
| Lista de pacientes | Inalterada | Fora de escopo §7 |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho feliz §8.1: cadastrar com segundo telefone + observação → reabrir a ficha e os dados permanecem.
- [ ] Caminho feliz §8.3: cadastro sem segundo telefone continua válido.
- [ ] Caminho feliz §8.2 e §8.5: incluir depois e remover o segundo contato.
- [ ] Resumo cadastral mostra o bloco só quando há segundo telefone.
- [ ] Matriz §5 respeitada na interface e no servidor.
- [ ] Regras §4.2 no servidor, com mensagens em pt-BR.
- [ ] Auditoria de escrita sem número completo no log.
- [ ] Regra de domínio testada (Vitest): opcional; observação sem número; tetos; trim.
- [ ] Autorização revalidada na escrita; políticas de acesso existentes intactas.
- [ ] Persistência incremental dos dois campos no cadastro; **não** alterar migrations antigas.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor, fail secure, sem dado de contato completo em logs, sem segredo no cliente.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas.
- [ ] `docs/state/PENDENCIAS.md`: item **F7-07** marcado como implementado; homologação em dispositivo real, se pendente, na seção de homologação.

### Qualidade

- [ ] Campos usáveis no celular (16 px, alvo ≥ 44 px no envio).
- [ ] Texto de ajuda visível sem esconder o telefone principal.
- [ ] Viewport estreito: bloco de contato não quebra o formulário.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (ficam no fechamento da Fase 7; viewport mobile nesta fatia basta).
- Docs `docs/implementation/F7-*.md` e capítulo `docs/manual-dev/` da Fase 7 (só no fechamento da fase).
- Cobertura 80% global do repositório (apenas domínio tocado).
- Seed com segundo telefone (permitido no mesmo arquivo de persistência, não obrigatório).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-25-f7-07-segundo-telefone.md` | Esta spec |
| `src/features/patients/domain/secondary-phone.ts` | Regras puras: opcional, observação sem número, tetos, trim |
| `src/features/patients/domain/secondary-phone.test.ts` | Testes das regras |
| `supabase/migrations/019_ajustes_demo_f7.sql` | **Somente** os dois campos de cadastro (e, se útil, seed opcional). Sem tokens de anamnese, sem mensagens ao paciente |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/patients/components/patient-form.tsx` | Campos + texto de ajuda no cadastro e na edição |
| `src/features/patients/components/patient-summary.tsx` | Bloco do segundo contato no resumo cadastral |
| `src/features/patients/schemas.ts` | Validação na borda (criar e atualizar) |
| `src/features/patients/actions.ts` | Persistir os dois campos; auditoria sem número completo |
| `src/features/patients/queries.ts` | Ler e devolver os dois campos no detalhe |
| `src/lib/supabase/database.types.ts` | Regenerar após a persistência incremental |
| `docs/state/PENDENCIAS.md` | Marcar F7-07 após o código (não nesta spec draft) |

### Proibido alterar nesta feature

- `src/features/patients/components/patient-list.tsx` (lista não mostra o segundo telefone nesta fatia).
- `src/features/records/**`, `agenda/**`, `stock/**`, `waitlist/**`, `reminders/**`.
- WhatsApp, anamnese, odontograma, transcrição, card clínico (F7-09).
- `supabase/migrations/001` a `018`.
- Conteúdo extra em `019_ajustes_demo_f7.sql` além dos dois campos de cadastro (fatias seguintes usam `020+`).
- `.env.local`, secrets, `docs/SECURITY.md`.
- Spec pai da Fase 7, salvo pedido explícito.
- Arquivos de F7-01 a F7-06, F7-08 e F7-09.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Segundo telefone **opcional** (não bloqueia cadastro) |
| 2 | Observação **opcional**, mas **recusada** se não houver segundo telefone |
| 3 | Texto de ajuda deixa claro: parente / paciente sem WhatsApp |
| 4 | Resumo cadastral mostra o bloco **só** quando há segundo telefone |
| 5 | Lista de pacientes **não** muda |
| 6 | Quem escreve = quem já cria/edita cadastro (**admin**, **dentista**, **recepção**) |
| 7 | Visualizador **lê**, não edita |
| 8 | Sem máscara e sem obrigatoriedade “só se o paciente não tiver WhatsApp” |
| 9 | Persistência incremental; não editar migrations antigas |
| 10 | Arquivo `019` nesta fatia contém **apenas** estes dois campos |
| 11 | Auditoria **sem** número completo |
| 12 | Disparo WhatsApp fica para F7-04; esta spec só guarda o dado |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Número do parente em log | Auditoria só com identificador e flag “informado/removido”; §9 |
| Visualizador alterar cadastro | Matriz + recusa no servidor |
| Equipe achar que o campo é obrigatório | Copy de ajuda + campo sem `required` |
| Observação órfã (texto sem número) | Recusa §4.2 |
| `019` virar saco de toda a Fase 7 | §11: só os dois campos; próximas fatias em `020+` |
| Escopo inflar para WhatsApp (F7-04) | Fora de escopo §7; o dado fica pronto para o destino futuro |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 1 · F7-07
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-07
- Spec F3: `specs/2026-08-18-fase-3-pacientes-prontuario.md` §6.1 e §8.1 (cadastro)
- `docs/SECURITY.md` · dado de contato, auditoria, fail secure
- `docs/state/PENDENCIAS.md` · F7-07
- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente F7-07** na branch `feature/fase-7-ajustes-demo-felipe`, sem F7-04/F7-09 no mesmo passo até você pedir.
