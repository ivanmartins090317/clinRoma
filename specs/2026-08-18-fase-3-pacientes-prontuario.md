# Spec · Fase 3 · Pacientes e prontuário

| Campo            | Valor                          |
| ---------------- | ------------------------------ |
| **Status**       | draft                          |
| **Data**         | 2026-08-18                     |
| **Slug**         | fase-3-pacientes-prontuario    |
| **Plano origem** | `docs/PLANO.md` §6             |
| **Fase**         | 3 de `docs/PLANO.md`           |

---

## 1. Contexto

A Fase 2 entregou agenda operacional: recepção marca, remarca e cancela consultas; dentista vê o dia no celular. Pacientes existem apenas como registros mínimos para vincular consultas (seed + busca na agenda). A tela **Pacientes** continua placeholder; não há ficha clínica, anamnese, odontograma, evolução, anexos nem transcrição de áudio.

Esta feature coloca o **prontuário eletrônico em uso clínico real**, com foco no **celular do dentista** no consultório: abrir paciente a partir da agenda, gravar prescrição em áudio, anexar foto da etiqueta e ver a transcrição aparecer sem recarregar a página. É o módulo de maior sensibilidade (PHI/LGPD) até aqui e prepara a Fase 4 (fila vinculada a paciente) e fluxos futuros de lembrete.

**Pré-requisito:** Fases 1 e 2 concluídas e aprovadas (modelo de pacientes e prontuário já persistido com políticas de acesso, agenda funcional, buckets privados de fotos e áudios, helper de auditoria disponível).

---

## 2. Objetivo

Permitir **busca e cadastro de pacientes com consentimento LGPD**, **anamnese digital versionada**, **odontograma interativo**, **evolução clínica com foto e áudio** (gravação otimizada para consultório) e **transcrição assíncrona do áudio**, com **auditoria em leitura e escrita** do prontuário.

**Valor entregue:** o dentista documenta o atendimento no celular, sem planilha nem papel; a recepção cadastra e localiza pacientes; o histórico clínico fica centralizado e rastreável.

---

## 3. Atores

| Ator             | Interesse                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| Recepção         | Buscar, cadastrar e atualizar dados cadastrais; registrar consentimento LGPD |
| Administrador    | Mesmas capacidades da recepção no cadastro; acesso total ao prontuário     |
| Dentista         | Anamnese, odontograma, evolução, foto e áudio; abrir paciente pela agenda no celular |
| Visualizador     | Consultar dados demográficos do paciente; **sem** conteúdo clínico        |
| Auxiliar de sala | Sem acesso ao módulo Pacientes (mantido da Fase 1)                        |
| Desenvolvedor    | Regras de domínio testadas; transcrição assíncrona; auditoria ativa       |

---

## 4. Modelo de domínio

### 4.1 Paciente

Entidade já persistida na Fase 1. Campos relevantes nesta fase:

- **Nome completo** (obrigatório).
- **Data de nascimento** (opcional, recomendada).
- **CPF** (opcional; quando informado, deve ser único na clínica).
- **Telefone** e **e-mail** de contato (opcionais).
- **Consentimento LGPD:** momento em que o paciente (ou responsável) concordou com o tratamento de dados; obrigatório para concluir cadastro novo.
- **Responsável pelo cadastro** implícito na sessão autenticada.

### 4.2 Registro clínico

Documento do prontuário vinculado a um paciente. Tipos nesta fase:

- **Anamnese:** formulário estruturado acordado com o piloto (modelo Dr. Fellipe S. Roma), com seções de saúde geral, alergias, medicamentos em uso, condições sistêmicas, hábitos e **assinatura digital** (confirmação explícita + nome digitado). Cada envio gera uma **nova versão imutável**; versões anteriores permanecem consultáveis.
- **Evolução:** texto livre ou estruturado mínimo (queixa, procedimento realizado, orientações, prescrição/resumo), opcionalmente vinculada à **consulta agendada** em andamento ou recente e ao **dentista** responsável.

Conteúdo armazenado de forma estruturada (JSON) com metadados: versão do formulário, data/hora de preenchimento, autor.

