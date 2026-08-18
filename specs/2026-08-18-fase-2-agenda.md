# Spec · Fase 2 · Agenda

| Campo            | Valor              |
| ---------------- | ------------------ |
| **Status**       | draft              |
| **Data**         | 2026-08-18         |
| **Slug**         | fase-2-agenda      |
| **Plano origem** | `docs/PLANO.md` §6 |
| **Fase**         | 2 de `docs/PLANO.md` |

---

## 1. Contexto

A Fase 1 entregou modelo de dados completo, autenticação, guarda por papel, políticas de acesso no banco, seed com cinco dentistas e contas de teste por papel. As telas de **Agenda** e **Hoje** continuam placeholders estáticos; não há consultas reais, calendário operacional nem regra de conflito de horário aplicada.

Esta feature coloca a **agenda clínica em produção interna**: a recepção deixa de usar planilha para marcar, remarcar e cancelar consultas; o dentista passa a enxergar o próprio dia pelo celular. É o primeiro módulo de negócio visível após login e prepara a Fase 3 (prontuário aberto a partir da consulta) e a Fase 4 (aceite de vaga cria consulta na agenda).

**Pré-requisito:** Fase 1 concluída e aprovada (migrations aplicadas, login funcional, matriz de papéis ativa).

---

## 2. Objetivo

Permitir que a **recepção** gerencie consultas dos cinco dentistas em visão de calendário (desktop) e que o **dentista** consulte a agenda do próprio dia no celular, com **bloqueio confiável de conflito de horário** por profissional.

**Valor entregue:** operação diária da clínica piloto sem planilha externa; base para vincular prontuário e fila à consulta agendada.

---

## 3. Atores

| Ator              | Interesse                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| Recepção          | Criar, editar, remarcar e cancelar consultas; ver todos os dentistas      |
| Administrador     | Mesmas capacidades da recepção na agenda                                  |
| Dentista          | Ver consultas do dia (preferencialmente as suas); sem alterar horários    |
| Visualizador      | Consultar agenda sem alterar                                              |
| Auxiliar de sala  | Sem acesso ao módulo Agenda (mantido da Fase 1)                           |
| Desenvolvedor     | Regras de conflito testadas; calendário isolado atrás de componente único |

---

## 4. Modelo de domínio

### 4.1 Consulta agendada

Entidade já persistida na Fase 1. Campos relevantes nesta fase:

- **Paciente** vinculado (obrigatório).
- **Dentista** vinculado (obrigatório).
- **Início** e **fim** (fim sempre posterior ao início).
- **Situação:** `scheduled`, `confirmed`, `in_progress`, `completed`, `no_show`, `cancelled`, `rescheduled` (alinhado a `AppointmentStatus` em `src/types/clinroma.ts`).
- **Procedimento** e **observação** (opcionais).
- **Responsável pela criação** (colaborador autenticado).

### 4.2 Dentista clínico

Registro com nome, cor na agenda e situação ativa/inativa. Cinco dentistas no seed do piloto. Apenas dentistas **ativos** aparecem no calendário e nos filtros.

### 4.3 Paciente (uso mínimo nesta fase)

Consultas exigem paciente existente. **Cadastro completo de pacientes permanece na Fase 3.** Nesta fase:

- Seed de desenvolvimento inclui **pacientes fictícios** suficientes para homologar fluxos.
- Formulário de consulta permite **buscar e selecionar** paciente já cadastrado (por nome; CPF opcional na busca se disponível).
- **Não** inclui ficha clínica, anamnese, odontograma nem tela dedicada de pacientes.

### 4.4 Regra de conflito de horário

Dois intervalos de consulta do **mesmo dentista** não podem se sobrepor enquanto ambas estiverem em situação **ativa** (todas exceto `cancelled` e `rescheduled`).

A regra deve valer:

1. Na **persistência** (última linha de defesa; impossível contornar só pela interface).
2. Na **camada de aplicação** (mensagem amigável antes ou ao tentar salvar).

