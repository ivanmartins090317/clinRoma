# Spec · Fase 4 · Fila Kanban

| Campo            | Valor                          |
| ---------------- | ------------------------------ |
| **Status**       | draft                          |
| **Data**         | 2026-08-18                     |
| **Slug**         | fase-4-fila-kanban             |
| **Plano origem** | `docs/PLANO.md` §6             |
| **Fase**         | 4 de `docs/PLANO.md`           |

---

## 1. Contexto

As Fases 1 a 3 entregaram modelo de dados da fila (já persistido com políticas de acesso), autenticação por papel, agenda operacional, cadastro de pacientes com consentimento LGPD e prontuário. A tela **Fila Kanban** (`/fila`) continua um **demo estático** com colunas hardcoded e legenda de prioridades. A página pública `/fila/resposta/[token]` existe visualmente, mas checkbox e botões de aceitar/recusar estão **desabilitados**; não há validação de link, oferta de horário real nem criação automática de consulta.

Esta feature coloca a **fila de encaixe em operação real**: quando uma consulta é cancelada e libera vaga, a recepção encaixa um paciente da fila via link opaco; o paciente confirma pelo celular **sem login** e a consulta aparece na agenda **sem ligação telefônica**. É o elo entre cancelamento na agenda (Fase 2) e confirmação assíncrona pelo paciente, preparando alertas operacionais na **Hoje** e lembretes (Fase 6).

**Pré-requisito:** Fases 1, 2 e 3 concluídas e aprovadas (pacientes cadastrados, agenda com conflito de horário, políticas da fila no banco, rota pública fora do shell autenticado).

---

## 2. Objetivo

Permitir que a **recepção** gerencie a fila de espera em um **Kanban operacional** (prioridades vermelho/amarelo/verde e situações aguardando → oferta enviada → agendado), **ofereça horários liberados** com **link opaco válido por 40 minutos**, e que o **paciente** aceite ou recuse pelo celular em página pública leve, com **consentimento LGPD**. O **aceite** deve **criar a consulta na agenda em operação atômica**, respeitando conflito de horário.

**Valor entregue:** vaga de cancelamento vira consulta confirmada pelo link, sem a recepção precisar ligar; rastreabilidade da resposta do paciente sem expor dados clínicos na superfície pública.

---

## 3. Atores

| Ator             | Interesse                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| Recepção         | Incluir pacientes na fila, priorizar, oferecer horário, copiar link, acompanhar respostas |
| Administrador    | Mesmas capacidades da recepção na fila                                    |
| Dentista         | Consultar fila (somente leitura); sem ofertar horário                     |
| Paciente         | Abrir link no celular, ler horário oferecido, consentir e aceitar/recusar |
| Visualizador       | **Sem** acesso ao módulo Fila (mantido da Fase 1)                         |
| Auxiliar de sala | Sem acesso à fila (mantido da Fase 1)                                     |
| Desenvolvedor    | Regras de expiração e token testadas; rota pública segura; job de expiração |

---

## 4. Modelo de domínio

### 4.1 Entrada na fila

Representa um paciente aguardando encaixe. Campos relevantes (já persistidos na Fase 1):

- **Paciente** vinculado (obrigatório; deve existir com consentimento LGPD registrado).
- **Prioridade:** vermelho, amarelo ou verde (urgência clínica/operacional acordada com o piloto).
- **Motivo** (texto opcional, ex.: "dor", "retorno urgente").
- **Dentista preferido** (opcional).
- **Situação da entrada:** aguardando, oferta enviada, agendado, cancelado ou expirado.
- **Responsável pela inclusão** (colaborador autenticado).

Ordenação padrão dentro da coluna **Aguardando:** vermelho primeiro, depois amarelo, depois verde; desempate por data de inclusão (mais antigo primeiro).

### 4.2 Oferta de horário

Proposta enviada a uma entrada na fila quando a recepção libera um slot (tipicamente após cancelamento na agenda):

- **Entrada na fila** vinculada.
- **Início e fim** do horário oferecido (fim sempre posterior ao início).
- **Dentista** responsável pelo slot.
- **Link opaco:** token aleatório entregue **somente na URL** ao paciente; no armazenamento persiste **apenas o hash** do token (nunca o valor em claro).
- **Validade:** expira **40 minutos** após a criação da oferta (`expires_at`).
- **Situação da oferta:** pendente, aceita, recusada ou expirada.
- **Consulta criada** (opcional, preenchida após aceite).