### 4.3 Validade da anamnese

- Anamnese considerada **vigente** por **12 meses** a partir da data de assinatura da versão mais recente.
- Após expirar, a ficha exibe **alerta visível** ("Anamnese desatualizada") e incentiva nova versão antes ou durante o atendimento.
- Expirada **não bloqueia** evolução ou odontograma nesta fase (decisão fechada §12).

### 4.4 Achado odontológico (odontograma)

Um registro por combinação **paciente + dente + face**, usando numeração **FDI** (11 a 48) e faces padronizadas (vestibular, lingual/palatina, mesial, distal, oclusal ou incisal). Cada achado tem **código de condição** (ex.: saudável, cárie, restauração, ausente, tratamento indicado) e **responsável pela última alteração**.

Alteração no odontograma **atualiza ou cria** o achado correspondente; histórico fino por dente fica na trilha de auditoria (§6.8), não em tabela separada nesta fase.

### 4.5 Anexo clínico

Arquivo privado vinculado a um registro clínico de evolução:

- **Foto:** imagem da etiqueta ou registro visual; captura preferencial pela **câmera traseira** no celular.
- **Áudio:** gravação da prescrição ou evolução falada; formato escolhido **em tempo de execução** conforme suporte do navegador (AAC/mp4 no iOS, WebM/Opus no Android).

Metadados: tipo MIME, tamanho, caminho privado no armazenamento, autor, momento.

### 4.6 Transcrição do áudio

Processamento **assíncrono** do anexo de áudio via serviço Whisper (OpenAI). Situações:

- **Pendente:** aguardando fila.
- **Processando:** enviado ao serviço.
- **Concluída:** texto disponível anexado ao registro.
- **Falhou:** áudio permanece disponível; mensagem de erro amigável; retentativa manual permitida.

A interface atualiza o status **sem recarregar a página** (polling ou equivalente leve).

### 4.7 Auditoria do prontuário

Toda **leitura** da ficha clínica (abertura do prontuário, visualização de anamnese, odontograma ou evolução) e toda **escrita** (cadastro, anamnese, achado, evolução, anexo) gera entrada no **registro de auditoria** via helper existente, com entidade, ação e metadados mínimos (ex.: origem "agenda", "lista-pacientes").

---

## 5. Matriz de acesso (pacientes e prontuário)

Coerente com a Fase 1; refinamentos onde a UI expõe ações.

| Ação                                      | admin | reception | dentist | viewer |
| ----------------------------------------- | :---: | :-------: | :-----: | :----: |
| Listar e buscar pacientes                 |  Sim  |    Sim    |   Sim   |  Sim   |
| Ver dados cadastrais (nome, contato, CPF) |  Sim  |    Sim    |   Sim   |  Sim   |
| Criar / editar cadastro e consentimento LGPD | Sim |    Sim    |   Sim   |  Não   |
| Ver anamnese, odontograma, evoluções       |  Sim  |    Sim    |   Sim   |  Não   |
| Criar nova versão de anamnese             |  Sim  |    Sim    |   Sim   |  Não   |
| Alterar odontograma                       |  Sim  |    Sim    |   Sim   |  Não   |
| Registrar evolução com foto/áudio         |  Sim  |    Não*   |   Sim   |  Não   |
| Ouvir áudio / ver foto                    |  Sim  |    Sim    |   Sim   |  Não   |
| Disparar nova tentativa de transcrição    |  Sim  |    Não    |   Sim   |  Não   |
| Ver registro de auditoria (painel)        |  Sim  |    Não    |   Não   |  Não   |

**\*** Recepção **não** registra evolução clínica nesta fase (decisão fechada §12); pode cadastrar paciente e consultar prontuário.

Políticas no banco da Fase 1 já excluem **visualizador** do conteúdo clínico e **auxiliar** do módulo. Escrita continua restrita conforme políticas existentes; UI espelha a matriz.

---

## 6. Escopo funcional

### 6.1 Feature `patients`

Estrutura em `src/features/patients/`:

