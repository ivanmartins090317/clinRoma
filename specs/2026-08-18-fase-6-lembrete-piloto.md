# Spec · Fase 6 · Lembrete e piloto

| Campo            | Valor                          |
| ---------------- | ------------------------------ |
| **Status**       | draft                          |
| **Data**         | 2026-08-18                     |
| **Slug**         | fase-6-lembrete-piloto         |
| **Plano origem** | `docs/PLANO.md` §6             |
| **Fase**         | 6 de `docs/PLANO.md`           |

---

## 1. Contexto

As Fases 0 a 5 entregaram fundação mobile-first, autenticação por papel, agenda, prontuário (áudio, foto, transcrição), fila Kanban com link público LGPD, estoque com scan QR e PWA de atalho. O **registro de lembrete pós-consulta** já existe no banco desde a Fase 1 (consulta, dentista, canal, situação, enviado em, erro), mas **nenhum envio real** foi implementado: não há integração com provedor de e-mail, job de processamento, retentativa nem tela operacional.

Esta fase **fecha o MVP para o piloto Clínica Neo Roma**: dispara lembrete por e-mail ao dentista após consulta concluída, prepara **ambiente de produção** separado do desenvolvimento, executa **revisão de segurança** transversal e conduz **homologação manual completa** (relatório HTML, evidências desktop e mobile, log de bugs) **antes da entrega ao cliente**. Ajustes pós-entrega são acompanhamento operacional contínuo, não bloqueiam o fechamento técnico desta spec.

**Pré-requisito:** Fases 0 a 5 concluídas e aprovadas (incluindo homologação manual obrigatória de prontuário e scan em iPhone e Android conforme `docs/PLANO.md` §7).

---

## 2. Objetivo

1. Enviar **lembrete pós-consulta por e-mail** ao dentista responsável, com **retentativa automática**, **registro de situação** e **visibilidade operacional** para administração.
2. Publicar o sistema na **Vercel** apontando para **projeto Supabase de produção** isolado do ambiente de desenvolvimento.
3. Revisar o **checklist de segurança** de `docs/SECURITY.md` em todas as features entregues.
4. Executar **homologação manual integral** via skill `.cursor/skills/manual-report`, adaptada à marca Neo Roma, cobrindo todos os fluxos do MVP.
5. Estabelecer **ritual de acompanhamento pós-entrega** com a clínica (bugs e melhorias rastreados, sem inflar escopo do MVP).

**Valor entregue:** o dentista recebe no e-mail um resumo operacional e link seguro para revisar o atendimento; a clínica opera em produção com evidências de QA manual; o time sabe o que monitorar nos primeiros dias de uso real.

---

## 3. Atores

| Ator             | Interesse                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| Dentista         | Receber e-mail pós-consulta; abrir prontuário pelo link; não depender de lembrete manual da recepção |
| Recepção         | Marcar consulta como concluída (disparo do lembrete); consultar situação do envio quando aplicável |
| Administrador    | Configurar produção; ver lembretes com falha; reenviar manualmente; conduzir homologação e entrega |
| Paciente         | **Não** recebe lembrete nesta fase (WhatsApp e canal paciente ficam fora do escopo) |
| Mantenedor / dev | Job confiável, retentativa, testes de domínio, relatório manual, deploy documentado |
| Clínica Neo Roma | Validar fluxos reais; reportar bugs pós-go-live via canal acordado com Ivan |

---

## 4. Modelo de domínio

### 4.1 Lembrete pós-consulta

Notificação interna vinculada a uma **consulta concluída** e ao **dentista** que a realizou.

Campos relevantes (já persistidos na Fase 1; campos novos na migration incremental §11):

- **Consulta** vinculada (obrigatório).
- **Dentista** responsável (obrigatório; espelha o dentista da consulta no momento do disparo).
- **Canal:** e-mail nesta fase; enum reserva WhatsApp para fase futura **sem uso**.
- **Situação:** pendente, enviado ou falhou.
- **Enviado em** (preenchido quando situação = enviado).
- **Mensagem de erro** (texto curto, amigável ao admin; sem stack trace nem PHI).
- **Tentativas** e **próxima tentativa** (controle de retentativa; §4.3).
- **Momento** de criação do registro.