Uma entrada em situação **oferta enviada** possui **no máximo uma oferta pendente** por vez.

### 4.3 Resposta do paciente à oferta

Registro imutável quando o paciente interage pelo link público:

- **Oferta** respondida.
- **Resposta:** aceitar ou recusar.
- **Consentimento LGPD:** obrigatório **true** para aceitar; registrado também na recusa (checkbox marcado antes de qualquer ação).
- **Momento** da resposta.
- **Hash do endereço de rede** do dispositivo (nunca IP em texto claro).

### 4.4 Regras de transição de situação

**Entrada na fila:**

| De            | Para           | Gatilho                                      |
| ------------- | -------------- | -------------------------------------------- |
| aguardando    | oferta enviada | Recepção cria oferta de horário              |
| oferta enviada | aguardando    | Paciente recusa, oferta expira ou recepção cancela oferta |
| oferta enviada | agendado      | Paciente aceita e consulta é criada          |
| aguardando    | cancelado     | Recepção remove da fila                      |
| oferta enviada | cancelado     | Recepção remove da fila (cancela oferta pendente) |

**Oferta de horário:**

| De       | Para     | Gatilho                                |
| -------- | -------- | -------------------------------------- |
| pendente | aceita   | Paciente aceita; slot livre            |
| pendente | recusada | Paciente recusa                        |
| pendente | expirada | Passou `expires_at` sem resposta       |

### 4.5 Aceite e agenda

Ao **aceitar**, em **uma única operação atômica**:

1. Validar oferta pendente e não expirada.
2. Validar token (hash) recebido na URL.
3. Validar consentimento LGPD marcado.
4. Verificar que o horário continua **livre** para o dentista (mesma regra de conflito da agenda).
5. Criar **consulta agendada** com situação `confirmed`, paciente da fila, dentista e intervalo da oferta.
6. Atualizar oferta para **aceita** e entrada para **agendado**.
7. Registrar resposta do paciente com hash de IP.

Se o slot foi ocupado entre a oferta e o aceite, a operação **falha** com mensagem amigável ao paciente ("Horário não está mais disponível") e a entrada volta para **aguardando** (oferta cancelada/expirada conforme regra §12).

### 4.6 Exibição pública (LGPD)

Na página do link, o paciente vê **somente**:

- Nome **parcial** (ex.: "Maria S." — primeiro nome + inicial do sobrenome).
- Data e horário oferecidos (formato legível, fuso America/Sao_Paulo).
- Primeiro nome do dentista ou "Dentista da clínica" (sem sobrenome completo se política do piloto preferir minimalismo).
- Contagem regressiva ou texto "Válido até HH:MM".
- Checkbox de consentimento e botões aceitar/recusar.

**Não** exibir: CPF, prontuário, motivo clínico da fila, outros pacientes, identificadores internos.

### 4.7 Expiração automática

Ofertas **pendentes** cujo prazo de validade já passou devem ser marcadas como **expiradas**; a entrada associada retorna a **aguardando** se ainda estiver em **oferta enviada**. Processo executado por **job agendado** server-side (não depende de alguém abrir a tela).

---

## 5. Matriz de acesso (fila)

Coerente com a Fase 1; refinamentos onde a UI expõe ações.

| Ação                                      | admin | reception | dentist | viewer |
| ----------------------------------------- | :---: | :-------: | :-----: | :----: |
| Ver fila Kanban                           |  Sim  |    Sim    |   Sim   |  Não   |
| Incluir paciente na fila                  |  Sim  |    Sim    |   Não   |  Não   |
| Alterar prioridade ou motivo              |  Sim  |    Sim    |   Não   |  Não   |
| Arrastar / mover situação (permitida)     |  Sim  |    Sim    |   Não   |  Não   |
| Oferecer horário e gerar link             |  Sim  |    Sim    |   Não   |  Não   |
| Cancelar oferta pendente                  |  Sim  |    Sim    |   Não   |  Não   |
| Remover entrada da fila                   |  Sim  |    Sim    |   Não   |  Não   |
| Copiar link da oferta                     |  Sim  |    Sim    |   Não   |  Não   |
| Ver histórico de respostas do paciente    |  Sim  |    Sim    |   Não   |  Não   |
| Link público aceitar/recusar              |  —‡   |    —‡     |   —‡    |  —‡    |