- **Consultas de leitura:** listagem paginada ou limitada, busca por nome (e CPF quando informado), detalhe cadastral.
- **Ações de escrita:** criar paciente, atualizar dados cadastrais, registrar consentimento LGPD.
- **Esquemas** Zod compartilhados (validação de CPF quando presente, campos obrigatórios, consentimento).
- **Componentes:** lista com busca, formulário de cadastro/edição, card de resumo cadastral.

### 6.2 Feature `records`

Estrutura em `src/features/records/`:

- **Consultas de leitura:** histórico de anamneses (versões), achados odontológicos, evoluções com anexos e status de transcrição.
- **Ações de escrita:** nova versão de anamnese, upsert de achado odontológico, criar evolução, anexar foto, finalizar áudio, enfileirar transcrição, retentar transcrição.
- **Regras de domínio puras** testáveis: validade da anamnese (12 meses), validação FDI, validação de MIME/tamanho na borda.
- **Componentes:** ficha do paciente com abas ou seções (Resumo, Anamnese, Odontograma, Evoluções).

### 6.3 Tela Pacientes (`/pacientes`)

- Substituir placeholder por **lista com busca** (campo de texto, debounce, estado vazio amigável).
- Ação **Novo paciente** para recepção, admin e dentista.
- Toque/ clique abre **ficha do paciente** (`/pacientes/[id]`).
- Mobile-first: busca e lista legíveis em tela estreita; alvos de toque ≥ 44×44 px.

### 6.4 Cadastro e consentimento LGPD

Formulário de paciente:

- Nome completo, nascimento, CPF, telefone, e-mail.
- Bloco de **consentimento LGPD:** texto informativo resumido + checkbox obrigatório ("Li e o paciente concorda...") + campo **nome para assinatura** (quem consente).
- Sem consentimento: cadastro **não** conclui.
- CPF duplicado: mensagem clara; oferecer link para abrir paciente existente quando aplicável.
- Edição posterior atualiza dados cadastrais; **não apaga** consentimento já registrado (novo consentimento só se fluxo explícito de renovação for acionado no futuro; nesta fase, consentimento inicial basta).

### 6.5 Anamnese versionada

- Formulário multi-seção baseado no **modelo Dr. Fellipe S. Roma** (campos definidos em esquema versionado em código, ex.: `ANAMNESIS_FORM_VERSION = 1`).
- Botão **Salvar nova versão** cria registro clínico imutável; não sobrescreve versão anterior.
- Lista ou timeline de versões anteriores (data, autor, preview).
- Banner de **anamnese expirada** quando última versão &gt; 12 meses.
- Assinatura: checkbox + nome digitado persistidos no conteúdo estruturado.

### 6.6 Odontograma interativo

- Representação visual da arcada **FDI** com seleção de dente e face.
- Paleta de condições clínicas acordadas (mapa de códigos → cor/label pt-BR).
- Persistência imediata ou em lote ao confirmar alteração (decisão fechada §12: salvar ao confirmar cada dente/face).
- **Desktop:** arcada completa visível.
- **Mobile:** layout dedicado com **zoom** (pinch ou controles +/-), **pan** e seleção por toque; dente selecionado exibe faces em painel inferior acessível ao polegar.

### 6.7 Evolução clínica

- Criar evolução a partir da ficha ou **contexto de consulta** quando aberto pela agenda (consulta pré-selecionada).
- Campos mínimos: texto da evolução (textarea, fonte 16px no mobile).
- **Foto:** input de arquivo com `capture="environment"` no mobile; upload para bucket privado de fotos; preview na ficha.
- **Áudio:** gravador dedicado (§6.9); ao finalizar, vincula anexo e enfileira transcrição.
- Lista cronológica de evoluções na ficha (mais recente primeiro).

### 6.8 Auditoria

- Ao abrir ficha clínica (`/pacientes/[id]` com abas clínicas): auditoria de **leitura** (`action: read`, entidade paciente ou prontuário).
- Ao salvar anamnese, achado, evolução ou anexo: auditoria de **escrita** com verbo adequado (`create`, `update`).
- Falha na auditoria **não bloqueia** operação clínica, mas registra erro server-side (log sem PHI); decisão fechada §12.
- Metadados sem corpo de anamnese, CPF completo ou transcrição (alinhado a `docs/SECURITY.md`).