Regra de unicidade: **no máximo um lembrete por consulta e canal e-mail**. Nova conclusão da mesma consulta **não** cria duplicata; reenvio manual é ação explícita do admin.

### 4.2 Gatilho de criação

O lembrete é **enfileirado** quando a consulta passa para situação **concluída**, seja:

- pela recepção ou admin na agenda ou detalhe da consulta; ou
- pelo dentista, quando a política de escrita permitir alteração de situação.

Consultas **canceladas**, **faltou**, **remarcadas** ou ainda **agendadas/confirmadas/em atendimento** **não** geram lembrete.

Se a consulta voltar de concluída para outra situação (correção operacional rara): lembrete já enviado **permanece** histórico; pendente ou falhou **não** dispara envio até nova conclusão (decisão §12).

### 4.3 Política de retentativa

| Tentativa | Quando ocorre                          | Após falha                         |
| --------- | -------------------------------------- | ---------------------------------- |
| 1         | Imediatamente após enfileirar          | Agenda próxima em +5 min           |
| 2         | Job periódico quando `próxima tentativa` ≤ agora | Agenda próxima em +15 min |
| 3         | Job periódico                          | Situação **falhou** definitivo     |

Intervalo do job: alinhado ao cron existente de fila (**a cada 5 minutos**), rota protegida por segredo compartilhado (mesmo padrão da expiração de ofertas).

**Reenvio manual** (admin): zera contagem de tentativas, volta situação para pendente e agenda tentativa imediata.

### 4.4 Destinatário do e-mail

Endereço de e-mail da **conta de autenticação** vinculada ao perfil do dentista (`dentists.profile_id` → `profiles` → conta).

Cenários:

- Dentista **com** conta vinculada e e-mail válido → envio normal.
- Dentista **sem** conta vinculada → registro criado em situação **falhou** com erro "Dentista sem e-mail cadastrado"; **sem** chamada ao provedor.
- E-mail inválido ou rejeitado pelo provedor → situação **falhou** após esgotar tentativas; mensagem genérica registrada.

### 4.5 Conteúdo do e-mail (e-mail ao dentista)

Objetivo operacional: lembrar de **revisar documentação** e **orientações pós-consulta**, sem expor PHI desnecessária.

**Assunto (exemplo):** `ClinRoma · Pós-consulta · [Primeiro nome do paciente] · [Data dd/MM]`

**Corpo (HTML + texto simples):**

- Saudação com nome do dentista.
- Paciente: **primeiro nome + inicial do sobrenome** (ex.: "Maria S.").
- Data e horário da consulta (fuso America/Sao_Paulo).
- Procedimento ou observação curta da consulta, se houver (truncar em ~120 caracteres).
- **Botão/link** para abrir a ficha do paciente no app autenticado (`/pacientes/[id]`).
- Rodapé: nome da clínica piloto, aviso de mensagem automática, **sem** CPF, anamnese, áudio ou transcrição no corpo.

Remetente configurável por variável de ambiente (domínio verificado no provedor Resend).

### 4.6 Visibilidade na operação

- **Admin:** lista resumida de lembretes com falha (últimos 7 dias) em seção na **Hoje** ou bloco dedicado; ação **Reenviar**.
- **Recepção e dentista:** podem **consultar** situação do lembrete da consulta no detalhe (badge: Pendente / Enviado / Falhou), sem reenviar.
- **Logs de aplicação e Sentry:** **sem** corpo de e-mail, CPF ou conteúdo clínico (§9 e `docs/SECURITY.md`).

---

## 5. Matriz de acesso (lembretes)

Coerente com políticas da Fase 1; refinamentos de UI.

| Ação                                      | admin | reception | dentist | room_assistant | viewer |
| ----------------------------------------- | :---: | :-------: | :-----: | :------------: | :----: |
| Ver situação do lembrete (consulta)       |  Sim  |    Sim    |   Sim   |      Não       |  Não   |
| Ver lista de falhas recentes              |  Sim  |    Não    |   Não   |      Não       |  Não   |
| Reenviar lembrete manualmente             |  Sim  |    Não    |   Não   |      Não       |  Não   |
| Marcar consulta concluída (disparo)       |  Sim  |    Sim    |  Sim*   |      Não       |  Não   |
| Job/cron processar fila de lembretes      |  —‡   |    —‡     |   —‡    |      —‡        |  —‡    |

