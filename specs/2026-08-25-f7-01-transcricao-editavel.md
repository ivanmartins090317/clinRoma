# Spec · F7-01 · Transcrição editável

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-25                                         |
| **Slug**         | f7-01-transcricao-editavel                         |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 1                 |
| **Fase**         | 7 de `docs/PLANO.md`                               |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`   |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)                  |

---

## 1. Contexto

A Fase 3 entregou evolução com áudio e transcrição automática. O serviço de fala gera o texto e a ficha mostra o resultado **somente para leitura**. Na demo de 2026-08-25 o Felipe gostou do fluxo, mas precisa **corrigir** o que o serviço erra (ex.: "dente vinte e quatro" em vez de "dente 24"). Sem correção, o histórico clínico fica errado e a busca futura (F7-02) herda o erro.

Esta spec cobre **apenas F7-01**. Não inclui segundo telefone, card do paciente, busca, odontograma cruz, anamnese papel, WhatsApp nem e-mail financeiro.

**Pré-requisito:** prontuário da Fase 3 no `main` (evolução, anexo de áudio, transcrição assíncrona, retentativa).

---

## 2. Objetivo

Permitir que o dentista (e o administrador) **corrija o texto da transcrição** depois que o serviço concluir, **sem alterar o áudio original**, e que a correção **permaneça** ao reabrir a ficha.

**Valor entregue:** o texto que entra no prontuário é o que o clínico validou, não o bruto do serviço de fala.

---

## 3. Atores

| Ator          | Interesse |
| ------------- | --------- |
| Dentista      | Corrigir o texto na ficha, no celular, após a transcrição concluir |
| Administrador | Mesma correção, para suporte e revisão |
| Recepção      | Lê o texto corrigido no prontuário; **não** edita transcrição |
| Visualizador  | Sem conteúdo clínico; não vê áudio nem transcrição |
| Paciente      | Fora desta feature |

---

## 4. Modelo de domínio

### 4.1 Evolução e anexo de áudio

Uma **evolução** pode ter um ou mais **anexos de áudio**. Cada áudio tem:

- o **arquivo original** (imutável nesta feature);
- a **situação da transcrição**: pendente, processando, concluída ou falhou;
- o **texto da transcrição** (preenchido quando concluída; vazio nas demais).

O texto da transcrição é **conteúdo clínico** (dado de saúde). A correção **substitui** o texto vigente. Esta feature **não** guarda histórico de versões do texto; o áudio original continua disponível para ouvir.

### 4.2 Quando a correção é permitida

A correção só existe quando a situação é **concluída**.

| Situação     | Texto visível      | Correção | Outras ações              |
| ------------ | ------------------ | -------- | ------------------------- |
| Pendente     | ainda não          | não      | aguardar                  |
| Processando  | ainda não          | não      | aguardar                  |
| Concluída    | sim                | **sim**  | salvar correção           |
| Falhou       | não                | não      | retentar (já existe na F3) |

Salvar a correção **não** dispara nova transcrição e **não** muda a situação: permanece **concluída**.

### 4.3 Regras do texto corrigido

- O texto salvo é o que o clínico digitou, após remover espaços nas pontas.
- Não pode ficar vazio.
- Não pode ultrapassar o mesmo teto usado no texto da evolução (10.000 caracteres).
- Salvar com o mesmo conteúdo já persistido é permitido (idempotente); a interface pode desabilitar o botão se nada mudou.

---

## 5. Matriz de acesso

Coerente com a Fase 3 (quem grava evolução e quem retenta transcrição).

| Ação                                         | admin | dentist | reception | viewer |
| -------------------------------------------- | :---: | :-----: | :-------: | :----: |
| Ver áudio e texto da transcrição             |  Sim  |   Sim   |    Sim    |  Não   |
| Corrigir e salvar o texto da transcrição     |  Sim  |   Sim   |    Não    |  Não   |
| Retentar transcrição falha (já existe)       |  Sim  |   Sim   |    Não    |  Não   |

A recusa vale na interface **e** no servidor. Falha segura: papel sem permissão não altera o texto.

---

## 6. Escopo funcional

### 6.1 Na lista de evoluções

No bloco do anexo de áudio, quando a transcrição está **concluída**:

- o texto deixa de ser só leitura;
- aparece um **campo de texto** com o conteúdo atual, fonte 16 px no celular, alvo de toque confortável;
- aparece um botão **Salvar correção** (mínimo 44×44 px);
- o **player do áudio** permanece acima ou ao lado, inalterado;
- a situação continua rotulada como transcrição concluída, com indicação de que o texto pode ser corrigido.

Quando pendente ou processando: comportamento atual (aguardar, atualizar sozinho).
Quando falhou: comportamento atual (mensagem + retentar).

### 6.2 Salvar

1. Clínico altera o texto e aciona **Salvar correção**.
2. Sistema valida permissão, situação **concluída** e regras do texto (§4.3).
3. Persiste o texto corrigido no mesmo anexo.
4. Confirma na tela (mensagem curta em pt-BR).
5. Ao recarregar a ficha, o texto corrigido é o que aparece.
6. Auditoria registra **escrita** no prontuário (entidade do anexo, verbo de atualização). Metadados **sem** o corpo do texto.

### 6.3 O que não muda

- Gravação, envio em blocos, fila de transcrição, retentativa.
- Texto livre da evolução (campo separado do áudio).
- Foto, anamnese, odontograma, cadastro.

### 6.4 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Rótulo: `Transcrição concluída. Corrija se o serviço errou.`
- Botão: `Salvar correção`
- Sucesso: `Correção salva.`
- Vazio: `Informe o texto da transcrição.`
- Sem permissão: `Sem permissão para corrigir a transcrição.`
- Situação inválida: `Só é possível corrigir depois que a transcrição concluir.`

---

## 7. Fora de escopo

- F7-02 a F7-09 (busca, anamnese papel, WhatsApp, pós-cirurgia, e-mail financeiro, segundo telefone, odontograma cruz, card do paciente).
- Reprocessar o áudio ao salvar a correção.
- Histórico de versões do texto transcrito.
- Diff visual entre bruto do serviço e correção.
- Notificação ao concluir a transcrição.
- Edição do texto livre da evolução neste item (já existe ao criar; não reabrir).
- Reabrir gravação, formato de áudio ou o serviço de fala.
- Migration nova (o texto da transcrição já existe).
- Playwright.
- Fechamento documental da Fase 7 inteira.

---

## 8. Fluxos

### 8.1 Caminho feliz · Corrigir e persistir

1. Dentista autentica, abre a ficha do paciente e a aba de evoluções.
2. Há um áudio com transcrição **concluída**, por exemplo: `extração do dente vinte e quatro`.
3. O campo de texto está habilitado. O dentista altera para `extração do dente 24`.
4. Aciona **Salvar correção**.
5. Sistema confirma **Correção salva.**
6. Dentista recarrega a ficha (ou sai e volta).
7. O texto exibido é `extração do dente 24`. O áudio original toca o mesmo conteúdo falado.

**Pronto quando este fluxo passa**, inclusive com o exemplo `dente vinte e quatro` → `dente 24`.

### 8.2 Caminho feliz · Aguardar e só então editar

1. Dentista grava áudio na evolução (fluxo já existente).
2. Enquanto pendente ou processando, **não** há campo de correção.
3. Quando concluir, o campo aparece com o texto gerado.
4. Segue o §8.1.

### 8.3 Caminho feliz · Recepção só lê

1. Recepção abre a mesma ficha.
2. Vê o texto (já corrigido ou ainda bruto).
3. Não vê botão de salvar correção. Tentativa de escrita pelo servidor é recusada.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Texto vazio ao salvar | Recusa; mensagem `Informe o texto da transcrição.` | Validação no cliente e no servidor |
| Texto acima de 10.000 caracteres | Recusa; mensagem de texto muito longo | Mesmo teto da evolução |
| Situação ainda pendente ou processando | Sem editor; se alguém tentar gravar, recusa | Regra de domínio + checagem no servidor |
| Situação falhou | Sem editor; retentar permanece | Não misturar os dois fluxos |
| Papel recepção ou visualizador tenta salvar | Recusa; fail secure | Matriz §5 |
| Sessão expirada ao salvar | Volta ao login; texto não salvo some | Comportamento atual do app |
| Anexo inexistente ou de outro paciente | Recusa genérica, sem vazar dado | Autorização + políticas de acesso |
| Anexo não é áudio | Recusa | Validação no servidor |
| Dois salvamentos seguidos (última escrita vence) | O texto mais recente permanece | Sem versionamento nesta feature |
| Salvar sem ter alterado o texto | Permitido; botão pode ficar desabilitado | Evita clique inútil |
| Sair da ficha sem salvar | Alterações locais se perdem | Sem aviso de rascunho nesta feature |
| Falha de rede ao salvar | Mensagem amigável; texto local permanece no campo para nova tentativa | Não limpar o campo no erro |
| Auditoria falha | Correção **mesmo assim** persiste | Igual à Fase 3: audit não bloqueia clínica |
| Logs / Sentry | Sem corpo da transcrição | Metadados: identificador do anexo, paciente, ação |
| Transcrição concluída com texto ainda vazio (serviço devolveu nada) | Editor visível para o clínico preencher | Salvar exige texto não vazio |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho feliz §8.1: gravar (ou usar áudio já concluído) → corrigir → salvar → recarregar e o texto corrigido permanece.
- [ ] Áudio original inalterado após a correção.
- [ ] Editor só na situação **concluída**; pendente, processando e falhou inalterados.
- [ ] Matriz §5 respeitada na interface e no servidor.
- [ ] Validação do texto (§4.3) no servidor, com mensagens em pt-BR.
- [ ] Auditoria de escrita sem PHI no log.
- [ ] Regra de domínio testada (Vitest): quem pode corrigir × situação; texto vazio / longo / válido.
- [ ] Autorização revalidada na escrita; políticas de acesso existentes intactas.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor, fail secure, sem PHI em logs, sem segredo no cliente.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas.
- [ ] `docs/state/PENDENCIAS.md`: item **F7-01** marcado como implementado; homologação iPhone, se pendente, na seção de homologação.

### Qualidade

- [ ] Campo e botão usáveis no celular (16 px, alvo ≥ 44 px).
- [ ] Viewport estreito: player + campo + botão sem quebrar o bloco da evolução.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (ficam no fechamento da Fase 7; viewport mobile nesta fatia basta).
- Docs `docs/implementation/F7-*.md` e capítulo `docs/manual-dev/` da Fase 7 (só no fechamento da fase).
- Cobertura 80% global do repositório (apenas domínio tocado).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-25-f7-01-transcricao-editavel.md` | Esta spec |
| `src/features/records/domain/transcription-edit.ts` | Regras puras: situação editável, tamanho do texto |
| `src/features/records/domain/transcription-edit.test.ts` | Testes das regras |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/records/components/transcription-status.tsx` | Campo editável + salvar quando concluída |
| `src/features/records/actions.ts` | Escrita da correção, autorização, auditoria |
| `src/features/records/schemas.ts` | Validação da correção na borda |
| `src/features/records/permissions.ts` | Quem pode corrigir (espelho da retentativa) |
| `src/features/records/components/evolution-list.tsx` | Encaminhar permissão de correção |
| `src/features/records/components/patient-chart.tsx` | Encaminhar permissão de correção |
| `docs/state/PENDENCIAS.md` | Marcar F7-01 após o código (não nesta spec draft) |

### Proibido alterar nesta feature

- `src/lib/transcription/**` (serviço de fala, fila, montagem de áudio).
- `src/features/records/components/audio-recorder.tsx` e upload de blocos.
- `src/features/patients/**`, `agenda/**`, `stock/**`, `waitlist/**`, `reminders/**`.
- Odontograma, anamnese, formulário de evolução (texto da evolução).
- `supabase/migrations/**` (nenhuma migration nova ou antiga).
- `.env.local`, secrets, `docs/SECURITY.md`.
- Spec pai da Fase 7, salvo pedido explícito.
- Arquivos de F7-02 a F7-09.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Correção **somente** com transcrição **concluída** |
| 2 | Áudio original **não** muda |
| 3 | Texto vigente é **substituído**; sem histórico de versões da transcrição |
| 4 | Salvar correção **não** reenfileira o serviço de fala |
| 5 | Situação permanece **concluída** após salvar |
| 6 | Quem corrige = quem já retenta transcrição (**dentista** e **admin**) |
| 7 | Recepção **lê**, não corrige |
| 8 | Texto vazio não salva; teto 10.000 caracteres |
| 9 | Sem migration: o campo de texto da transcrição já existe |
| 10 | Auditoria de escrita **sem** corpo do texto |
| 11 | Sem aviso de rascunho não salvo nesta fatia |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| PHI no log da correção | Auditoria só com identificadores; §9 |
| Recepção ou viewer alterarem texto | Matriz + recusa no servidor |
| Salvar durante processando e sobrescrever o serviço | Editor só em concluída; servidor recusa outra situação |
| Clínico perde correção se sair sem salvar | Aceito nesta fatia (§12.11); copy deixa o botão explícito |
| Escopo inflar para busca (F7-02) | Fora de escopo §7; texto corrigido já alimenta a busca depois |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 1 · F7-01
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-01
- Spec F3: `specs/2026-08-18-fase-3-pacientes-prontuario.md` §6.10 (transcrição somente leitura)
- `docs/SECURITY.md` · PHI, auditoria, fail secure
- `docs/state/PENDENCIAS.md` · F7-01
- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente F7-01** na branch `feature/fase-7-ajustes-demo-felipe`, sem F7-07/F7-09 no mesmo passo até você pedir.
