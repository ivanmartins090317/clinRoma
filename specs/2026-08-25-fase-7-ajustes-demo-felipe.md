# Spec · Fase 7 · Ajustes pós-demo Felipe

| Campo            | Valor                                      |
| ---------------- | ------------------------------------------ |
| **Status**       | draft                                      |
| **Data**         | 2026-08-25                                 |
| **Slug**         | fase-7-ajustes-demo-felipe                 |
| **Plano origem** | `docs/plans/plano-F7.md`             |
| **Fase**         | 7 de `docs/PLANO.md`                       |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)          |

---

## 1. Contexto

As Fases 0 a 6 entregaram o MVP navegável. Em **2026-08-25** o ClinRoma foi apresentado ao Felipe Roma. Reação: **gostou muito**, projeto **melhor do que esperava**. Destaque: prontuário (ele chamou de prescrição) e evolução com áudio.

Nesta sessão ele pediu oito ajustes. Depois pediu o **questionário papel** (Sim/Não) na anamnese e um **resumo no card do paciente** (anamnese + último procedimento). Esta spec é o contrato da **Fase 7**. Não reabre F0–F6.

**Pré-requisito:** código das Fases 0–6 no `main`. Homologação manual da F6 pode seguir em paralelo; não bloqueia o início desta fase.

Referência visual: `docs/assets/odontograma-formato-cruz.png`, `docs/assets/anamnese-questionario-p1.png`, `docs/assets/anamnese-questionario-p2.png`.

---

## 2. Objetivo

Entregar os pedidos da demo, na ordem de valor clínico:

1. Transcrição de áudio **editável** (hoje só lê).
2. **Busca** no histórico do prontuário (ex.: `dente 24`).
3. Anamnese: questionário papel (Sim/Não + complementos) em **dois modos isolados** (link e tablet).
4. Canal de automação ao paciente: **WhatsApp**.
5. Aba **mensagem pós-cirurgia** (texto personalizado → WhatsApp).
6. Estoque baixo: **e-mail do financeiro** (endereço pendente).
7. Cadastro: **segundo telefone** + observação (parente).
8. Odontograma em **formato de cruz** (FDI, três vistas por dente).
9. Card do paciente: resumo da anamnese vigente + último procedimento.

**Valor entregue:** o que o Felipe viu na demo vira o fluxo real da clínica, sem o paciente enxergar o resto do sistema, e com WhatsApp no lugar certo.

---

## 3. Atores

| Ator          | Interesse |
| ------------- | --------- |
| Dentista      | Corrigir transcrição; buscar histórico; odontograma cruz; enviar pós-cirurgia |
| Recepção      | Cadastrar 2º telefone; disparar anamnese pré-consulta; tablet no consultório |
| Paciente      | Preencher anamnese em casa ou no tablet, **sem** ver outras telas |
| Parente       | Receber WhatsApp quando o paciente não tem o app |
| Financeiro    | Receber e-mail de estoque baixo |
| Administrador | Configurar e-mail financeiro e provedor WhatsApp |

---

## 4. Itens (backlog desta fase)

### F7-01 · Transcrição editável

**Problema:** Whisper grava o texto e a UI mostra `blockquote` somente leitura (`transcription-status.tsx`).

**Solução:** após `completed`, o dentista edita o texto, salva, e a versão corrigida persiste em `record_attachments.transcription`. Áudio original não muda.

**Pronto quando:** gravar → transcrever → corrigir "dente vinte e quatro" para "dente 24" → recarregar a página e o texto corrigido permanece.

### F7-02 · Busca no histórico

Barra de busca na timeline de evoluções do paciente. Filtra `body` / transcrição por substring (case-insensitive). Exemplo de query: `dente 24`.

**Pronto quando:** duas evoluções no seed, busca `dente 24` mostra só a que contém o termo.

### F7-03 · Anamnese isolada + questionário papel

**Não** reutilizar o formulário de texto livre da F3 (`anamnesis-form-v1.ts`). Implementar **versão 2** idêntica ao papel (apêndice de `docs/plans/plano-F7.md` e fotos `docs/assets/anamnese-questionario-p*.png`).

Regras de UI:

- Toda pergunta: checkbox **Sim** e **Não** (exclusivos).
- Complemento em texto só onde o papel tem (`Por quê?`, `Qual(is)?`, `Se sim, qual(is)?`), visível quando a resposta é Sim.
- Doenças: lista multi checkbox (Anemia … Sinusite) + campo "outra doença".
- Bloco **Apenas para mulheres** (menopausa, osteoporose/família, grávida).
- Declaração: *Atesto serem verdadeiras as informações supracitadas a respeito do Questionário para Paciente.*