**\*** Dentista: conforme matriz da agenda (Fase 2); se somente leitura na agenda, recepção/admin concluem e disparam.

**‡** Rotas de job server-only com segredo; fora do shell autenticado.

Escrita no registro de lembrete pelo job usa cliente administrativo server-side (mesmo padrão expiração de ofertas); políticas RLS permanecem para leitura via sessão.

---

## 6. Escopo funcional

### 6.1 Feature `reminders`

Estrutura em `src/features/reminders/`:

- **Consultas de leitura:** lembrete por consulta, lista de falhas recentes, dados agregados para Hoje.
- **Ações de escrita:** enfileirar ao concluir consulta (invocada pela agenda), reenvio manual (admin).
- **Esquemas** Zod compartilhados.
- **Regras de domínio puras** testáveis: elegibilidade, política de retentativa, formatação de destinatário, sanitização de conteúdo do e-mail.
- **Integração de e-mail:** módulo fino Resend server-only.
- **Processamento em lote:** função invocada pelo job cron.

### 6.2 Integração com agenda

Alteração **mínima** na ação de atualização de situação da consulta:

- Ao persistir situação **concluída**, chamar enfileiramento idempotente (§4.1).
- Falha no enfileiramento **não** reverte a conclusão da consulta; erro logado server-side e admin pode reenviar depois.

### 6.3 Job periódico de lembretes

Nova rota cron protegida (Bearer + `CRON_SECRET`):

1. Seleciona registros **pendentes** ou **falhou** elegíveis para retentativa (`próxima tentativa` ≤ agora, tentativas &lt; máximo).
2. Para cada um: monta e-mail, envia via Resend, atualiza situação/tentativas.
3. Retorna contagem processada (sucesso/falha) em JSON; **sem** detalhes sensíveis na resposta.

Registrar entrada em `vercel.json` crons (schedule `*/5 * * * *`, mesmo intervalo da fila).

### 6.4 UI operacional

**Detalhe da consulta (agenda ou Hoje):**

- Badge de situação do lembrete quando consulta concluída.
- Tooltip ou texto auxiliar em falha ("Fale com a administração").

**Hoje (admin):**

- Seção **Lembretes com falha** (últimos 7 dias): paciente parcial, dentista, horário da consulta, erro resumido, botão **Reenviar**.

Copy em pt-BR; sem travessão "—".

### 6.5 Deploy e ambiente de produção

Documentar e executar (operacional; evidências no manual-dev):

| Item | Desenvolvimento | Produção |
| ---- | --------------- | -------- |
| Supabase | Projeto dev existente | **Projeto novo**, migrations aplicadas do zero |
| Vercel | Preview opcional | Projeto produção, domínio acordado |
| Variáveis | `.env.local` | Painel Vercel (nunca commitar segredos) |
| `NEXT_PUBLIC_APP_URL` | `https://localhost:3000` | URL pública HTTPS |
| Resend | API key sandbox ou dev | Domínio remetente verificado Neo Roma |
| Cron | `CRON_SECRET` local/teste | Segredo forte único em produção |
| OpenAI (Whisper) | Key dev | Key prod ou mesma conforme acordo |

Checklist de go-live:

- [ ] Migrations aplicadas em prod (`db:push` contra projeto prod).
- [ ] Seed **não** roda em prod (somente contas reais convidadas).
- [ ] Buckets Storage privados criados (migration 007).
- [ ] Crons Vercel ativos (ofertas + lembretes).
- [ ] Smoke: login admin, uma consulta concluída, e-mail recebido.

### 6.6 Revisão de segurança transversal

Percorrer **todas** as features (auth, agenda, prontuário, fila, estoque, lembretes) contra `docs/SECURITY.md` § Checklist DoD:

- Políticas de acesso ativas nas entidades tocadas.
- Autorização revalidada server-side em toda escrita.
- Zod na borda.
- Segredo administrativo **somente** server-side.
- Upload: MIME/tamanho; caminho opaco.
- Rotas públicas (link da fila) sem enumeração de identificadores.
- Logs sem PHI.

Resultado registrado em `docs/implementation/F6-lembrete-piloto.md` (tabela feature × item × OK/pendência).

### 6.7 Homologação manual (manual-report)

Executar skill `.cursor/skills/manual-report` **adaptada ao ClinRoma**:

**Entregáveis:**

- `docs/relatorio-testes-manuais.html` (marca Neo Roma: tokens `--primary`, `--secondary`, tipografia do app; **não** usar paleta Zelita).
- `docs/evidencias/` com screenshots nomeados `tcNN-descricao-curta.jpeg`.
- Casos de teste `TC-01`… cobrindo fluxos abaixo.
- Log de bugs `BG-XX` com severidade.
- `docs/state/PENDENCIAS.md` sincronizado após execução.

**Fluxos obrigatórios (códigos sugeridos):**

| Código | Fluxo | Superfície |
| ------ | ----- | ---------- |
| FL-01 | Login, papéis, bloqueio de rota | `/login`, módulos por papel |
| FL-02 | Agenda CRUD, conflito, mobile lista | `/agenda`, `/hoje` |
| FL-03 | Prontuário: anamnese, odontograma, áudio, transcrição | `/pacientes`, celular real |
| FL-04 | Fila Kanban, oferta, link público LGPD | `/fila`, `/fila/resposta/[token]` |
| FL-05 | Estoque, scan contínuo, alerta Hoje | `/estoque`, `/estoque/scan` |
| FL-06 | Lembrete pós-consulta | concluir consulta → e-mail dentista |
| FL-07 | PWA atalho scan (iOS/Android) | instalação tela inicial |
| FL-08 | Segurança smoke | viewer sem prontuário; recepção sem scan |

**Dispositivos:** evidências **desktop** e **mobile** (mínimo um iPhone e um Android nos fluxos FL-03, FL-05, FL-06, FL-07).

**Sem Playwright** no MVP (decisão fechada `docs/PLANO.md` §7).

Homologação manual é **último passo antes da entrega ao cliente**; bugs críticos/altos abertos **bloqueiam** go-live (decisão §12).

### 6.8 Acompanhamento pós-entrega

Processo operacional (não exige feature nova além de rastreio):

1. Primeiros **5 dias úteis** após go-live: canal acordado (WhatsApp/email Ivan ↔ clínica).
2. Bugs novos entram no log `BG-XX` do relatório manual ou lista em `docs/state/PENDENCIAS.md` seção "Pós-piloto".
3. Correções urgentes: hotfix em branch; **não** expandir escopo (WhatsApp paciente, OCR, multi-clínica permanecem fora).
4. Reunião de encerramento piloto: checklist de módulos usados vs. planilha paralela ainda existente.

---

## 7. Fora de escopo

- Lembrete ao **paciente** (WhatsApp, SMS, e-mail paciente).
- Canal WhatsApp no enum (reservado; **não** implementar UI nem envio).
- Playwright ou suite E2E automatizada.
- Painel completo de auditoria (leitura admin de `audit_log` continua fora).
- Export LGPD automatizado.
- Multi-tenant / `clinic_id`.
- Alteração de regras de negócio das Fases 2–5 salvo bug crítico encontrado na homologação.
- Service worker offline além do manifest PWA já entregue na Fase 5.
- Inngest ou fila externa (processamento via cron Vercel é suficiente no MVP).

---

## 8. Caminhos felizes

### 8.1 Caminho feliz · Lembrete após consulta concluída

1. Recepção atende consulta de "Maria Souza" com Dr. Felipe; ao final, marca situação **concluída** na agenda.
2. Sistema enfileira lembrete (situação **pendente**).
3. Job roda em até 5 min (ou imediato na primeira tentativa): e-mail enviado ao endereço da conta do dentista.
4. Registro atualizado: situação **enviado**, **enviado em** preenchido.
5. Dr. Felipe abre e-mail, clica no link, faz login se necessário, cai na ficha de Maria.