**‡** Rota pública, sem sessão; validação por token opaco server-side.

Escrita continua restrita a `admin` e `reception` via políticas já definidas na Fase 1. Respostas públicas usam **credencial server-only** (nunca exposta ao navegador do paciente).

---

## 6. Escopo funcional

### 6.1 Feature `waitlist`

Estrutura em `src/features/waitlist/`:

- **Consultas de leitura:** entradas agrupadas por situação operacional, ofertas pendentes, detalhe de entrada.
- **Ações de escrita:** criar entrada, atualizar prioridade/motivo, mover situação permitida, criar oferta, cancelar oferta, remover entrada.
- **Esquemas** Zod compartilhados.
- **Regras de domínio puras** testáveis: expiração (40 min), mascaramento de nome parcial, validação de transições, hash de token.

### 6.2 Kanban desktop (a partir de `md`)

Substituir demo estático por board real com **três colunas operacionais**:

1. **Aguardando** — entradas em espera de slot.
2. **Oferta enviada** — link gerado, aguardando resposta do paciente.
3. **Agendado** — encaixe confirmado (consulta criada).

Cada card exibe: nome do paciente, **badge de prioridade** (cor vermelho/amarelo/verde), motivo resumido, dentista preferido (se houver), tempo restante da oferta (coluna central), atalho para copiar link.

**Arrastar e soltar** entre colunas (mouse + sensores de toque via biblioteca DnD):

- **Aguardando → Oferta enviada:** **não** por arraste direto; exige fluxo **Oferecer horário** (formulário).
- **Oferta enviada → Aguardando:** permitido via arraste ou ação **Cancelar oferta** (equivale a recusa operacional pela clínica).
- **Oferta enviada → Agendado:** **somente** via aceite do paciente (automático); arraste manual **bloqueado**.
- **Aguardando → Agendado:** **bloqueado** (sem bypass da oferta).

Cards ordenados por prioridade dentro de **Aguardando** (§4.1).

### 6.3 Kanban mobile (abaixo de `md`)

Três colunas **não cabem** lado a lado. Comportamento:

- **Abas** (Aguardando | Oferta enviada | Agendado) com rolagem horizontal se necessário.
- Lista vertical de cards na aba ativa.
- **Menu de ação** em cada card (ícone "⋯" ou equivalente): alterar prioridade, cancelar oferta, remover da fila, **Oferecer horário**.
- Mover situação **sem depender de arrastar** (arraste opcional se DnD funcionar bem no toque; menu é obrigatório no DoD).
- Alvos de toque ≥ 44×44 px; botão **Oferecer horário** acessível na metade inferior quando modal aberto.

### 6.4 Inclusão e edição na fila

Formulário (modal ou sheet):

- Paciente (busca/reutilizar combobox de pacientes existente).
- Prioridade (vermelho / amarelo / verde).
- Motivo (opcional).
- Dentista preferido (opcional, lista de dentistas ativos).

Validações:

- Paciente obrigatório e com consentimento LGPD registrado.
- Não permitir duplicata: **um paciente só pode ter uma entrada ativa** (situação aguardando ou oferta enviada) por vez.

### 6.5 Oferta de horário

Fluxo acionado pela recepção a partir de um card em **Aguardando** ou atalho contextual (ex.: após cancelar consulta na agenda — ver §6.10):

1. Selecionar **data**, **hora início**, **hora fim** (default sugerido: mesma duração da consulta cancelada ou 30 min).
2. Selecionar **dentista** (default: dentista preferido da entrada ou dentista da vaga liberada).
3. Sistema valida conflito de horário **antes** de criar oferta.
4. Gera token criptograficamente aleatório; persiste hash; calcula expiração (+40 min).
5. Atualiza entrada para **oferta enviada**; exibe URL copiável (`/fila/resposta/{token}`).
6. Copy em pt-BR: "Envie este link ao paciente por SMS ou WhatsApp. Válido por 40 minutos."

**Canal de envio:** manual pela recepção na v1 (sem integração WhatsApp Business neste repo).

### 6.6 Página pública de resposta (`/fila/resposta/[token]`)

Substituir placeholder por fluxo real, **mobile-first**, sem shell autenticado, bundle mínimo:

- Server Component busca oferta por hash do token (via client admin server-only).
- Estados da página:
  - **Válida:** nome parcial, horário, countdown, checkbox LGPD habilitado, botões aceitar/recusar habilitados após checkbox.
  - **Expirada:** mensagem clara; botões desabilitados.
  - **Já respondida:** mensagem "Você já respondeu a esta oferta" (aceita ou recusada).
  - **Token inválido:** mensagem genérica "Link inválido ou expirado" (sem distinguir motivo — anti-enumeração).
- **Aceitar:** POST server-side; exige checkbox; retorna confirmação com resumo do horário.
- **Recusar:** POST server-side; exige checkbox; mensagem de agradecimento.
- Remover exibição de fragmento do token na UI (placeholder atual mostra `token: abc…` — **não** exibir token na página).
- Layout leve: logo, card central, safe-area, fonte legível, contraste adequado.

### 6.7 Rota API pública de resposta

Handler server-only em `src/app/api/waitlist/respond/route.ts` (ou equivalente):

- Recebe token, ação (aceitar/recusar), consentimento.
- Calcula hash do IP com segredo server-side (`WAITLIST_IP_HASH_SECRET` ou reutilizar padrão do projeto).
- Usa credencial **service_role** apenas no servidor.
- Rate limit básico por IP hash / token (ex.: 10 tentativas / 15 min) para mitigar brute force.
- Resposta JSON genérica em erro.

### 6.8 Job de expiração

- Rota `src/app/api/cron/expire-slot-offers/route.ts` protegida por segredo (`CRON_SECRET` header, padrão Vercel Cron).
- Invoca função de domínio + update em lote: ofertas pendentes com `expires_at < now()` → expiradas; entradas afetadas → aguardando.
- Documentar variáveis em `.env.example`.
- Em desenvolvimento: script ou comando manual documentado no manual-dev para simular expiração.

### 6.9 Persistência · reforços incrementais

Nova migration incremental (não reescrever `005_waitlist.sql`):

- Coluna **fim do horário oferecido** em ofertas (`ends_at` ou equivalente).
- Coluna **consulta vinculada** em ofertas aceitas (FK opcional para appointments).
- Restrição parcial ou índice: **uma oferta pendente por entrada**.
- Restrição: **uma entrada ativa por paciente** (aguardando ou oferta enviada).
- Função SQL `expire_pending_slot_offers()` chamada pelo cron (opcional, recomendado).
- Política de INSERT em respostas do paciente ajustada para uso via service role (sem expor INSERT a authenticated genérico).

Regenerar tipos TypeScript após aplicar migration.

### 6.10 Integração com a agenda

Alteração mínima na Fase 2:

- No detalhe ou fluxo de **cancelamento** de consulta: botão opcional **Oferecer vaga na fila** que abre modal de oferta pré-preenchido com dentista, data e horário da consulta cancelada (recepção escolhe entrada da fila).
- Consulta criada pelo aceite aparece na agenda e em **Hoje** sem ação extra.
- Situação da nova consulta: **`confirmed`** (decisão fechada §12).

### 6.11 Tela Hoje (`/hoje`)

Substituir seção estática "Fila · prioridades" por **resumo operacional real**:

- Contagem de entradas **aguardando** por prioridade (ex.: "2 vermelho · 1 amarelo").
- Link **Abrir fila**.
- Ofertas pendentes próximas do vencimento (&lt; 10 min) com destaque opcional.

Escopo mínimo no DoD: contagem aguardando + link; destaque de vencimento é desejável, não bloqueante se prazo apertar.

### 6.12 Seed de desenvolvimento

Estender seed idempotente:

- Pelo menos **3 entradas na fila** (uma por prioridade) em situação aguardando.
- Uma oferta pendente de exemplo (token de dev documentado no manual-dev para testar página pública localmente).

### 6.13 Componentes de UI

Reutilizar shadcn existente; adicionar somente se necessário (dropdown-menu para ações do card, toast para copiar link).

Dependência prevista: **`@dnd-kit/core`** + **`@dnd-kit/sortable`** (ou pacote equivalente leve) para arraste com suporte a toque.

Copy em pt-BR; sem travessão "—" em textos novos; inputs 16px; safe-area na página pública.

---

## 7. Fora de escopo