Duas superfícies **sem AppShell**:

| Modo | Rota | Quem abre |
| ---- | ---- | --------- |
| Pré-consulta | `/anamnese/[token]` | Paciente no celular (link WhatsApp) |
| Consultório | mesma rota, token kiosk | Tablet da clínica |

Regras:

- Sem menu, sem outras abas, sem prontuário/agenda/estoque.
- Token opaco, hash no banco, expiração (sugerido: 7 dias pré-consulta; kiosk do dia).
- LGPD: consentimento visível antes de enviar.
- Se já existe anamnese vigente: mostrar resumo + opção de nova versão.
- Staff continua usando a aba no prontuário logado.

**Ainda em aberto com Felipe:** se o envio do link pré-consulta é sempre WhatsApp (encaixa no F7-04). Assumir **sim** até ele contradizer.

### F7-04 · Canal WhatsApp para o paciente

Revisa a decisão da F6 ("paciente não recebe mensagem neste repo").

- Inbox/bot **continuam** no DeskcommCRM.
- ClinRoma **dispara** mensagens (pós-cirurgia e link de anamnese).
- Provedor (WAHA, Cloud API ou bridge DeskcommCRM): **decisão de implementação**, documentar em `.env.example` e nesta spec quando escolher. Não inventar um segundo inbox.

### F7-05 · Aba pós-cirurgia

Nova aba no prontuário: texto livre + destino + enviar.

Destino:

1. `contact_phone` do paciente, se houver.
2. Senão, `secondary_phone`.
3. Sem os dois: botão desabilitado com aviso.

Registrar envio (quem, quando, número destino, situação). Corpo da mensagem: **livre** até Felipe pedir template.

### F7-06 · E-mail estoque baixo → financeiro

No mesmo gatilho do alerta da F5 (`current_balance <= min_stock`), enfileirar e-mail via Resend para o endereço em configuração da clínica.

**Bloqueio de go-live deste item:** Felipe ainda não passou o e-mail. Implementar a configuração + job; o endereço pode ficar vazio até ele enviar (não dispara se vazio).

### F7-07 · Segundo telefone no cadastro

Campos em `patients`:

- `secondary_phone` (texto, opcional nesta fase).
- `secondary_phone_note` (quem é: filho, esposa, cuidador).

UI: labels claros. "Alguns pacientes mais velhos não têm WhatsApp. Este número é de um parente próximo."

**Em aberto:** obrigatório vs só quando o paciente não tem WhatsApp. Default v1: **opcional**.

### F7-08 · Odontograma formato cruz

Substituir o layout atual pelo cruz da imagem `docs/assets/odontograma-formato-cruz.png`.

- Linha horizontal: arco superior vs inferior.
- Linha vertical: direita vs esquerda **do paciente**.
- Números FDI colados na cruz: 18–11, 21–28, 48–41, 31–38.
- Cada dente: três vistas empilhadas (raiz, coroa facial, oclusal com faces).
- Persistência continua em `tooth_findings` (paciente + dente + face). Só muda UI e hit-area.

Mobile: cruz com zoom/scroll; não esmagar as faces.

### F7-09 · Card do paciente (resumo)

No topo do prontuário (`patient-summary`), além dos dados cadastrais:

- **Anamnese:** data da versão vigente; alerta se desatualizada (> 12 meses); doenças marcadas; medicamentos; alergias; alguns **Sim** relevantes. Sem o formulário inteiro.
- **Último procedimento:** nome + data da última consulta concluída; se não houver, trecho da última evolução.

Link para a aba Anamnese / Evolução. Lista de pacientes fora desta fase.

**Pronto quando:** abrir Maria (seed) mostra no card a anamnese vigente e o último procedimento sem entrar nas abas.

---

## 5. Modelo de dados (incremental)

Migration nova (não editar as F3/F5/F6 retroativamente). Sugerido: `019_ajustes_demo_f7.sql`.

| Entidade / campo | Uso |
| ---------------- | --- |
| `patients.secondary_phone` | 2º WhatsApp |
| `patients.secondary_phone_note` | Observação do contato |
| `clinics` ou settings | `finance_email` |
| `anamnesis_tokens` | token hash, patient_id, expires_at, kind (pre_visit \| kiosk) |
| `patient_messages` | pós-cirurgia e link anamnese: canal, destino, status, author |
| `record_attachments.transcription` | já existe; F7-01 só passa a **escrever correção** |

RLS: tokens de anamnese acessíveis na rota pública só com o token válido (padrão da fila F4). Mensagens: dentist/admin/reception conforme matriz atual.

---

## 6. Telas