### 8.2 Caminho feliz · Badge no detalhe da consulta

1. Admin abre consulta concluída na **Hoje**.
2. Vê badge **Lembrete enviado** com horário do envio.
3. Recepção vê o mesmo badge (somente leitura).

### 8.3 Caminho feliz · Falha transitória e retentativa

1. Provedor de e-mail retorna erro temporário na tentativa 1.
2. Registro permanece pendente; **próxima tentativa** em +5 min.
3. Tentativa 2 bem-sucedida → situação **enviado**.
4. Admin **não** precisa intervir.

### 8.4 Caminho feliz · Reenvio manual

1. Lembrete falhou 3 vezes (dentista sem e-mail corrigido depois).
2. Admin corrige vínculo perfil ↔ dentista.
3. Na **Hoje**, seção falhas → **Reenviar** na linha correspondente.
4. Nova tentativa imediata; e-mail entregue; situação **enviado**.

### 8.5 Caminho feliz · Deploy produção

1. Projeto Supabase prod criado; migrations 001–017+ aplicadas.
2. Vercel configurada; variáveis de produção preenchidas.
3. Domínio Resend verificado; e-mail teste recebido.
4. Crons ativos; smoke FL-06 em produção com conta piloto.

### 8.6 Caminho feliz · Homologação manual

1. Mantenedor gera `docs/relatorio-testes-manuais.html` com TCs FL-01…FL-08.
2. Executa casos em desktop e mobile; anexa evidências.
3. Scoreboard ≥ 100% dos TCs P0 aprovados; bugs médios/baixos documentados.
4. `PENDENCIAS.md` atualizado; cliente recebe link do relatório + acesso produção.

### 8.7 Caminho feliz · Idempotência

1. Recepção salva consulta já concluída novamente (sem mudar situação).
2. **Nenhum** segundo lembrete criado.
3. Histórico único preservado.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Consulta concluída sem dentista com e-mail | Registro **falhou**; mensagem clara para admin | Validar vínculo antes do envio; lista de falhas §6.4 |
| Dentista sem perfil vinculado | Mesmo tratamento | Seed prod documenta necessidade de vínculo |
| Provedor indisponível | Retentativa §4.3; falha definitiva após 3 tentativas | Backoff; reenvio manual |
| `RESEND_API_KEY` ausente | Job falha gracefully; registros permanecem pendentes | Fail secure; alerta em falhas admin |
| E-mail rejeitado (bounce) | Situação **falhou**; erro genérico | Não logar corpo; admin reenvia após corrigir e-mail |
| Consulta concluída duas vezes (toggle) | Uma fila por consulta/canal | Unicidade §4.1 |
| PHI no assunto/corpo por bug | Revisão de template + teste manual FL-06 | Sanitização domínio; checklist segurança |
| Job chamado sem segredo | 401 não autorizado | Mesmo padrão cron fila |
| Recepção tenta reenviar | UI sem botão; action recusada | Matriz §5 |
| Dentista tenta ver lista global de falhas | Seção oculta | Guarda UI + RLS |
| Conclusão OK mas enfileiramento falhou | Consulta permanece concluída | Admin reenvia; log server-side |
| Fuso horário no e-mail | Horário America/Sao_Paulo | `date-fns-tz` já no projeto |
| Link no e-mail aponta dev | `NEXT_PUBLIC_APP_URL` correto em prod | Checklist deploy §6.5 |
| Cron Vercel desativado | Lembretes acumulam pendentes | Monitorar seção falhas; doc manual-dev |
| Homologação incompleta | Go-live **bloqueado** | Decisão §12 |
| Bug crítico pós-go-live | Hotfix rastreado BG-XX | Processo §6.8 |

---

## 10. Critérios de Done

### Obrigatórios (DoD técnico)