- Envio automático de SMS/WhatsApp (canal manual na v1; integração DeskcommCRM é repo separado).
- WhatsApp Business API, Resend para paciente, push notifications.
- Múltiplas ofertas simultâneas para o mesmo paciente ou fila por dentista separada.
- Fila com mais de três prioridades ou colunas customizáveis.
- Reoferta automática em cascata para próximo da fila ao expirar (recepção reoferece manualmente).
- Painel admin de respostas com IP desanonimizado.
- Audit log em cada leitura da fila (opcional; não bloqueia DoD).
- Estoque, scan QR, lembrete pós-consulta (Fases 5 e 6).
- Alteração da matriz de papéis ou novas migrations de domínios alheios à fila.
- Testes E2E / Playwright; homologação formal `manual-report` (Fase 6).
- PWA / manifest (Fase 5).
- Edição de consulta criada pelo aceite além do fluxo normal da agenda.

---

## 8. Fluxos

### 8.1 Caminho feliz · Recepção inclui paciente na fila

1. Recepção autentica e abre **Fila Kanban**.
2. Aciona **Nova entrada**, busca paciente "João Pereira" (já com LGPD).
3. Define prioridade **vermelho**, motivo "dor intensa", dentista preferido Dr. Felipe.
4. Sistema valida ausência de outra entrada ativa para o paciente.
5. Card aparece na coluna **Aguardando**, no topo (prioridade vermelha).
6. Resumo em **Hoje** atualiza contagem.

### 8.2 Caminho feliz · Cancelamento libera vaga e gera oferta

1. Recepção cancela consulta das 15:00–15:30 da Dra. Ana na agenda.
2. No diálogo pós-cancelamento (ou na fila), aciona **Oferecer vaga na fila**.
3. Seleciona entrada de João Pereira; horário 15:00–15:30 e dentista pré-preenchidos.
4. Sistema valida slot livre, cria oferta pendente, gera link.
5. Card de João move para coluna **Oferta enviada**; recepção **copia link** e envia por WhatsApp manualmente.
6. Timer exibe "39 min restantes".

### 8.3 Caminho feliz · Paciente aceita pelo celular (critério principal do plano)

1. João abre o link no iPhone (sem login, fora do app interno).
2. Vê "Olá, João P.", horário "Hoje, 15:00–15:30", dentista "Ana".
3. Marca checkbox de consentimento LGPD.
4. Toque em **Aceitar horário**.
5. Sistema valida token, oferta pendente, slot livre; cria consulta confirmada; atualiza oferta e entrada.
6. Página exibe confirmação: "Horário confirmado. Aguardamos você na clínica."
7. Recepção vê card em **Agendado**; agenda e **Hoje** listam a consulta **sem recarregar manualmente** (revalidação de cache).
8. Repetir fluxo de **recusa** em cenário separado: card volta a **Aguardando**.

### 8.4 Caminho feliz · Dentista consulta fila (somente leitura)

1. Dentista autentica e abre **Fila**.
2. Visualiza colunas e cards; **não** vê botões de incluir, ofertar ou arrastar.
3. Tentativa de escrita via action server-side é recusada.

### 8.5 Caminho feliz · Expiração automática

1. Oferta criada às 10:00 com validade até 10:40.
2. Paciente não responde.
3. Job de expiração roda às 10:41 (ou próxima execução).
4. Oferta passa a **expirada**; entrada de João volta a **aguardando** na coluna correta.
5. Link aberto após expiração mostra mensagem de expirado (botões desabilitados).

### 8.6 Caminho feliz · Mobile recepção sem arrastar

1. Recepção abre **Fila** no celular (viewport &lt; `md`).
2. Aba **Oferta enviada** mostra card de João.
3. Abre menu ⋯ → **Cancelar oferta**.
4. Confirma; card retorna à aba **Aguardando**.

### 8.7 Caminho feliz · Alterar prioridade