| Superfície | Mudança |
| ---------- | ------- |
| Cadastro / ficha paciente | 2º telefone + observação; **card** com resumo da anamnese + último procedimento |
| Aba evolução | transcrição em textarea + salvar |
| Timeline | input de busca |
| Aba odontograma | cruz F7-08 |
| Nova aba Pós-cirurgia | composer + enviar |
| `/anamnese/[token]` | formulário isolado (sem shell) |
| Configurações admin | e-mail financeiro; depois provedor WhatsApp |
| Estoque / Hoje | sem mudança visual obrigatória (e-mail nos bastidores) |

---

## 7. Critérios de Done

### DoD técnico

- [ ] F7-01 a F7-09 implementados (F7-06 aceita e-mail vazio = não envia).
- [ ] Migration incremental + tipos regenerados.
- [ ] Vitest no domínio tocado (destino WhatsApp, busca, token anamnese, cruz FDI).
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] `docs/implementation/F7-ajustes-demo-felipe.md` + capítulo `docs/manual-dev/`.
- [ ] `docs/state/PENDENCIAS.md` atualizado.
- [ ] Copy pt-BR; sem travessão "—" em textos novos.
- [ ] Arquivos novos ≤ ~300 linhas.

### DoD homologação (depois do código)

- [ ] iPhone: gravar áudio, editar transcrição, salvar.
- [ ] Busca `dente 24` no histórico.
- [ ] Tablet/viewport: anamnese sem menu.
- [ ] Envio pós-cirurgia para 2º telefone (número de teste).
- [ ] Odontograma cruz reconhecível vs `docs/assets/odontograma-formato-cruz.png`.

### Explicitamente fora desta fase

- Inbox/bot WhatsApp (DeskcommCRM).
- Template rico de pós-cirurgia (só se Felipe pedir).
- OCR, Clinicorp, módulo financeiro.
- Playwright.

---

## 8. Escopo de arquivos (orientação)

Implementação **principal** em:

- `src/features/records/` (transcrição, busca, odontograma, aba pós-cirurgia)
- `src/features/patients/` (2º telefone)
- `src/features/stock/` ou `reminders`/e-mail (alerta financeiro)
- `src/app/anamnese/[token]/` (página pública)
- `supabase/migrations/019_*.sql`
- `docs/implementation/`, `docs/manual-dev/`, `docs/state/PENDENCIAS.md`

Provedor WhatsApp: pasta `src/lib/whatsapp/` (cliente fino, server-only). Escolher uma lib e documentar. Não colocar SDK no client.

**Proibido:** `.env.local`, secrets, editar migrations antigas, Playwright.

Lista fechada de arquivos no início da implementação (amend desta spec se o desenho mudar).

---

## 9. Decisões fechadas

| # | Decisão |
| - | ------- |
| 1 | Transcrição **editável** após Whisper |
| 2 | Busca textual no histórico do **mesmo** paciente |
| 3 | Anamnese isolada: link **e** tablet; sem AppShell |
| 4 | Automações ao paciente: **WhatsApp** |
| 5 | Pós-cirurgia: aba + texto livre |
| 6 | Destino: telefone do paciente, senão 2º contato |
| 7 | Estoque baixo: e-mail financeiro (endereço pendente) |
| 8 | 2º telefone opcional + observação |
| 9 | Odontograma **cruz** FDI, três vistas |
| 10 | Inbox WhatsApp **não** entra neste repo |
| 11 | Migration incremental; não reescrever F3 |

---

## 10. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Provedor WhatsApp indefinido | Interface `sendWhatsApp({ to, body })`; implementar um adapter |
| PHI no log de mensagem | Guardar destino mascarado e id; não logar corpo completo |
| Tablet com sessão de staff | Token kiosk, **não** login do dentista no aparelho do paciente |
| Cruz ilegível no celular | Zoom + scroll; faces clicáveis ≥ 44px |
| E-mail financeiro ausente | Job no-op até configurar |

---

## 11. Referências

- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`
- Plano: `docs/plans/plano-F7.md`
- PRD: `prd-mvp.md` D17–D24
- Spec F3: `specs/2026-08-18-fase-3-pacientes-prontuario.md`
- Spec F5: `specs/2026-08-18-fase-5-insumos-estoque.md`
- Spec F6: `specs/2026-08-18-fase-6-lembrete-piloto.md` (lembrete dentista permanece e-mail)
- Imagem: `docs/assets/odontograma-formato-cruz.png`

---

## 12. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch `feature/fase-7-ajustes-demo-felipe` seguindo `docs/plans/plano-F7.md`, um passo por vez (começar pelo passo 1: transcrição editável + 2º telefone).