---

## 5. Matriz de acesso (agenda)

Coerente com a Fase 1; refinamentos apenas onde a UI expõe ações.

| Ação                              | admin | reception | dentist | viewer |
| --------------------------------- | :---: | :-------: | :-----: | :----: |
| Ver agenda (todos os dentistas)   |  Sim  |    Sim    |   Sim*  |  Sim   |
| Ver agenda filtrada ao próprio    |  —    |     —     |   Sim   |   —    |
| Criar consulta                    |  Sim  |    Sim    |   Não   |  Não   |
| Editar consulta (dados/procedimento) | Sim |    Sim    |   Não   |  Não   |
| Remarcar (horário/dentista)       |  Sim  |    Sim    |   Não   |  Não   |
| Cancelar consulta                 |  Sim  |    Sim    |   Não   |  Não   |
| Arrastar para remarcar (desktop)  |  Sim  |    Sim    |   Não   |  Não   |

**\*** Dentista enxerga todos os dentistas na visão desktop se a política de leitura global permanecer; no **mobile**, default é filtro no **próprio dentista** vinculado ao perfil (quando existir vínculo). Sem vínculo, mostra todos (somente leitura).

Escrita continua restrita a `admin` e `reception` via políticas já definidas na Fase 1.

---

## 6. Escopo funcional

### 6.1 Feature `agenda`

Estrutura em `src/features/agenda/`:

- **Consultas de leitura** para intervalo de datas, dentista(s) e dia corrente.
- **Ações de escrita** com validação na borda (Zod): criar, atualizar dados, remarcar, cancelar.
- **Esquemas** compartilhados entre formulário e actions.
- **Regra pura de conflito** testável (função de domínio, sem dependência de UI).

### 6.2 Calendário desktop (a partir de `md`)

- Biblioteca **react-big-calendar** isolada em `agenda-calendar.tsx`, recebendo eventos no **tipo de domínio** (não o tipo da biblioteca vazando para o resto da feature).
- **Coluna por dentista** (visão de recursos).
- Visões **dia** e **semana** alternáveis.
- Cores dos eventos alinhadas à cor do dentista no seed.
- **Arrastar** evento para novo horário e/ou coluna (outro dentista): abre **confirmação** antes de persistir; se conflito, bloqueia com mensagem clara.
- Clique em slot vazio: abre formulário de **nova consulta** com dentista e horário pré-preenchidos.
- Clique em consulta existente: abre painel ou modal de **detalhe/edição** (somente leitura para dentista/viewer).

Carregamento via **import dinâmico** somente em viewport desktop (`md+`), para não penalizar mobile.

### 6.3 Agenda mobile (abaixo de `md`)

Cinco colunas de dentista **não cabem** em tela pequena. Comportamento:

- **Lista do dia** agrupada por dentista (nome do profissional como cabeçalho de grupo).
- **Filtro de dentista** (todos ou um específico); dentista logado inicia filtrado no próprio quando houver vínculo perfil ↔ dentista.
- Navegação de **data** (dia anterior / hoje / próximo).
- Toque na consulta: detalhe somente leitura.
- **Sem** arrastar no mobile nesta fase; remarcação permanece fluxo da recepção no desktop (ou formulário explícito se couber no escopo mobile da recepção — ver §6.4).

A biblioteca de calendário **não** é carregada no mobile.

### 6.4 Formulário de consulta

Campos mínimos:

- Paciente (busca/seleção entre existentes).
- Dentista (seleção entre ativos).
- Data, hora início, hora fim (ou duração padrão sugerida, ex.: 30 ou 60 min, editável).
- Situação (default `scheduled`; recepção pode marcar `confirmed`).
- Procedimento e observação (opcionais).

Validações:

- Fim após início.
- Dentista e paciente obrigatórios.
- Conflito rejeitado com mensagem em pt-BR indicando dentista e sobreposição.