1. Entrada de Maria (amarelo) aguarda há 2 dias.
2. Recepção abre menu → **Alterar prioridade** → **vermelho**.
3. Card sobe na ordenação dentro de **Aguardando**.
4. Arrastar entre colunas de prioridade **não existe** (prioridade é atributo do card, não coluna).

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Paciente sem consentimento LGPD | Inclusão na fila bloqueada | Validar na action; mensagem clara |
| Paciente já na fila (entrada ativa) | Inclusão bloqueada; link para entrada existente | Unicidade parcial no banco + Zod |
| Slot ocupado ao criar oferta | Oferta não criada | Reutilizar regra de conflito da agenda |
| Slot ocupado no aceite (race) | Aceite falha; mensagem ao paciente; entrada aguardando | Transação + constraint de conflito |
| Token inválido ou hash desconhecido | Página genérica "Link inválido ou expirado" | Sem distinguir motivo (SECURITY) |
| Token expirado | Página estado expirado; POST recusado | Validar `expires_at` server-side |
| Oferta já aceita/recusada | POST idempotente retorna estado atual; UI "já respondido" | Checar situação antes de gravar |
| Aceitar sem checkbox LGPD | Botões desabilitados; POST rejeita | UI + Zod |
| Recusar sem checkbox LGPD | Idem aceitar | UI + Zod |
| Recepção arrasta para coluna proibida | Card reverte; toast explicativo | Guarda no client + validação server |
| Dentista tenta ofertar horário | UI sem ação; action recusa | Matriz §5 |
| Visualizador acessa `/fila` | 403 acesso negado | Guarda layout Fase 1 |
| Brute force no token | Rate limit na rota pública | Middleware/throttle por IP hash |
| Token armazenado em claro no banco | Proibido | Só hash; teste unitário |
| IP em texto claro em resposta | Proibido | Hash com segredo server-side |
| PHI na página pública | Só nome parcial + horário | Revisão copy + SECURITY checklist |
| Exibir token na UI pública | Remover debug | Spec §6.6 |
| Sessão expirada na recepção | Redirect login | Middleware |
| Job cron sem segredo | 401 | Header `CRON_SECRET` |
| Duas ofertas pendentes mesma entrada | Segunda criação bloqueada | Constraint parcial |
| Entrada agendada na fila + consulta cancelada depois | Entrada permanece agendado; consulta cancelada na agenda | Fora do escopo: recepção remove manualmente ou nova spec |
| Fuso horário | Exibição America/Sao_Paulo | Alinhar com agenda Fase 2 |
| Link compartilhado com terceiros | Terceiro pode aceitar se tiver link | Risco aceito v1; token longo + expiração 40 min |
| Copiar link expirado | Recepção deve gerar nova oferta | UI indica expirado |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Feature `src/features/waitlist/` conforme §6.
- [ ] Migration incremental aplicada via `npm run db:push`; tipos regenerados.
- [ ] `/fila` substitui demo por Kanban real (3 colunas operacionais + prioridade visual).
- [ ] Desktop: arrastar entre colunas permitidas com confirmação quando necessário.
- [ ] Mobile: abas + menu de ação para mover situação e prioridade (sem depender só de arrastar).
- [ ] CRUD de entrada na fila com validação de LGPD e unicidade de entrada ativa.
- [ ] Oferta de horário com token opaco, hash no banco, validade 40 min, link copiável.
- [ ] `/fila/resposta/[token]` funcional, mobile-first, checkbox LGPD, aceitar e recusar operacionais.
- [ ] Aceite cria consulta **`confirmed`** em transação atômica com validação de conflito.
- [ ] Recusa e expiração retornam entrada a **aguardando**.
- [ ] Job de expiração automática configurado (cron route + segredo documentado).
- [ ] Rota API pública server-only; **sem** `service_role` no client.
- [ ] Testes unitários Vitest: expiração 40 min, hash/token, nome parcial, transições permitidas (meta ~80% no domínio tocado).
- [ ] Autorização revalidada em toda action; RLS da Fase 1 intacta.
- [ ] Zod na borda de todas as actions da fila e payload público.
- [ ] `CRON_SECRET` e `WAITLIST_IP_HASH_SECRET` (ou equivalente) em `.env.example`.
- [ ] Seed: entradas demo + oferta testável documentada no manual-dev.
- [ ] **Hoje:** contagem real de fila aguardando + link para fila (§6.11 mínimo).
- [ ] Integração opcional pós-cancelamento na agenda (§6.10) — **desejável**; se omitida, fluxo só pela tela fila ainda cumpre DoD.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: token só hash, IP só hash, rota pública sem enumeração, LGPD, fail secure.
- [ ] Validação manual: fluxo §8.3 completo (recepção oferece → paciente aceita → consulta na agenda).
- [ ] `docs/implementation/F4-fila-kanban.md` criado; índice `docs/implementation/README.md` atualizado.
- [ ] `docs/manual-dev/06-fase-4-fila-kanban.md` criado; índice `docs/manual-dev/README.md` atualizado.
- [ ] `docs/state/PENDENCIAS.md` atualizado (implementação vs homologação manual).