- [ ] Feature `src/features/reminders/` conforme §6.1.
- [ ] Migration incremental aplicada; tipos regenerados (campos tentativas/próxima tentativa + unicidade consulta/canal).
- [ ] Enfileiramento ao marcar consulta **concluída** (§6.2).
- [ ] Job cron operacional com autenticação por segredo (§6.3).
- [ ] Integração Resend server-only; variáveis documentadas em `.env.example`.
- [ ] Retentativa automática §4.3; reenvio manual admin §6.4.
- [ ] Badge no detalhe da consulta; seção falhas na **Hoje** (admin).
- [ ] Testes Vitest: elegibilidade, retentativa, idempotência, formatação de conteúdo (meta ~80% no domínio tocado).
- [ ] Autorização revalidada; RLS intacta; Zod nas actions novas.
- [ ] Checklist `docs/SECURITY.md` preenchido por feature (§6.6).
- [ ] Deploy produção documentado e executado (§6.5); smoke FL-06 em prod.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] `docs/implementation/F6-lembrete-piloto.md` criado; índice `docs/implementation/README.md` atualizado.
- [ ] `docs/manual-dev/08-fase-6-lembrete-piloto.md` criado; índice `docs/manual-dev/README.md` atualizado.
- [ ] `docs/state/PENDENCIAS.md` atualizado (Fase 6 implementação vs homologação).

### Obrigatórios (DoD homologação · antes do cliente)

- [ ] `docs/relatorio-testes-manuais.html` gerado (marca Neo Roma).
- [ ] `docs/evidencias/` populada; FL-01…FL-08 executados.
- [ ] Evidências **desktop** e **mobile** nos fluxos P0.
- [ ] iPhone **e** Android nos fluxos áudio, scan e lembrete.
- [ ] Nenhum bug **crítico** ou **alto** aberto nos fluxos P0.
- [ ] Relatório compartilhado com aprovador explícito (Ivan / clínica).

### Qualidade

- [ ] Copy pt-BR; sem travessão "—" em textos novos.
- [ ] Nenhum arquivo alterado fora do escopo permitido (§11).
- [ ] Arquivos novos ≤ ~300 linhas; dividir se necessário.
- [ ] Logs/Sentry sem PHI no envio de lembrete.

### Explicitamente **não** exigido nesta fase

