# Spec · F7-02 · Busca no histórico

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-25                                         |
| **Slug**         | f7-02-busca-historico                              |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 2                 |
| **Fase**         | 7 de `docs/PLANO.md`                               |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`   |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)                  |

---

## 1. Contexto

A Fase 3 entregou a timeline de evoluções na ficha: texto livre, foto, áudio e transcrição, do mais recente para o mais antigo. Na demo de 2026-08-25 o Felipe pediu **buscar no histórico** do próprio paciente (exemplo: `dente 24`). Hoje a equipe rola a lista inteira. Sem filtro, achar um dente ou um procedimento antigo atrasam o consultório.

A transcrição editável (F7-01) já permite corrigir o texto do áudio. Esta busca usa o **texto vigente** (corpo da evolução e transcrição já concluída ou corrigida).

Esta spec cobre **apenas F7-02**. Não inclui odontograma cruz, anamnese papel, WhatsApp, segundo telefone nem card clínico.

**Pré-requisito:** prontuário da Fase 3 no `main` (lista de evoluções na ficha). F7-01 pode já estar na branch; esta fatia **não** altera o fluxo de corrigir transcrição.

---

## 2. Objetivo

Na aba de evoluções da ficha, permitir que dentista, recepção e administrador **filtrem o histórico daquele paciente** por um trecho de texto, de forma indiferente a maiúsculas, olhando o **corpo da evolução** e a **transcrição** dos áudios.

**Valor entregue:** achar `dente 24` (ou outro termo clínico) sem rolar o prontuário inteiro, sem vazar histórico de outros pacientes.

---

## 3. Atores

| Ator             | Interesse |
| ---------------- | --------- |
| Dentista         | Localizar evolução antiga no celular, no meio do atendimento |
| Recepção         | Mesma leitura, para contextualizar |
| Administrador    | Mesma leitura, para suporte |
| Visualizador     | Sem conteúdo clínico; **não** vê evoluções nem a busca |
| Auxiliar de sala | Sem módulo de pacientes; fora desta feature |
| Paciente         | Não usa esta tela |

---

## 4. Modelo de domínio

### 4.1 O que se busca

A busca opera **somente** sobre as evoluções **já carregadas daquele paciente** na ficha aberta.

Cada evolução entra no resultado se o termo aparecer, como **substring**, em pelo menos um destes campos:

| Campo | Quando conta |
| ----- | ------------ |
| **Corpo da evolução** | Texto livre vigente, depois de remover espaços nas pontas |
| **Transcrição** | Texto vigente de cada áudio cuja transcrição está **concluída** (incluindo correção da F7-01) |

Uma evolução com várias transcrições conta **uma vez** se qualquer uma casar.

### 4.2 O que não entra no filtro

- Nome do dentista
- Data e hora
- Foto (não há texto clínico pesquisável nesta fatia)
- Anamnese, odontograma, cadastro, agenda
- Evoluções de **outro** paciente
- Busca global da clínica (lista de pacientes, agenda, estoque)

Transcrição **pendente**, **processando** ou **falhou** não tem texto vigente: não casa. Áudio sem transcrição não casa pelo áudio em si.

### 4.3 Regras do termo

- Indiferente a maiúsculas e minúsculas (`Dente 24` casa `extração do dente 24`).
- Espaços nas pontas do termo são removidos.
- Termo vazio (ou só espaços) = **lista completa**, ordem atual (mais recente primeiro).
- O termo é um **único trecho contínuo**, não um conjunto de palavras soltas: `dente 24` não casa `dente24` nem `dente  24` (dois espaços), a menos que o texto tenha exatamente essa sequência.
- Sem acentuação especial nesta fatia: `anestesia` não precisa casar `anestésia` (e vice-versa), salvo se o texto já estiver igual.
- Sem teto extra de tamanho do termo além do razoável do campo (sugestão: 80 caracteres); termo maior que o campo simplesmente não é digitável.

### 4.4 Resultado

- A ordem permanece a da timeline (mais recente primeiro).
- O cartão da evolução que casou aparece **inteiro** (data, autor, corpo, foto, áudio, transcrição). Não se recorta só o trecho encontrado.
- Destacar o termo no texto **não** é exigido nesta fatia.
- A busca **não grava** nada no prontuário. Não cria versão, não altera evolução.

### 4.5 Onde vive

| Superfície | Comportamento |
| ---------- | ------------- |
| Aba Evoluções da ficha | Campo de busca acima da lista |
| Formulário de nova evolução | Inalterado; continua acima ou separado da lista |
| Card do paciente (F7-09) | **Não** busca; o card não é esta feature |
| Lista de pacientes | **Não** muda |

O termo **não** precisa sobreviver ao recarregar a ficha nesta fatia: campo começa vazio.

---

## 5. Matriz de acesso

Quem já lê o prontuário usa a busca. Quem não lê, não vê o campo nem a lista.

| Ação                                         | admin | dentist | reception | viewer | auxiliar |
| -------------------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver evoluções e filtrar o histórico          |  Sim  |   Sim   |    Sim    |  Não   |   Não    |
| Registrar nova evolução                      |  Sim  |   Sim   |    Não    |  Não   |   Não    |
| A busca **escrever** no prontuário           |  Não  |   Não   |    Não    |  Não   |   Não    |

A recusa vale na interface **e** no servidor: visualizador **não recebe** a lista de evoluções. A busca só filtra o que a ficha já entregou a quem lê clínica. Falha segura: papel sem permissão não obtém histórico para filtrar.

A auditoria de **leitura** da ficha já existe ao abrir o prontuário. Filtrar a lista **não** cria um segundo registro por tecla.

---

## 6. Escopo funcional

### 6.1 Campo na timeline

Na aba Evoluções, quando o paciente **tem pelo menos uma evolução**:

- campo de busca visível, rótulo em pt-BR, fonte 16 px, alvo confortável no celular;
- placeholder no sentido de buscar neste histórico (exemplo aceito: `dente 24`);
- filtra **ao digitar** (pode haver um pequeno atraso para não travar o teclado);
- botão ou controle para **limpar** o termo, ou o próprio esvaziar o campo, devolve a lista completa.

Quando o paciente **não tem nenhuma evolução**: o estado vazio atual permanece (`Nenhuma evolução registrada ainda.`). O campo de busca **pode** ficar oculto (não há o que filtrar).

### 6.2 Lista filtrada

1. Equipe com leitura clínica abre a ficha e a aba Evoluções.
2. Digita o termo.
3. A lista mostra só as evoluções que casam (§4.1).
4. Se nenhuma casar: mensagem de vazio da busca (§6.4), campo continua para corrigir ou limpar.
5. Limpar o termo restaura a lista completa.

A montagem da lista (anexos, player, correção de transcrição da F7-01) **não muda**.

### 6.3 Seed de demonstração

O caminho da spec pai: **duas evoluções no seed**, busca `dente 24` mostra **só** a que contém o termo.

Hoje o seed de desenvolvimento tem anamnese da Maria e (se F7-09 estiver na branch) consulta concluída, mas **não** duas evoluções contrastantes. Esta feature **acrescenta**, de forma incremental, duas evoluções de texto da **Maria Silva**:

| Evolução | Corpo (ideia) | Casa `dente 24`? |
| -------- | ------------- | ---------------- |
| A | Contém o trecho `dente 24` (ex.: extração / restauração desse dente) | Sim |
| B | Outro assunto, **sem** esse trecho (ex.: profilaxia) | Não |

Não reescreve seed antigo. Não exige anexo de áudio no seed: o casamento por transcrição fica nos testes de domínio, com dados de exemplo.

### 6.4 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Rótulo: `Buscar no histórico`
- Placeholder: `dente 24`
- Ajuda (opcional, curta): `Busca neste paciente: texto da evolução e transcrição.`
- Sem resultado com termo: `Nenhuma evolução encontrada para esta busca.`
- Limpar (acessível): `Limpar busca`

---

## 7. Fora de escopo

- F7-01, F7-03, F7-04, F7-05, F7-06, F7-07, F7-08, F7-09.
- Busca em **todos** os pacientes da clínica.
- Busca em anamnese, odontograma, foto ou cadastro.
- Destacar o trecho encontrado no texto.
- Persistência do termo na endereço da ficha (ao recarregar, o campo volta vazio).
- Busca por data, por dentista ou por tipo de anexo.
- Correção de transcrição (já é F7-01).
- Playwright.
- Fechamento documental da Fase 7 inteira.

---

## 8. Fluxos

### 8.1 Caminho feliz · `dente 24` no seed

1. Dentista autentica e abre a ficha de **Maria Silva**.
2. Abre a aba **Evoluções**. Vê as duas evoluções do seed (e quaisquer outras já existentes).
3. No campo **Buscar no histórico**, digita `dente 24`.
4. A lista mostra **somente** a evolução cujo corpo contém esse trecho.
5. A outra evolução (profilaxia / assunto distinto) **não** aparece.
6. Limpa o campo: as duas voltam.

**Pronto quando este fluxo passa.**

### 8.2 Caminho feliz · Maiúsculas

1. Com as mesmas evoluções, digita `DENTE 24`.
2. O resultado é o mesmo do §8.1.

### 8.3 Caminho feliz · Casa só na transcrição

1. Paciente tem evolução A (corpo sem o termo) com transcrição **concluída** contendo `dente 24`, e evolução B sem o termo em corpo nem transcrição.
2. Busca `dente 24`.
3. Só A aparece. O cartão mostra corpo, áudio e transcrição como hoje.

(Cobertura obrigatória em regra de domínio; na UI pode usar dados de teste, não precisa estar no seed.)

### 8.4 Caminho feliz · Termo vazio

1. Campo vazio ou só espaços.
2. Lista completa, ordem mais recente primeiro.

### 8.5 Caminho feliz · Nenhum resultado

1. Digita um termo que não aparece em nenhuma evolução daquele paciente (ex.: `xyzzy`).
2. Mensagem `Nenhuma evolução encontrada para esta busca.`
3. Não mostra evoluções de outro paciente.

### 8.6 Caminho feliz · Recepção lê e filtra

1. Recepção abre a mesma ficha.
2. Vê o campo e filtra.
3. Continua **sem** formulário de nova evolução (regra da Fase 3).

### 8.7 Caminho feliz · Visualizador

1. Visualizador abre a ficha.
2. **Não** vê aba clínica de evoluções nem o campo de busca (comportamento atual).

### 8.8 Caminho feliz · Paciente sem evolução

1. Ficha recém-cadastrada, sem evoluções.
2. Estado vazio atual. Sem lista para filtrar.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Visualizador tenta obter evoluções para filtrar | Não recebe lista clínica | Matriz §5; fail secure |
| Sessão expirada | Volta ao login | Comportamento atual do app |
| Paciente inexistente | Recusa genérica | Autorização + políticas de acesso |
| Termo só com espaços | Trata como vazio; lista completa | Trim §4.3 |
| `dente24` sem espaço | Não casa `dente 24` | Substring exata |
| Várias transcrições, uma casa | Evolução aparece uma vez | §4.1 |
| Transcrição pendente com o termo ainda não gerado | Não casa até concluir | §4.2 |
| Transcrição corrigida na F7-01 | Busca o texto **corrigido**, não o bruto antigo | Texto vigente |
| Corpo e transcrição casam na mesma evolução | Um cartão só | Sem duplicar |
| Lista grande no celular | Campo fixo no topo da lista (não some ao rolar o primeiro cartão, se possível); filtro local, sem nova ida ao servidor | Qualidade §10 |
| Falha de rede ao abrir a ficha | Comportamento atual; sem busca se a lista não carregou | Não inventar busca offline |
| Logs / Sentry | Sem corpo da evolução, sem termo buscado, sem transcrição | Só identificador do paciente se já logado na abertura da ficha |
| Digitação rápida | Pode atrasar o filtro alguns milissegundos; resultado final condiz com o termo visível | Evitar travar o teclado |
| Outro paciente na clínica tem `dente 24` | **Não** aparece nesta ficha | Escopo só daquele paciente |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho feliz §8.1: seed com duas evoluções; busca `dente 24` mostra só a que contém o termo; limpar restaura as duas.
- [ ] Caminho §8.2: maiúsculas/minúsculas indiferentes.
- [ ] Caminhos §8.4 e §8.5: termo vazio = lista completa; termo sem casamento = vazio da busca, sem vazar outro paciente.
- [ ] Regra de domínio (Vitest): casa corpo; casa transcrição concluída; não casa pendente/falhou; não duplica; trim; case-insensitive; substring exata (`dente 24` ≠ `dente24`).
- [ ] Matriz §5: visualizador não vê busca nem lista; recepção filtra e não registra evolução.
- [ ] Busca **não** consulta outros pacientes nem a clínica inteira.
- [ ] Sem segundo audit por tecla; logs sem PHI e sem o termo buscado.
- [ ] Seed incremental das duas evoluções da Maria. Migrations antigas **não** são editadas.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor na leitura da ficha, fail secure, sem PHI em logs, sem segredo no cliente.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas.
- [ ] `docs/state/PENDENCIAS.md`: item **F7-02** marcado como implementado; homologação em dispositivo real, se pendente, na seção de homologação.

### Qualidade

- [ ] Campo usável no celular (16 px, alvo ≥ 44 px).
- [ ] Viewport estreito: busca + primeiro cartão sem esconder o campo ao abrir a aba.
- [ ] Filtro ao digitar sem travar a digitação.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (ficam no fechamento da Fase 7; viewport mobile nesta fatia basta).
- Destacar o termo no texto.
- Seed com áudio/transcrição (o casamento por transcrição é nos testes de domínio).
- Docs `docs/implementation/F7-*.md` e capítulo `docs/manual-dev/` da Fase 7 inteira (só no fechamento da fase). Registro curto desta fatia é permitido se o fluxo de close-phase da fatia já estiver em uso, mas **não** fecha a Fase 7.
- Cobertura 80% global do repositório (apenas domínio tocado).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-25-f7-02-busca-historico.md` | Esta spec |
| `src/features/records/domain/evolution-search.ts` | Filtro puro: termo × corpo × transcrições |
| `src/features/records/domain/evolution-search.test.ts` | Testes: `dente 24`, case, transcrição, trim, sem duplicar |
| `src/features/records/components/evolution-search.tsx` | Campo de busca (se não couber com clareza na lista) |
| `supabase/migrations/021_seed_busca_historico_f7.sql` | **Somente** duas evoluções de texto da Maria (uma com `dente 24`, outra sem). Sem schema novo |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/records/components/evolution-list.tsx` | Exibir busca + lista filtrada; estado vazio da busca |
| `src/features/records/components/patient-chart.tsx` | Só se precisar encaminhar a lista ou o campo; sem nova aba |
| `docs/state/PENDENCIAS.md` | Marcar F7-02 após o código (não nesta spec draft) |

### Proibido alterar nesta feature

- Formulário de nova evolução, gravador, foto, correção de transcrição (F7-01 permanece).
- Card do paciente, cadastro, odontograma, anamnese.
- `src/features/patients/**`, `agenda/**`, `stock/**`, `waitlist/**`, `reminders/**`.
- `src/features/records/queries.ts` e `actions.ts`, **salvo** se a lista filtrada exigir um ajuste mínimo de formato já carregado (não criar busca no servidor nem busca global).
- `supabase/migrations/001` a `020`.
- Conteúdo extra em `021_seed_busca_historico_f7.sql` além das duas evoluções da Maria.
- `.env.local`, secrets, `docs/SECURITY.md`.
- Spec pai da Fase 7, salvo pedido explícito.
- Arquivos de F7-01 e F7-03 a F7-09.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Busca **só** no histórico daquele paciente, na aba Evoluções |
| 2 | Campos: **corpo** + **transcrição concluída**; não data, não autor, não foto |
| 3 | Substring **exata**, indiferente a maiúsculas; trim nas pontas |
| 4 | Termo vazio = lista completa |
| 5 | Sem busca global da clínica |
| 6 | Sem destacar o trecho; cartão completo |
| 7 | Sem persistir o termo ao recarregar |
| 8 | Sem segundo audit por filtro |
| 9 | Filtro sobre a lista **já carregada** (sem nova consulta a outros pacientes) |
| 10 | Seed: duas evoluções de texto da Maria; transcrição coberta em teste de domínio |
| 11 | Visualizador não vê a busca |
| 12 | F7-01 intacta: o texto vigente da transcrição é o que se busca |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Busca vazar outro paciente | Escopo §4.2; teste §8.5; lista só da ficha aberta |
| PHI no log do termo | Não logar o termo nem o corpo §9 |
| `dente 24` no seed ausente | Seed §6.3 / arquivo `021` |
| Transcrição bruta errada esconder o dente | F7-01 corrige; busca usa o vigente |
| Campo some no celular ao rolar | Qualidade: busca no topo da lista |
| Escopo inflar para busca na clínica | Fora de escopo §7 |
| Achar que `dente24` deve casar | Decisão §12.3; documentar substring exata |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 2 · F7-02
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-02
- Spec F3: `specs/2026-08-18-fase-3-pacientes-prontuario.md` §6.7 (timeline de evoluções)
- Spec F7-01: `specs/2026-08-25-f7-01-transcricao-editavel.md` (texto vigente da transcrição)
- `docs/SECURITY.md` · PHI, auditoria, fail secure
- `docs/state/PENDENCIAS.md` · F7-02
- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente F7-02** na branch `feature/fase-7-ajustes-demo-felipe`, sem F7-08 no mesmo passo até você pedir.