### 6.9 Gravador de áudio (consultório)

Componente client isolado, otimizado para **mobile**:

- Botão grande **Gravar / Parar** na metade inferior da tela.
- **Cronômetro** visível durante gravação.
- **Indicador de nível** de áudio (VU simplificado).
- Escolha de MIME via `MediaRecorder.isTypeSupported()` antes de iniciar; nunca formato fixo no código.
- **Upload em blocos** durante a gravação (chunks enviados periodicamente ao servidor), não só ao parar.
- Aviso claro se o navegador for para **segundo plano** no iOS (risco de interrupção).
- **Retomada de envio** se a rede cair: blocos pendentes reenviados ao reconectar; áudio preservado localmente até confirmação.
- Exige **HTTPS** (já habilitado no `npm run dev` desde Fase 0).
- Início da gravação apenas após **gesto do usuário** (toque).

### 6.10 Transcrição assíncrona (Whisper)

- Job server-side acionado após upload completo do áudio (route handler ou action dedicada com segredo server-side).
- Usa chave OpenAI em variável de ambiente (`OPENAI_API_KEY`); documentar em `.env.example`.
- Atualiza situação do anexo: pendente → processando → concluída ou falhou.
- Texto transcrito exibido na evolução; editável **não** nesta fase (somente leitura).
- Cliente faz **polling** leve (ex.: a cada 3 s) enquanto status pendente/processando; para ao concluir ou falhar.
- Falha na transcrição: áudio permanece ouvível; botão **Tentar novamente** para dentista/admin.

### 6.11 Integração com a agenda

Alteração mínima na Fase 2:

- Detalhe da consulta (agenda e Hoje): link **Abrir prontuário** → `/pacientes/[patientId]?consulta=[appointmentId]`.
- Ficha detecta parâmetro de consulta e pré-vincula nova evolução.
- Sem alterar regras de remarcação/cancelamento da agenda.

### 6.12 Persistência · reforços incrementais

Nova migration incremental (não reescrever `002_patients_records.sql`):

- Integridade referencial opcional entre registro clínico e consulta agendada (FK).
- Índice para busca por nome de paciente (trigram ou `ilike` otimizado).
- Gatilhos `updated_at` onde ainda ausentes em paciente e registros clínicos.

Regenerar tipos TypeScript após aplicar migration.

### 6.13 Seed de desenvolvimento

Estender seed idempotente:

- Pelo menos um paciente seed com **consentimento LGPD** preenchido.
- Opcional: uma anamnese de exemplo e um achado odontológico para demo.

### 6.14 Componentes de UI

Reutilizar shadcn existente; adicionar somente se necessário (tabs, textarea, progress, alert, scroll-area, toast/sonner para feedback).

Copy em pt-BR; sem travessão "—" em textos novos; inputs 16px; safe-area nos layouts mobile do gravador e odontograma.

---

## 7. Fora de escopo

- Fila Kanban operacional, oferta de horário, link público funcional (Fase 4).
- Estoque, scan QR, alertas de insumo (Fase 5).
- Lembrete pós-consulta por e-mail (Fase 6).
- Edição manual do texto transcrito pelo dentista.
- OCR de planilha ou documentos.
- Export LGPD automatizado.
- Assinatura digital com certificado ICP-Brasil.
- Vídeo, PDF ou outros tipos de anexo além de foto e áudio.
- Prontuário compartilhado entre clínicas / multi-tenant.
- Notificações push ao concluir transcrição.
- Bloqueio duro de evolução quando anamnese expirada.
- Painel de consulta ao registro de auditoria para admin (infra existe; UI admin Fase 6 ou posterior).
- Testes E2E / Playwright; homologação formal `manual-report` (Fase 6).
- Alteração da matriz de papéis ou novas migrations de domínios alheios a pacientes/prontuário.
- WhatsApp, Resend, integrações externas além da API Whisper.

---

## 8. Fluxos