- Playwright.
- WhatsApp lembrete.
- Cobertura 80% global do repositório (apenas domínio lembretes + hooks agenda).
- Painel audit_log.
- SLA formal de uptime (acompanhamento best-effort §6.8).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo / pasta | Motivo |
| --------------- | ------ |
| `specs/2026-08-18-fase-6-lembrete-piloto.md` | Esta spec |
| `supabase/migrations/018_reminders_f6.sql` | Tentativas, próxima tentativa, unicidade consulta+canal |
| `src/features/reminders/queries.ts` | Leitura por consulta, falhas recentes |
| `src/features/reminders/actions.ts` | Reenvio manual admin |
| `src/features/reminders/schemas.ts` | Zod |
| `src/features/reminders/domain/reminder-eligibility.ts` | Quando enfileirar |
| `src/features/reminders/domain/reminder-eligibility.test.ts` | Testes |
| `src/features/reminders/domain/retry-policy.ts` | Cálculo próxima tentativa |
| `src/features/reminders/domain/retry-policy.test.ts` | Testes |
| `src/features/reminders/domain/email-content.ts` | Assunto/corpo sanitizado |
| `src/features/reminders/domain/email-content.test.ts` | Testes |
| `src/features/reminders/lib/enqueue-reminder.ts` | Criação idempotente |
| `src/features/reminders/lib/send-reminder-email.ts` | Resend + atualização situação |
| `src/features/reminders/lib/process-pending-reminders.ts` | Lote do job |
| `src/features/reminders/components/reminder-status-badge.tsx` | Badge consulta |
| `src/features/reminders/components/reminder-failures-panel.tsx` | Seção Hoje admin |
| `src/lib/email/resend-client.ts` | Cliente fino Resend server-only |
| `src/app/api/cron/process-reminders/route.ts` | Job cron |
| `docs/relatorio-testes-manuais.html` | Homologação manual |
| `docs/evidencias/README.md` | Nomenclatura evidências |
| `docs/implementation/F6-lembrete-piloto.md` | Registro entrega |
| `docs/manual-dev/08-fase-6-lembrete-piloto.md` | Manual operação e deploy |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/agenda/actions.ts` | Hook enfileirar ao concluir (mínimo) |
| `src/features/agenda/components/appointment-detail.tsx` | Badge lembrete |
| `src/app/(app)/hoje/page.tsx` | Painel falhas admin |
| `vercel.json` | Cron process-reminders |
| `.env.example` | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| `package.json` | Dependência `resend` (se ausente) |
| `src/lib/supabase/database.types.ts` | Tipos regenerados |
| `README.md` | Deploy prod, Resend, homologação |
| `docs/implementation/README.md` | Índice F6 |
| `docs/manual-dev/README.md` | Índice F6 |
| `docs/state/PENDENCIAS.md` | Estado Fase 6 e pós-piloto |

### Pode incluir no commit (não bloqueia DoD)

| Path | Nota |
| ---- | ---- |
| `docs/evidencias/tc*.jpeg` | Screenshots homologação |
| `src/components/ui/badge.tsx`, `alert.tsx` | shadcn se necessário |
| Ajustes pontuais em specs/docs de fases anteriores | Somente se bug crítico de homologação |

### Proibido alterar nesta feature

- Regras de negócio extensas em `waitlist/**`, `stock/**`, `records/**` (salvo bug crítico homologação com spec amend).
- `src/lib/auth/roles.ts` (matriz já correta).
- `docs/SECURITY.md` (salvo pedido explícito).
- `.env.local` ou segredos reais.
- Introduzir Playwright ou Inngest.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Lembrete v1: **e-mail ao dentista** via Resend; **sem** WhatsApp |
| 2 | Gatilho: consulta **concluída**; idempotente por consulta + canal e-mail |
| 3 | Retentativa: **3 tentativas**, backoff +5 min e +15 min; job **a cada 5 min** |
| 4 | Falha no enfileiramento **não** desfaz conclusão da consulta |
| 5 | Reenvio manual: **somente admin** |
| 6 | Corpo do e-mail: mínimo PHI (nome parcial, sem CPF/anamnese/áudio) |
| 7 | Logs/Sentry: **sem** corpo de e-mail nem PHI |
| 8 | Homologação manual **obrigatória** antes do cliente; **sem Playwright** |
| 9 | Go-live **bloqueado** com bug crítico/alto aberto em fluxo P0 |
| 10 | Produção: Supabase **projeto separado** do dev |
| 11 | Migration incremental **018**; não editar retroativamente `006` |
| 12 | Relatório manual: marca **Neo Roma**, não Zelita |
| 13 | Pós-entrega §6.8 é processo; bugs via BG-XX / PENDENCIAS |
| 14 | Cron compartilha `CRON_SECRET` com job de fila (mesmo header) |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| E-mail cai em spam | Domínio verificado Resend; texto simples alternativo |
| Dentista piloto sem conta | Checklist vínculo perfil antes go-live |
| Cron Vercel falha silenciosamente | Seção falhas Hoje; monitoramento manual primeira semana |
| PHI vazada no e-mail | Template revisado + FL-06 + checklist segurança |
| Homologação atrasar entrega | TCs priorizados P0; bugs médios pós-go-live acordados |
| Confundir lembrete dentista vs paciente | Copy clara; fora de escopo WhatsApp paciente |
| Deploy prod com migration incompleta | Checklist §6.5 + smoke |
| Retentativa duplica e-mail | Idempotência + situação enviado terminal |

---

## 14. Referências

- `docs/PLANO.md` · §6 Fase 6 · §7 Qualidade (manual-report, sem Playwright)
- `docs/SECURITY.md` · checklist DoD, logs sem PHI
- `AGENTS.md` · lembrete dentista, ordem de entrega
- `specs/2026-08-18-fase-1-dados-auth-papeis.md` · §4.6 lembrete transversal
- `specs/2026-08-18-fase-2-agenda.md` · situação concluída
- `.cursor/skills/manual-report/SKILL.md` · fluxo homologação ClinRoma
- `.cursor/skills/close-phase/SKILL.md` · fechamento documentação
- `supabase/migrations/006_reminders_audit.sql` · modelo base
- `src/app/api/cron/expire-slot-offers/route.ts` · padrão job cron

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch dedicada (sugestão: `feature/fase-6-lembrete-piloto`), sem expandir escopo.
