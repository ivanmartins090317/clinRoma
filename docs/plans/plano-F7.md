# Plano F7 · Ajustes pós-demo Felipe

> Fase 7 do `docs/PLANO.md` · Autonomia: **medium**
> Status: **rascunho · aguardando aprovação**
> Spec: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`
> Origem: demo 2026-08-25 (Felipe gostou) + questionário papel 2026-08-25

## Como usar no workflow

1. Aprovar este plano (prompt 02).
2. Spec já existe (prompt 03). Se o plano mudar a spec, amend só depois de você pedir.
3. **Branch de código** (prompt 04): `feature/fase-7-ajustes-demo-felipe` a partir do `main`.
4. Não implementar na branch `docs/fase-7-ajustes-demo-felipe` (só docs/spec).

**Pronto quando:** F7-01 a F7-09 passam no DoD; transcrição corrige na UI; anamnese é o questionário papel (Sim/Não); card do paciente mostra resumo da anamnese + último procedimento; cruz bate com `docs/assets/odontograma-formato-cruz.png`.

---

## Objetivo

Transformar o feedback da demo em código, sem reabrir F0–F6.

| ID | Tarefa | Passo |
| -- | ------ | ----- |
| F7-01 | Transcrição de áudio **editável** | 1 |
| F7-07 | 2º telefone + observação no cadastro | 1 |
| F7-09 | Card do paciente: resumo da **anamnese** + **último procedimento** | 1 |
| F7-02 | Busca no histórico (ex.: `dente 24`) | 2 |
| F7-08 | Odontograma em **formato de cruz** | 3 |
| F7-03 | Anamnese isolada (link + tablet) **com o questionário papel** | 4 |
| F7-04 | Canal WhatsApp ao paciente (disparo, sem inbox) | 5 |
| F7-05 | Aba pós-cirurgia (texto livre → WhatsApp) | 5 |
| F7-06 | Estoque baixo → e-mail do financeiro | 6 |

Fotos do questionário (fonte da verdade da anamnese):

- `docs/assets/anamnese-questionario-p1.png`
- `docs/assets/anamnese-questionario-p2.png`

O formulário atual (`anamnesis-form-v1.ts`, campos de texto livre) **não** é o do Felipe. A F7 substitui pela versão 2, idêntica ao papel.

---

## 1. Abordagem (6 passos)

### Passo 1 · Cadastro, transcrição e card do paciente (F7-07 + F7-01 + F7-09)

Migration incremental `019_ajustes_demo_f7.sql`: `patients.secondary_phone`, `patients.secondary_phone_note`. Não editar migrations antigas.

Cadastro: campos no `patient-form` e `patient-summary`, labels claros (parente, paciente sem WhatsApp). Default: **opcional**.

Evolução: hoje `transcription-status.tsx` mostra `blockquote` só leitura. Trocar por textarea + action `updateTranscriptionAction` quando status = `completed`. Áudio original não muda.

**Card do paciente (F7-09):** no topo do prontuário (`patient-summary`), além de nome/CPF/contato, mostrar um **resumo clínico rápido**:

| Bloco | O que aparece |
| ----- | ------------- |
| Anamnese | Data da versão vigente; alerta se > 12 meses; doenças marcadas; medicamentos; alergias; 3–5 respostas **Sim** mais relevantes |
| Último procedimento | Nome do procedimento da última consulta **concluída** (fallback: título/trecho da última evolução) + data |

Sem o formulário inteiro no card. Um toque/link abre a aba Anamnese ou a evolução correspondente. Lista de pacientes (`patient-list`) **não** precisa do resumo completo nesta fase.

### Passo 2 · Busca no histórico (F7-02)

Input na `evolution-list` (e/ou `patient-chart`). Filtro case-insensitive em corpo da evolução e transcrição, só daquele paciente. Sem busca global da clínica. Teste: substring `dente 24`.

### Passo 3 · Odontograma cruz (F7-08)

Reescrever UI de `odontogram.tsx` e `odontogram-mobile.tsx`. Persistência continua em `tooth_findings` (FDI + face). Referência: `docs/assets/odontograma-formato-cruz.png`.

Layout: cruz (horizontal = superior/inferior, vertical = direita/esquerda do paciente). Quadrantes 18–11, 21–28, 48–41, 31–38. Três vistas empilhadas por dente (raiz, coroa, oclusal). Mobile: zoom/scroll, alvos ≥ 44px.

### Passo 4 · Anamnese isolada + questionário papel (F7-03)

Dois modos **sem AppShell** (igual ao combinado na demo):

- Tabela `anamnesis_tokens` (hash, patient_id, expires_at, kind `pre_visit` | `kiosk`).
- Rota pública `/anamnese/[token]` (padrão da fila F4).
- Paciente **não** vê menu, agenda, estoque nem outras abas.

**UI do questionário (obrigatório):**

- Cada pergunta: **checkbox Sim** e **checkbox Não** (exclusivos, um dos dois).
- Se a pergunta no papel tem complemento (`Por quê?`, `Qual(is)?`, `Se sim, qual(is)?`): campo de texto. Mostrar o campo quando a resposta for **Sim** (e sempre visível no papel para as três primeiras; na tela, abrir ao marcar Sim evita lixo).
- Lista **Já foi acometido de alguma dessas doenças?**: vários checkboxes (pode marcar mais de um), **não** é Sim/Não por doença.
- Bloco **Apenas para mulheres**: só se sexo da paciente for feminino; se sexo não informado no preenchimento público, **mostrar** o bloco (o papel sempre imprime).
- Rodapé: texto exato *Atesto serem verdadeiras as informações supracitadas a respeito do Questionário para Paciente.* + nome + confirmação.
- Cabeçalho na tela pública: Dr. Fellipe S. Roma, Cirurgião-Dentista, Especialista em Cirurgia e Traumatologia Buco-Maxilo-Facial, título **QUESTIONÁRIO PARA O PACIENTE**, nome do paciente (somente leitura).

Conteúdo **letra a letra** no apêndice abaixo. Versão de formulário: **2**. Histórico v1 permanece consultável, sem migrar conteúdo.

### Passo 5 · WhatsApp e pós-cirurgia (F7-04 + F7-05)

Inbox/bot **não** entram neste repo. Só disparo.

- `src/lib/whatsapp/` com `sendWhatsApp({ to, body })` (server-only). Um adapter na implementação (WAHA, Cloud API ou bridge). Interface estável para trocar o provedor depois.
- Tabela `patient_messages` (destino, status, autor, appointment_id opcional).
- Nova aba no `patient-chart`: texto livre + enviar.
- Destino: `contact_phone`; senão `secondary_phone`; senão botão desabilitado.
- Link de anamnese (passo 4) também sai por esse sender.

Logs/Sentry: sem corpo completo da mensagem (PHI).

### Passo 6 · E-mail financeiro e fechamento (F7-06)

Mesmo gatilho de estoque baixo da F5. Enfileirar e-mail Resend para `FINANCE_ALERT_EMAIL` (`.env.example`). Se vazio, **não** dispara (Felipe ainda não passou o endereço). Sem tela de configurações nesta fase, a menos que já exista um lugar natural.

Fechar fase: `docs/implementation/F7-ajustes-demo-felipe.md`, `docs/manual-dev/09-fase-7-ajustes-demo-felipe.md`, atualizar `PENDENCIAS.md` e índices. Skill `close-phase`.

---

## Apêndice · Questionário papel (copiar para `anamnesis-form-v2.ts`)

Fonte: fotos Felipe. Não resumir, não inventar pergunta.

### Bloco 1 · Saúde geral

| id | Tipo | Texto | Complemento |
| -- | ---- | ----- | ----------- |
| `health_ok` | Sim/Não | Está bem de saúde atualmente? | `Por quê?` se Sim |
| `under_medical_care` | Sim/Não | Está ou esteve recentemente sob cuidados médicos? | `Por quê?` se Sim |
| `taking_medication` | Sim/Não | Mesmo não estando em tratamento, está tomando algum medicamento? | `Qual(is)?` se Sim |

**Já foi acometido de alguma dessas doenças?** (multi checkbox, ids `disease_*`):

Anemia · Úlcera · Sífilis · Problemas Cardíacos · Hepatite · Tuberculose · Doença de Chagas · Asma · Diabetes · Febre Reumática · Hemofilia · Problemas Hepáticos · Nefrite · Epilepsia · Hipertensão · Sinusite

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

| id | Tipo | Texto |
| -- | ---- | ----- |
| `menopause` | Sim/Não | Já entrou na menopausa? |
| `osteoporosis_or_family` | Sim/Não | Tem osteoporose ou alguém da família teve? |
| `pregnant` | Sim/Não | Está grávida? |

### Declaração

Texto fixo: *Atesto serem verdadeiras as informações supracitadas a respeito do Questionário para Paciente.*

---

## 2. Arquivos a criar ou alterar

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `docs/plans/plano-F7.md` | Este plano |
| `src/features/records/domain/anamnesis-form-v2.ts` | Questionário papel + ids + testes |
| `supabase/migrations/019_ajustes_demo_f7.sql` | 2º telefone, tokens anamnese, patient_messages |
| `src/features/records/components/post-surgery-message.tsx` | Aba pós-cirurgia |
| `src/features/records/components/evolution-search.tsx` | Busca no histórico (se não couber na list) |
| `src/features/records/domain/evolution-search.ts` | Filtro de texto + teste |
| `src/features/records/domain/whatsapp-destination.ts` | Paciente vs 2º contato + teste |
| `src/features/records/domain/patient-card-summary.ts` | Recorte anamnese + último procedimento |
| `src/lib/whatsapp/send-whatsapp.ts` | Adapter server-only |
| `src/app/anamnese/[token]/page.tsx` | Anamnese pública / kiosk |
| `src/app/anamnese/layout.tsx` | Layout sem AppShell |
| `src/features/records/lib/anamnesis-token.ts` | Criar/validar token (hash) |
| `docs/implementation/F7-ajustes-demo-felipe.md` | Ao fechar (passo 6) |
| `docs/manual-dev/09-fase-7-ajustes-demo-felipe.md` | Ao fechar (passo 6) |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/records/components/transcription-status.tsx` | Textarea + salvar (F7-01) |
| `src/features/records/actions.ts` | Corrigir transcrição; salvar anamnese v2; disparar WhatsApp |
| `src/features/patients/components/patient-form.tsx` | 2º telefone + observação |
| `src/features/patients/components/patient-summary.tsx` | Card: anamnese + último procedimento (F7-09) |
| `src/features/patients/schemas.ts` / `actions.ts` / `queries.ts` | Campos novos + dados do card |
| `src/features/records/queries.ts` | Última anamnese + último procedimento |
| `src/features/records/components/evolution-list.tsx` | Busca (F7-02) |
| `src/features/records/components/patient-chart.tsx` | Aba pós-cirurgia; trigger anamnese |
| `src/features/records/components/odontogram.tsx` | Cruz desktop |
| `src/features/records/components/odontogram-mobile.tsx` | Cruz mobile |
| `src/features/records/components/anamnesis-form.tsx` | Sim/Não + complementos + doenças |
| `src/features/records/components/anamnesis-history.tsx` | Render v1 e v2 |
| `src/features/stock/` (action/job do alerta) | Hook e-mail financeiro |
| `.env.example` | `FINANCE_ALERT_EMAIL`, vars WhatsApp |
| `src/lib/supabase/database.types.ts` | Regenerar após 019 |
| `docs/state/PENDENCIAS.md` | Marcar F7-01…F7-09 |
| `docs/implementation/README.md` | Índice F7 |
| `docs/manual-dev/README.md` | Índice F7 |
| `.cursor/rules/project-general.mdc` | WhatsApp: disparo F7, inbox fora |
| `AGENTS.md` | Já apontado; conferir no close-phase |