**Cancelar:** altera situação para `cancelled`; consulta some das visões operacionais (ainda consultável em histórico se implementado no detalhe; mínimo: não ocupa slot ativo).

**Remarcar:** atualiza início/fim (e dentista se aplicável); situação anterior pode permanecer ou registrar `rescheduled` conforme decisão fechada §12.

### 6.5 Tela Hoje (`/hoje`)

Substituir cards estáticos de módulos por **visão operacional do dia**:

- Lista (ou resumo) das **consultas de hoje**, agrupadas por dentista ou em ordem cronológica.
- Indicador de situação visível (cor ou rótulo).
- Atalho para abrir a agenda completa.
- Manter seção leve de **prioridades da fila** (pode permanecer estática ou placeholder até Fase 4; **não** bloqueia DoD).
- Remover bloco "Próximo passo técnico" da Fase 0.

Escopo de **alertas de estoque** na Hoje: placeholder ou contagem mínima **fora** do DoD (Fase 5).

### 6.6 Seed de desenvolvimento

Estender seed idempotente com:

- **Pacientes fictícios** (mínimo 5) para marcar consultas.
- **Consultas de exemplo** em dias adjacentes (hoje, amanhã, semana corrente) cobrindo mais de um dentista e mais de uma situação — facilita demo e testes manuais.

### 6.7 Persistência · reforço de conflito

Nova migration incremental (não reescrever `003_appointments.sql`):

- Restrição ou gatilho no banco que **impede sobreposição** de consultas ativas do mesmo dentista.
- Consultas `cancelled` e `rescheduled` **não** participam do bloqueio.

Regenerar tipos TypeScript após aplicar migration.

### 6.8 Componentes de UI

Reutilizar shadcn existente; adicionar componentes shadcn **somente se necessário** (ex.: dialog, select, label, badge, sheet, calendar popover para data).

Copy em pt-BR; alvos de toque ≥ 44×44 px; inputs 16 px nos formulários mobile.

---

## 7. Fora de escopo

- Cadastro completo, ficha e prontuário de pacientes (Fase 3).
- Anamnese, odontograma, áudio, foto, Whisper.
- Fila Kanban operacional, oferta de horário, link público funcional (Fase 4).
- Estoque, scan QR, alertas reais de insumo (Fase 5).
- Lembretes por e-mail (Fase 6).
- Audit log em cada leitura/escrita de consulta (opcional nesta fase; obrigatório no prontuário Fase 3).
- Redimensionar duração arrastando borda do evento (resize) — apenas mover evento.
- Sincronização com Google Calendar ou sistemas externos.
- Recorrência de consultas.
- Bloqueio de agenda (férias, almoço) como entidade separada.
- Notificações push ou WhatsApp ao paciente.
- Testes E2E / Playwright; homologação formal `manual-report` (Fase 6).
- Alteração da matriz de papéis ou novas migrations de domínios alheios à agenda.

---

## 8. Fluxos

### 8.1 Caminho feliz · Recepção marca consulta no desktop

1. Recepção autentica e abre **Agenda** em viewport desktop.
2. Calendário exibe colunas dos cinco dentistas ativos na visão **semana** ou **dia**.
3. Clica em um horário livre na coluna da Dra. Ana.
4. Formulário abre com dentista e horário pré-preenchidos.
5. Busca paciente "Maria Silva", seleciona, define procedimento "Limpeza", confirma.
6. Sistema valida ausência de conflito e persiste consulta em situação `scheduled`.
7. Evento aparece na coluna correta com cor da dentista.
8. Tela **Hoje** passa a listar a consulta se a data for hoje.

### 8.2 Caminho feliz · Recepção remarca arrastando

1. Recepção arrasta consulta existente para outro horário na mesma coluna.
2. Diálogo pede confirmação: "Remarcar consulta de Maria Silva para 14:30?"
3. Recepção confirma.
4. Sistema valida conflito, persiste novo horário, revalida cache da página.
5. Calendário reflete a nova posição.

### 8.3 Caminho feliz · Recepção cancela consulta