### 8.1 Caminho feliz · Recepção cadastra paciente

1. Recepção autentica e abre **Pacientes**.
2. Aciona **Novo paciente**, preenche nome, contato e CPF.
3. Marca checkbox de consentimento LGPD e digita nome da assinatura.
4. Sistema valida campos, persiste paciente com momento de consentimento.
5. Redireciona para ficha do paciente; lista passa a incluir o novo registro.
6. Auditoria registra criação.

### 8.2 Caminho feliz · Busca e abertura da ficha

1. Dentista digita parte do nome na busca.
2. Resultados aparecem em até debounce configurado.
3. Seleciona paciente; ficha abre com resumo cadastral e abas clínicas.
4. Auditoria registra leitura do prontuário.

### 8.3 Caminho feliz · Nova anamnese

1. Dentista abre aba **Anamnese**.
2. Se última versão expirou (&gt; 12 meses), banner amarelo informa revalidação.
3. Preenche seções do formulário, confirma assinatura (checkbox + nome).
4. Aciona **Salvar nova versão**.
5. Nova versão aparece no topo do histórico; versões anteriores permanecem visíveis.
6. Auditoria registra criação.

### 8.4 Caminho feliz · Odontograma no mobile

1. Dentista abre aba **Odontograma** no iPhone.
2. Usa zoom para localizar dente 36; toca no dente.
3. Seleciona face oclusal e condição "Restauração".
4. Confirma; achado persiste e cor atualiza no diagrama.
5. Auditoria registra alteração.

### 8.5 Caminho feliz · Evolução com foto e áudio (critério principal do plano)

1. Dentista autentica no celular, abre **Agenda** ou **Hoje**, toca consulta de Maria Silva.
2. Aciona **Abrir prontuário** (consulta vinculada na URL).
3. Aba **Evoluções** → **Nova evolução**; consulta já selecionada.
4. Digita resumo breve; tira foto da etiqueta (câmera traseira).
5. Toque em **Gravar**, fala prescrição; cronômetro e nível visíveis; chunks sobem durante gravação.
6. Toque em **Parar**; sistema finaliza montagem do áudio no armazenamento privado.
7. Status da transcrição aparece "Processando..."; após polling, texto transcrito surge na mesma tela **sem recarregar**.
8. Evolução listada com foto, player de áudio e transcrição.
9. Repetir fluxo equivalente em **Android** (formato WebM/Opus).

### 8.6 Caminho feliz · Visualizador vê só cadastro

1. Visualizador abre **Pacientes** e busca paciente.
2. Vê nome, contato e dados demográficos.
3. Abas clínicas **não** exibem conteúdo (ou rota clínica retorna acesso negado).
4. Tentativa de leitura de anamnese via API server-side falha na política do banco.

### 8.7 Caminho feliz · Retentativa de transcrição