### Não criar nesta fase

Tela `/configuracoes` completa. E-mail financeiro via env até o Felipe passar o endereço.

---

## 3. Fora de escopo

- Inbox, bot, conversa WhatsApp (DeskcommCRM)
- Reabrir F0–F6 (agenda, fila, scan, lembrete dentista)
- Template rico de pós-cirurgia (texto livre até Felipe pedir)
- OCR, Clinicorp, módulo financeiro
- Playwright
- Editar migrations `001`–`018`
- Sobrescrever `.env.local`
- Reescrever anamneses antigas (v1) para o novo JSON

---

## 4. Riscos técnicos

| Risco | Mitigação |
| ----- | --------- |
| Provedor WhatsApp indefinido | Interface `sendWhatsApp`; um adapter; env documentado |
| PHI no log da mensagem | Destino mascarado; sem corpo completo em log/Sentry |
| Tablet com sessão de staff | Token kiosk, **nunca** login do dentista no aparelho do paciente |
| Cruz ilegível no celular | Zoom/scroll; faces ≥ 44px; desktop e mobile no mesmo domínio |
| `odontogram.tsx` passar de 300 linhas | Extrair `odontogram-cross.tsx` / `tooth-views.tsx` |
| `anamnesis-form.tsx` passar de 300 linhas | Schema em `anamnesis-form-v2.ts`; UI por bloco |
| E-mail financeiro vazio | Job no-op se `FINANCE_ALERT_EMAIL` ausente |
| Anamnese pública vazar PHI | Token opaco + hash (padrão F4); mínimo de dados na página |
| Card do paciente pesado | Resumo derivado no servidor; sem carregar todas as evoluções |