1. Recepção abre detalhe da consulta e aciona **Cancelar**.
2. Confirmação secundária ("Cancelar consulta de Maria Silva?").
3. Situação passa a `cancelled`.
4. Slot fica livre; consulta não aparece na lista operacional do dia.

### 8.4 Caminho feliz · Dentista vê o dia no celular

1. Dentista autentica (`dentist@clinroma.dev`, vinculado ao Dr. Felipe Roma no seed).
2. Abre **Agenda** ou **Hoje** no iPhone (viewport &lt; `md`).
3. Vê **lista do dia** agrupada; filtro inicia no **próprio dentista**.
4. Consultas do dia aparecem com horário, paciente e situação.
5. Toque abre detalhe somente leitura; **não** há botões de editar/cancelar.
6. Bundle mobile **não** inclui a biblioteca de calendário (verificar no build/analyzer ou ausência de import estático).

### 8.5 Caminho feliz · Visualizador consulta sem alterar

1. Visualizador abre Agenda desktop.
2. Navega entre dias e dentistas.
3. Não vê ações de criar, editar, cancelar ou arrastar (ou estão desabilitadas).
4. Tentativa de escrita via action server-side é recusada (papel + política no banco).

### 8.6 Caminho feliz · Desenvolvedor valida conflito

1. Seed ou teste cria consulta das 10:00 às 11:00 para dentista A.
2. Tentativa de criar outra das 10:30 às 11:30 para o mesmo dentista falha.
3. Teste unitário da função de conflito passa.
4. Migration de exclusão/gatilho impede insert direto concorrente.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Sobreposição de horário (mesmo dentista) | Operação recusada; mensagem "Horário indisponível para este dentista" | Regra no banco + validação na action + teste unitário |
| Fim antes ou igual ao início | Formulário não envia; mensagem de validação | Zod + check no banco |
| Paciente não selecionado | Formulário bloqueado | Campo obrigatório |
| Dentista inativo selecionado | Não listado no formulário; rejeitar se forçado | Filtrar ativos na query |
| Arrastar para slot ocupado | Confirmação não salva; revert visual do evento | Rollback otimista no client |
| Usuário cancela diálogo de remarcação | Evento volta à posição original | Estado local revertido |
| Dentista tenta criar/editar consulta | UI sem ação; action retorna erro de autorização | Guarda server-side + RLS |
| Auxiliar tenta acessar `/agenda` | Página de acesso negado (403) | Matriz Fase 1 |
| Sessão expirada durante edição | Redirecionamento ao login; perda não salva | Middleware + mensagem ao retornar |
| Busca de paciente sem resultados | Estado vazio "Nenhum paciente encontrado" | Seed de dev; texto claro |
| Consulta cancelada ainda visível | Não ocupa coluna ativa; pode aparecer riscada ou oculta conforme UX | Filtrar `cancelled`/`rescheduled` na grade |
| Mudança de dentista no arrastar | Tratar como remarcar com validação de conflito no destino | Mesma regra de sobreposição |
| Fuso horário / meia-noite | Horários exibidos no fuso da clínica (America/Sao_Paulo) | Padronizar em queries e UI |
| Sem pacientes no ambiente | Impossível criar consulta | Seed §6.6; README |
| Perfil dentista sem vínculo clínico | Mobile mostra todos os dentistas (leitura) | Documentar no seed |
| Dois usuários remarcam ao mesmo tempo | Um sucesso, um falha por conflito | Constraint no banco |
| Sem consultas no dia (Hoje) | Estado vazio amigável "Nenhuma consulta hoje" | Empty state |
| Biblioteca de calendário falha ao carregar (desktop) | Fallback com mensagem e link para lista do dia | Error boundary no dynamic import |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Feature `src/features/agenda/` com queries, actions, schemas e componentes conforme §6.
- [ ] Migration de **conflito de horário** aplicada via `npm run db:push`; tipos regenerados.
- [ ] Calendário desktop: colunas por dentista, visões dia/semana, cores por dentista.
- [ ] Criar, editar, remarcar (formulário + arrastar com confirmação) e cancelar consulta funcionando para recepção/admin.
- [ ] Bloqueio de conflito validado no banco **e** na aplicação.
- [ ] Mobile: lista do dia agrupada por dentista + filtro; **sem** carregar biblioteca de calendário.
- [ ] Dentista vê agenda do dia no celular (filtro padrão no próprio quando vinculado).
- [ ] Tela **Hoje** exibe consultas reais do dia (substitui placeholder operacional).
- [ ] Seed estendido: pacientes fictícios + consultas de exemplo idempotentes.
- [ ] Seleção de paciente existente no formulário (busca mínima).
- [ ] Testes unitários Vitest para **regra de conflito de horário** (meta de cobertura da função de domínio).
- [ ] Autorização revalidada em toda action de escrita; RLS da Fase 1 intacta.
- [ ] Zod na borda de todas as actions de agenda.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: RLS, fail secure, sem `service_role` no client.
- [ ] `docs/implementation/F2-agenda.md` criado; índice `docs/implementation/README.md` atualizado.
- [ ] `docs/manual-dev/04-fase-2-agenda.md` criado; índice `docs/manual-dev/README.md` atualizado.
- [ ] `docs/state/PENDENCIAS.md` atualizado (implementação vs homologação manual).