1. Anexo de áudio em situação **Falhou** (serviço indisponível simulado).
2. Dentista vê mensagem "Transcrição indisponível; áudio salvo".
3. Aciona **Tentar novamente**.
4. Job reenfileirado; status passa a processando e conclui com texto.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| CPF duplicado | Cadastro recusado; indicar paciente existente | Unicidade no banco + validação Zod |
| CPF inválido (dígitos) | Formulário não envia | Validação algorítmica opcional quando preenchido |
| Consentimento LGPD não marcado | Cadastro bloqueado | Campo obrigatório |
| Busca sem resultados | "Nenhum paciente encontrado" | Empty state; seed de dev |
| Visualizador acessa rota clínica | 403 ou ocultação de abas | Guarda UI + política RLS |
| Recepção tenta gravar áudio | Ação indisponível na UI; server recusa | Matriz §5 |
| Sessão expirada ao salvar | Redireciona ao login; dados locais do formulário perdidos (exceto áudio em buffer local) | Middleware; gravador persiste chunks localmente |
| iOS envia app para segundo plano durante gravação | Aviso imediato; gravação pode parar | Copy clara; upload parcial já enviado |
| Rede cai durante upload de chunk | Fila local de reenvio; indicador "Enviando..." | Retomada automática ao reconectar |
| Formato de áudio não suportado | Botão gravar desabilitado com explicação | Detecção `isTypeSupported` antes de iniciar |
| Arquivo foto grande ou MIME inválido | Rejeição com limite em pt-BR | Validação borda + limite do bucket (10 MB) |
| Áudio acima do limite (50 MB) | Parar gravação com aviso | Monitorar tamanho acumulado |
| Whisper falha ou timeout | Status **Falhou**; áudio ok | Retentativa manual; log server sem conteúdo clínico |
| Chave OpenAI ausente em dev | Transcrição falha com mensagem de configuração | `.env.example` documentado |
| Paciente sem consulta vinculada | Evolução permitida; consulta opcional | Campo nullable |
| Odontograma: dente inválido | Rejeição | CHECK 11–48 + validação domínio |
| Concorrência em achado (mesmo dente/face) | Upsert atualiza registro existente | Unicidade paciente+dente+face |
| Auditoria falha silenciosamente | Operação clínica conclui | Log técnico; teste unitário do helper |
| Abrir prontuário de paciente inexistente | 404 amigável | Validar id na query |
| Microfone sem permissão | Modal explicando como liberar | Tratamento `NotAllowedError` |
| HTTPS ausente em prod | Gravador/câmera não funcionam | Deploy Vercel HTTPS (Fase 6) |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Features `src/features/patients/` e `src/features/records/` conforme §6.
- [ ] Migration incremental aplicada via `npm run db:push`; tipos regenerados.
- [ ] `/pacientes` com busca e listagem; `/pacientes/novo` e `/pacientes/[id]` operacionais.
- [ ] Cadastro com consentimento LGPD obrigatório.
- [ ] Anamnese versionada (formulário v1 Dr. Fellipe S. Roma), histórico e alerta de 12 meses.
- [ ] Odontograma FDI persistindo achados; layout mobile com zoom e toque.
- [ ] Evolução com foto (bucket privado) e áudio (gravador §6.9).
- [ ] Transcrição Whisper assíncrona com status visível e atualização **sem reload**.
- [ ] Link **Abrir prontuário** no detalhe de consulta (agenda + Hoje).
- [ ] Auditoria em leitura (abertura ficha) e escrita (alterações clínicas).
- [ ] Testes unitários Vitest: validade anamnese, validação FDI, validação MIME/tamanho (meta ~80% nas funções de domínio tocadas).
- [ ] Autorização revalidada em toda action; RLS da Fase 1 intacta.
- [ ] Zod na borda de todas as actions de pacientes e prontuário.
- [ ] `OPENAI_API_KEY` documentada em `.env.example` (sem valor real).
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: RLS, fail secure, buckets privados, sem PHI em logs, sem `service_role` no client.
- [ ] **Teste manual em iPhone real e Android real:** fluxo §8.5 completo (obrigatório antes de fechar fase, conforme `docs/PLANO.md` §7).
- [ ] `docs/implementation/F3-pacientes-prontuario.md` criado; índice `docs/implementation/README.md` atualizado.
- [ ] `docs/manual-dev/05-fase-3-pacientes-prontuario.md` criado; índice `docs/manual-dev/README.md` atualizado.
- [ ] `docs/state/PENDENCIAS.md` atualizado (implementação vs homologação manual).

### Qualidade

- [ ] Copy em pt-BR; sem travessão "—" em textos novos.
- [ ] Nenhum arquivo alterado fora do escopo permitido (§11).
- [ ] Arquivos novos respeitam limite de ~300 linhas; dividir por domínio se necessário.
- [ ] Gravador: alvos ≥ 44×44 px; botão primário na metade inferior no mobile.
- [ ] Validação manual desktop: recepção cadastra, dentista preenche anamnese e odontograma.

### Explicitamente **não** exigido nesta fase