---

## 5. Paths críticos

**Sim.** A Fase 7 toca prontuário (PHI) e rotas públicas.

| Path | Impacto |
| ---- | ------- |
| `src/features/records/components/patient-chart.tsx` | Todas as abas do prontuário |
| `src/features/patients/components/patient-summary.tsx` | Primeira coisa que o dentista lê no paciente |
| `src/features/records/domain/anamnesis-form-v2.ts` | Contrato do questionário clínico |
| `src/features/records/actions.ts` | Escrita clínica + novo disparo WhatsApp |
| `src/features/records/components/odontogram.tsx` | UI clínica diária do dentista |
| `src/app/anamnese/[token]/page.tsx` | Rota pública (LGPD), irmã da fila |
| `src/lib/whatsapp/send-whatsapp.ts` | Saída para paciente; secret no server |
| `supabase/migrations/019_ajustes_demo_f7.sql` | Schema + RLS de tokens e mensagens |
| `.env.example` | Onboarding; sem secrets reais |

Paths **não** críticos de runtime: índices de docs, este plano, `.cursor/rules/project-general.mdc`.

---

## Decisões pendentes (antes ou durante o passo 5)

Não bloqueiam os passos 1–3.

1. Provedor WhatsApp: WAHA, Cloud API ou bridge DeskcommCRM?
2. 2º telefone obrigatório ou só quando o paciente não tem WhatsApp? **Default do plano: opcional.**
3. Link de anamnese sempre via WhatsApp? **Default: sim.**
4. Texto-padrão no pós-cirurgia? **Default: 100% livre.**
5. E-mail do financeiro (Felipe ainda vai passar). Job aceita env vazio.
6. Card: último procedimento vem da consulta concluída ou da última evolução se não houver procedimento vinculado? **Default: consulta concluída, senão evolução.**

---

Aguardando aprovação deste plano. Depois: branch `feature/fase-7-ajustes-demo-felipe` e prompt 04 com spec `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`.