### Qualidade

- [ ] Copy em pt-BR; sem travessão "—" em textos novos.
- [ ] Nenhum arquivo alterado fora do escopo permitido (§11).
- [ ] Arquivos novos respeitam limite de ~300 linhas; dividir se necessário.
- [ ] Validação manual desktop: recepção marca, remarca arrastando, cancela, tenta conflito.
- [ ] Validação manual mobile: dentista vê consultas do dia no iPhone ou emulador estreito.

### Explicitamente **não** exigido nesta fase

- CRUD completo de pacientes.
- Fila operacional, estoque, prontuário, lembretes.
- Cobertura 80% global do repositório (apenas domínio de conflito obrigatório).
- Homologação `manual-report`.
- Resize de evento por arraste de borda.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo / pasta | Motivo |
| --------------- | ------ |
| `specs/2026-08-18-fase-2-agenda.md` | Esta spec |
| `supabase/migrations/010_appointment_conflict.sql` | Restrição/gatilho de sobreposição |
| `src/features/agenda/queries.ts` | Leitura de consultas, dentistas, pacientes (busca mínima) |
| `src/features/agenda/actions.ts` | Server Actions: criar, atualizar, remarcar, cancelar |
| `src/features/agenda/schemas.ts` | Zod dos formulários e payloads |
| `src/features/agenda/domain/appointment-conflict.ts` | Regra pura de sobreposição |
| `src/features/agenda/domain/appointment-conflict.test.ts` | Testes da regra |
| `src/features/agenda/domain/appointment-status.ts` | Mapas de situação (labels pt-BR, ativo/inativo) |
| `src/features/agenda/components/agenda-calendar.tsx` | Wrapper react-big-calendar (client, desktop) |
| `src/features/agenda/components/agenda-day-list.tsx` | Lista mobile agrupada |
| `src/features/agenda/components/agenda-dentist-filter.tsx` | Filtro de dentista (mobile e/ou compartilhado) |
| `src/features/agenda/components/agenda-date-nav.tsx` | Navegação de data |
| `src/features/agenda/components/appointment-form.tsx` | Formulário criar/editar (client) |
| `src/features/agenda/components/appointment-detail.tsx` | Detalhe / ações conforme papel |
| `src/features/agenda/components/reschedule-confirm-dialog.tsx` | Confirmação pós-arrastar |
| `src/features/agenda/components/agenda-view.tsx` | Orquestra desktop vs mobile |
| `src/features/agenda/components/patient-combobox.tsx` | Busca/seleção mínima de paciente |
| `src/features/agenda/types.ts` | Tipos de evento de domínio da agenda |
| `src/features/agenda/actions.test.ts` | Testes de autorização/conflito nas actions (se aplicável) |
| `docs/plans/plano-F2.md` | Plano derivado opcional (status implementação) |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/app/(app)/agenda/page.tsx` | Integrar feature real |
| `src/app/(app)/hoje/page.tsx` | Consultas reais do dia |
| `supabase/migrations/008_seed_dev.sql` (ou nova `011_seed_agenda_dev.sql`) | Pacientes + consultas de exemplo |
| `src/lib/supabase/database.types.ts` | Tipos regenerados pós-migration |
| `package.json` | Deps: `react-big-calendar`, peer de datas (`date-fns` ou equivalente), addon DnD se separado |
| `README.md` | Notas de homologação agenda, seed de consultas |
| `src/app/globals.css` | Estilos mínimos do calendário (se necessário) |

### Pode incluir no commit (não bloqueia DoD)

| Path | Nota |
| ---- | ---- |
| `src/components/ui/dialog.tsx`, `select.tsx`, `label.tsx`, `badge.tsx`, `sheet.tsx`, `popover.tsx`, `command.tsx` | shadcn se necessário |
| `docs/plans/plano-F2.md` | Espelho do plano de fase |

### Proibido alterar nesta feature

- `src/app/fila/**` (exceto link passivo em Hoje se já existir).
- `src/features/patients/**`, `records/**`, `stock/**`, `waitlist/**`, `reminders/**` (ainda inexistentes ou Fase 3+).
- Políticas RLS de prontuário, fila, estoque (salvo migration 010 focada em conflito).
- `src/lib/auth/roles.ts` (matriz já correta; mudança exige nova spec).
- `docs/SECURITY.md`.
- `.env.local`.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Calendário: **react-big-calendar** atrás de `agenda-calendar.tsx` com tipo de domínio |
| 2 | Desktop (`md+`): grade com colunas por dentista; mobile: **lista do dia**, sem biblioteca |
| 3 | Import **dinâmico** do calendário apenas no desktop |
| 4 | Conflito: consultas `cancelled` e `rescheduled` **não** bloqueiam slot |
| 5 | Remarcar por arrastar exige **confirmação** antes de persistir |
| 6 | Cancelar = situação `cancelled`; remarcar por arraste mantém histórico simples (atualiza horário; situação operacional permanece `scheduled`/`confirmed` salvo escolha explícita de `rescheduled` no formulário) |
| 7 | Pacientes: **busca/seleção mínima** + seed; cadastro completo fica na Fase 3 |
| 8 | Escrita de consulta: **admin** e **reception** apenas |
| 9 | Fuso de exibição: **America/Sao_Paulo** |
| 10 | Migration incremental **010** para conflito; não editar retroativamente `003` |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Lock-in da biblioteca de calendário | Componente único `agenda-calendar.tsx`; eventos em tipo de domínio |
| Conflito só na UI | Constraint/gatilho no banco (§6.7) |
| Bundle mobile inflado | Dynamic import + lista nativa abaixo de `md` |
| Sem pacientes para demo | Seed §6.6 |
| Arrastar inconsistente entre biblioteca e estado | Reverter visual se action falhar |
| Dentista vê dados de outros pacientes | Leitura já permitida na Fase 1; escopo mobile filtra **dentista**, não oculta PHI de outros profissionais no desktop |
| Race condition em remarcação simultânea | Exclusion constraint / lock no banco |

---

## 14. Referências

- `docs/PLANO.md` · §1 Biblioteca de calendário · §5 Agenda · §6 Fase 2
- `docs/SECURITY.md`
- `specs/2026-08-18-fase-1-dados-auth-papeis.md`
- `specs/2026-08-17-fase-0-fundacao.md`
- `.cursor/rules/architecture.mdc`
- `src/types/clinroma.ts` · `AppointmentStatus`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch dedicada (sugestão: `feature/fase-2-agenda`), sem expandir escopo.