- Homologação `manual-report` completa (Fase 6).
- Painel admin de auditoria.
- Edição pós-transcrição.
- Bloqueio de evolução por anamnese expirada.
- Cobertura 80% global do repositório (apenas domínio tocado).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo / pasta | Motivo |
| --------------- | ------ |
| `specs/2026-08-18-fase-3-pacientes-prontuario.md` | Esta spec |
| `supabase/migrations/012_patients_records_f3.sql` | FK consulta, índice busca, triggers |
| `src/features/patients/queries.ts` | Leitura de pacientes |
| `src/features/patients/actions.ts` | Criar/atualizar paciente, consentimento |
| `src/features/patients/schemas.ts` | Zod cadastro e busca |
| `src/features/patients/components/patient-list.tsx` | Lista + busca |
| `src/features/patients/components/patient-form.tsx` | Cadastro/edição |
| `src/features/patients/components/patient-summary.tsx` | Resumo cadastral |
| `src/features/patients/domain/cpf.ts` | Validação/normalização CPF |
| `src/features/patients/domain/cpf.test.ts` | Testes CPF |
| `src/features/records/queries.ts` | Anamnese, odontograma, evoluções |
| `src/features/records/actions.ts` | Escrita clínica e anexos |
| `src/features/records/schemas.ts` | Zod anamnese, evolução, achados |
| `src/features/records/domain/anamnesis-expiry.ts` | Regra 12 meses |
| `src/features/records/domain/anamnesis-expiry.test.ts` | Testes validade |
| `src/features/records/domain/tooth-fdi.ts` | Validação dente/face |
| `src/features/records/domain/tooth-fdi.test.ts` | Testes FDI |
| `src/features/records/domain/anamnesis-form-v1.ts` | Definição campos formulário v1 |
| `src/features/records/domain/attachment-limits.ts` | MIME/tamanho |
| `src/features/records/domain/attachment-limits.test.ts` | Testes limites |
| `src/features/records/domain/transcription-status.ts` | Labels situação transcrição |
| `src/features/records/components/patient-chart.tsx` | Orquestra abas da ficha |
| `src/features/records/components/anamnesis-form.tsx` | Formulário + assinatura |
| `src/features/records/components/anamnesis-history.tsx` | Timeline de versões |
| `src/features/records/components/odontogram.tsx` | Diagrama desktop |
| `src/features/records/components/odontogram-mobile.tsx` | Zoom + toque |
| `src/features/records/components/evolution-list.tsx` | Lista cronológica |
| `src/features/records/components/evolution-form.tsx` | Nova evolução |
| `src/features/records/components/audio-recorder.tsx` | Gravador consultório |
| `src/features/records/components/photo-attachment.tsx` | Captura/upload foto |
| `src/features/records/components/transcription-status.tsx` | Polling + exibição texto |
| `src/features/records/lib/upload-audio-chunk.ts` | Cliente upload em blocos |
| `src/features/records/lib/pick-audio-mime.ts` | Escolha MIME runtime |
| `src/features/records/lib/pick-audio-mime.test.ts` | Testes MIME |
| `src/lib/transcription/whisper.ts` | Cliente server-side Whisper |
| `src/lib/transcription/enqueue-transcription.ts` | Enfileirar job |
| `src/app/(app)/pacientes/[id]/page.tsx` | Ficha do paciente |
| `src/app/(app)/pacientes/novo/page.tsx` | Cadastro |
| `src/app/api/records/audio-chunk/route.ts` | Receber blocos de áudio |
| `src/app/api/records/transcribe/route.ts` | Job transcrição (server-only) |
| `docs/plans/plano-F3.md` | Plano derivado opcional |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/app/(app)/pacientes/page.tsx` | Integrar lista real |
| `src/features/agenda/components/appointment-detail.tsx` | Link Abrir prontuário |
| `src/app/(app)/hoje/page.tsx` | Link Abrir prontuário no detalhe (se aplicável) |
| `src/features/agenda/components/patient-combobox.tsx` | Reutilizar busca de `patients` (refactor mínimo) |
| `supabase/migrations/011_seed_agenda_dev.sql` (ou `013_seed_records_dev.sql`) | Paciente com consentimento + demo clínico |
| `src/lib/supabase/database.types.ts` | Tipos regenerados |
| `.env.example` | `OPENAI_API_KEY` |
| `package.json` | Deps se necessário (ex.: `@radix-ui/react-tabs`) |
| `README.md` | Notas de homologação prontuário, Whisper, teste mobile |

### Pode incluir no commit (não bloqueia DoD)

| Path | Nota |
| ---- | ---- |
| `src/components/ui/tabs.tsx`, `textarea.tsx`, `alert.tsx`, `progress.tsx`, `scroll-area.tsx`, `sonner.tsx` | shadcn se necessário |
| `docs/plans/plano-F3.md` | Espelho do plano de fase |

### Proibido alterar nesta feature

- `src/app/fila/**` (exceto menção passiva se já existir).
- `src/features/stock/**`, `waitlist/**`, `reminders/**`.
- `src/features/agenda/**` exceto arquivos listados em Alterar.
- Políticas RLS de fila, estoque (salvo migration 012 focada em pacientes/prontuário).
- `src/lib/auth/roles.ts` (matriz já correta; mudança exige nova spec).
- `docs/SECURITY.md`.
- `.env.local` ou qualquer arquivo com segredos reais.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Anamnese: **versões imutáveis**; cada salvamento cria novo registro clínico |
| 2 | Validade anamnese: **12 meses**; alerta visual, **sem bloquear** evolução |
| 3 | Formulário anamnese v1: modelo **Dr. Fellipe S. Roma**; versão de esquema em código |
| 4 | Assinatura anamnese: **checkbox + nome digitado** |
| 5 | Odontograma: numeração **FDI 11–48**; persistência por dente+face; salvar ao confirmar seleção |
| 6 | Mobile odontograma: **zoom + pan + toque**; layout separado do desktop |
| 7 | Áudio: MIME via **`MediaRecorder.isTypeSupported()`**; aceitar mp4 e webm no backend |
| 8 | Gravação: **upload em blocos durante** a gravação; retomada se rede cair |
| 9 | Transcrição: **Whisper API** assíncrona; polling client-side até concluir/falhar |
| 10 | Transcrição falhou: **áudio preservado**; retentativa manual |
| 11 | Recepção: cadastro e leitura clínica **sim**; **evolução com áudio/foto não** |
| 12 | Viewer: **só dados cadastrais**; conteúdo clínico oculto e barrado no banco |
| 13 | Auditoria: leitura ao abrir ficha + escrita em alterações; falha de audit **não bloqueia** clínica |
| 14 | Foto evolução: **`capture="environment"`** no mobile (câmera traseira) |
| 15 | Migration incremental **012**; não editar retroativamente `002` |
| 16 | Abrir prontuário pela agenda passa **consulta na query string** para vincular evolução |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| PHI exposto em logs ou Sentry | Checklist SECURITY; metadados mínimos na auditoria |
| `service_role` vazando ao client | Jobs só em route handlers server-side |
| iOS interrompe gravação em background | Upload parcial + aviso explícito §6.9 |
| Formato áudio incompatível | Detecção runtime §12.7 |
| Custo/latência Whisper | Assíncrono; áudio usable sem transcrição |
| Odontograma ilegível no mobile | Layout dedicado com zoom §6.6 |
| Concorrência no upload de chunks | Identificador de sessão de gravação + ordem dos blocos |
| CPF duplicado na recepção | Unicidade + UX de merge/link §9 |
| Escopo inflar para OCR ou edição de transcrição | Fora de escopo §7 |
| Teste só em emulador | DoD exige iPhone **e** Android reais §10 |

---

## 14. Referências

- `docs/PLANO.md` · §4 Estratégia mobile · §5 Pacientes e prontuário · §6 Fase 3 · §7 Qualidade
- `docs/SECURITY.md` · PHI, buckets privados, auditoria
- `specs/2026-08-18-fase-2-agenda.md`
- `specs/2026-08-18-fase-1-dados-auth-papeis.md`
- `docs/manual-dev/03-fase-1-dados-auth-papeis.md` · matriz de acesso, auditoria
- `.cursor/rules/architecture.mdc`
- `src/lib/audit/write-audit-log.ts`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch dedicada (sugestão: `feature/fase-3-pacientes-prontuario`), sem expandir escopo.