### Qualidade

- [ ] Copy em pt-BR; sem travessão "—" em textos novos.
- [ ] Nenhum arquivo alterado fora do escopo permitido (§11).
- [ ] Arquivos novos respeitam limite de ~300 linhas; dividir por domínio se necessário.
- [ ] Página pública: alvos ≥ 44×44 px; checkbox e botões acessíveis no mobile.
- [ ] Validação manual desktop: recepção inclui, oferta, cancela oferta, vê agendado.
- [ ] Validação manual mobile paciente: aceitar e recusar em viewport estreita.

### Explicitamente **não** exigido nesta fase

- Homologação `manual-report` completa (Fase 6).
- Envio automático WhatsApp/SMS.
- Teste obrigatório em iPhone/Android real (exigido nas Fases 3 e 5; fila pública recomendada em mobile real, não bloqueante no DoD).
- Reoferta automática em cascata.
- Cobertura 80% global do repositório (apenas domínio tocado).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo / pasta | Motivo |
| --------------- | ------ |
| `specs/2026-08-18-fase-4-fila-kanban.md` | Esta spec |
| `supabase/migrations/014_waitlist_f4.sql` | ends_at, FK consulta, unicidades, expire function |
| `src/features/waitlist/queries.ts` | Leitura entradas, ofertas, contagens |
| `src/features/waitlist/actions.ts` | CRUD fila, criar/cancelar oferta |
| `src/features/waitlist/schemas.ts` | Zod entradas, ofertas, resposta pública |
| `src/features/waitlist/domain/slot-offer-expiry.ts` | Regra 40 min |
| `src/features/waitlist/domain/slot-offer-expiry.test.ts` | Testes expiração |
| `src/features/waitlist/domain/token-hash.ts` | Gerar token + hash |
| `src/features/waitlist/domain/token-hash.test.ts` | Testes token |
| `src/features/waitlist/domain/partial-patient-name.ts` | Nome parcial LGPD |
| `src/features/waitlist/domain/partial-patient-name.test.ts` | Testes mascaramento |
| `src/features/waitlist/domain/waitlist-transitions.ts` | Transições permitidas |
| `src/features/waitlist/domain/waitlist-transitions.test.ts` | Testes transições |
| `src/features/waitlist/domain/waitlist-priority.ts` | Labels e ordenação |
| `src/features/waitlist/components/waitlist-board.tsx` | Orquestra desktop/mobile |
| `src/features/waitlist/components/waitlist-column.tsx` | Coluna Kanban |
| `src/features/waitlist/components/waitlist-card.tsx` | Card de entrada |
| `src/features/waitlist/components/waitlist-tabs-mobile.tsx` | Abas mobile |
| `src/features/waitlist/components/waitlist-entry-form.tsx` | Nova/editar entrada |
| `src/features/waitlist/components/slot-offer-form.tsx` | Oferecer horário |
| `src/features/waitlist/components/slot-offer-link.tsx` | Copiar link + countdown |
| `src/features/waitlist/components/waitlist-card-actions.tsx` | Menu mobile/desktop |
| `src/features/waitlist/lib/accept-slot-offer.ts` | Transação aceite (server) |
| `src/features/waitlist/lib/expire-slot-offers.ts` | Lógica expiração em lote |
| `src/features/waitlist/lib/hash-ip.ts` | Hash IP com segredo |
| `src/app/fila/resposta/[token]/slot-response-client.tsx` | Form aceitar/recusar (client mínimo) |
| `src/app/api/waitlist/respond/route.ts` | POST público aceitar/recusar |
| `src/app/api/cron/expire-slot-offers/route.ts` | Job expiração |
| `supabase/migrations/015_seed_waitlist_dev.sql` | Entradas e oferta demo |
| `docs/plans/plano-F4.md` | Plano derivado opcional |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/app/(app)/fila/page.tsx` | Integrar Kanban real |
| `src/app/fila/resposta/[token]/page.tsx` | Dados reais da oferta |
| `src/app/(app)/hoje/page.tsx` | Resumo fila real (§6.11) |
| `src/features/agenda/components/appointment-detail.tsx` | Atalho oferecer vaga pós-cancelamento (§6.10) |
| `src/features/agenda/actions.ts` | Retorno/contexto pós-cancelamento (mínimo) |
| `src/lib/supabase/database.types.ts` | Tipos regenerados |
| `.env.example` | `CRON_SECRET`, hash IP, nota token dev |
| `package.json` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `vercel.json` | Cron schedule expire (se deploy Vercel) |
| `README.md` | Fluxo fila, teste link público, cron local |

### Pode incluir no commit (não bloqueia DoD)

| Path | Nota |
| ---- | ---- |
| `src/components/ui/dropdown-menu.tsx`, `sonner.tsx` | shadcn se necessário |
| `docs/plans/plano-F4.md` | Espelho do plano de fase |

### Proibido alterar nesta feature

- `src/features/stock/**`, `reminders/**`, `records/**` (salvo tipos compartilhados indiretos).
- `src/features/patients/**` exceto reutilização de combobox via import (sem refactor amplo).
- `src/features/agenda/**` exceto arquivos listados em Alterar.
- Políticas RLS de prontuário, estoque (salvo migration 014 focada em fila).
- `src/lib/auth/roles.ts` (matriz já correta; mudança exige nova spec).
- `docs/SECURITY.md`.
- `.env.local` ou qualquer arquivo com segredos reais.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Kanban: **3 colunas operacionais** (Aguardando · Oferta enviada · Agendado); **prioridade** é atributo visual/ordenação do card, não coluna |
| 2 | Prioridades: **vermelho, amarelo, verde**; ordenação dentro de Aguardando por `WAITLIST_COLORS.order` |
| 3 | Arrastar: muda **situação** apenas onde permitido (§4.4); **Agendado** só via aceite do paciente |
| 4 | Mobile: **abas** das 3 colunas + **menu de ação** obrigatório para mover situação/prioridade |
| 5 | Oferta: token aleatório na URL; **somente hash** persistido |
| 6 | Validade da oferta: **40 minutos** a partir da criação |
| 7 | Aceite: consulta criada com situação **`confirmed`** em **transação atômica** |
| 8 | Conflito de horário na aceite: mesma regra da agenda (Fase 2) |
| 9 | Página pública: **nome parcial** + horário; **sem** token visível na UI |
| 10 | Consentimento LGPD: **obrigatório** para aceitar **e** recusar |
| 11 | IP do paciente: **somente hash** com segredo server-side |
| 12 | Envio do link: **manual** pela recepção (SMS/WhatsApp); sem API WhatsApp neste repo |
| 13 | **Uma entrada ativa por paciente**; **uma oferta pendente por entrada** |
| 14 | Expiração: **job cron** server-side, não lazy-only na abertura do link |
| 15 | Resposta pública via **route handler + service_role**; nunca no browser |
| 16 | Migration incremental **014**; não editar retroativamente `005` |
| 17 | Erro de token: mensagem **genérica** (anti-enumeração) |
| 18 | DnD: **@dnd-kit** com sensores de toque |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Token enumerável | Criptograficamente aleatório, longo, só hash no banco, rate limit |
| PHI na página pública | Nome parcial + horário apenas §4.6 |
| Race no aceite (dois pacientes, um slot) | Transação + constraint conflito agenda |
| `service_role` no client | Apenas route handlers server-side |
| Oferta expira sem job | Cron + função SQL; teste unitário expiração |
| Link reenviado a terceiro | Expiração 40 min; risco aceito v1 |
| Kanban ilegível no mobile | Abas + menu §6.3 |
| Arraste acidental no toque | Confirmação em ações destrutivas; menu alternativo |
| IP em log de aplicação | Hash only; checklist SECURITY |
| Escopo inflar para WhatsApp automático | Fora de escopo §7 |

---

## 14. Referências

- `docs/PLANO.md` · §5 Fila · §6 Fase 4 · §7 Qualidade (teste expiração token)
- `docs/SECURITY.md` · LGPD link paciente, token, IP hash
- `specs/2026-08-18-fase-1-dados-auth-papeis.md` · §4.5 Fila
- `specs/2026-08-18-fase-2-agenda.md` · conflito horário, cancelamento
- `specs/2026-08-18-fase-3-pacientes-prontuario.md` · pacientes LGPD
- `docs/manual-dev/03-fase-1-dados-auth-papeis.md` · migration 005
- `.cursor/rules/architecture.mdc` · token fila, IP hash
- `src/types/clinroma.ts` · `WAITLIST_COLORS`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch dedicada (sugestão: `feature/fase-4-fila-kanban`), sem expandir escopo.
