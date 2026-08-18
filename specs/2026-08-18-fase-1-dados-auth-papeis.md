# Spec · Fase 1 · Dados, autenticação e papéis

| Campo            | Valor                    |
| ---------------- | ------------------------ |
| **Status**       | draft                    |
| **Data**         | 2026-08-18               |
| **Slug**         | fase-1-dados-auth-papeis |
| **Plano origem** | `docs/PLANO.md` §6       |
| **Fase**         | 1 de `docs/PLANO.md`     |

---

## 1. Contexto

A Fase 0 entregou repositório clonável, shell mobile-first, shadcn mínimo, Supabase CLI com pasta de migrations vazia, refresh de sessão na borda do app e desenvolvimento local em HTTPS. As telas dos módulos continuam placeholders; não há login, guarda por papel, modelo de dados persistido nem tipos gerados a partir do banco.

Esta feature **destrava todos os módulos seguintes** (agenda, prontuário, fila, estoque, lembretes) ao materializar o modelo de dados completo do MVP, as regras de acesso por papel no banco, a autenticação de colaboradores e a infraestrutura transversal de auditoria. Não entrega fluxos de negócio visíveis além do login.

---

## 2. Objetivo

Permitir que **colaboradores reais** entrem no sistema com identidade verificada, sejam **contidos ao que seu papel permite** tanto na navegação quanto na leitura/escrita de dados sensíveis, e que tentativas de acesso indevido **falhem de forma segura** mesmo quando o token de sessão é válido.

**Valor entregue:** a clínica piloto pode provisionar usuários por papel; desenvolvedores aplicam o schema uma vez e passam a construir features sobre dados reais com defesa em profundidade (guarda na aplicação + políticas no banco).

---

## 3. Atores

| Ator              | Interesse                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| Administrador     | Gerenciar colaboradores, ver tudo, auditar ações sensíveis                |
| Dentista          | Acessar agenda e prontuário dos seus pacientes                            |
| Recepção          | Operar agenda, cadastro de pacientes e fila de espera                     |
| Auxiliar de sala  | Operar estoque e leitura de QR de insumos                                 |
| Visualizador      | Consultar informações operacionais sem alterar dados clínicos             |
| Desenvolvedor     | Seed reproduzível, tipos TypeScript alinhados ao banco, testes de política |
| Paciente (futuro) | Link público da fila permanece **sem** login nesta fase                   |

---

## 4. Modelo de domínio (persistência)

Single-tenant (Clínica Neo Roma). Sem identificador de clínica; isolamento por **sessão autenticada** e **papel**.

### 4.1 Identidade

- **Perfil de colaborador:** vínculo com conta de autenticação, nome exibido, papel (`admin`, `dentist`, `reception`, `room_assistant`, `viewer`), situação ativa/inativa.
- **Dentista:** registro clínico opcionalmente ligado a um perfil (permite agendar para profissional sem login), CRO, cor na agenda, situação ativa/inativa.

### 4.2 Agenda

- **Consulta agendada:** paciente, dentista, início, fim, situação (`scheduled`, `confirmed`, `in_progress`, `completed`, `no_show`, `cancelled`, `rescheduled`), procedimento, observação, responsável pela criação.

### 4.3 Pacientes e prontuário

- **Paciente:** nome, nascimento, CPF, contato, consentimento LGPD.
- **Registro clínico:** paciente, dentista, consulta associada (quando houver), tipo (anamnese ou evolução), conteúdo estruturado.
- **Achado odontológico:** um registro por dente e face, condição, responsável pela última alteração.
- **Anexo do prontuário:** caminho privado no armazenamento, tipo MIME, tamanho, tipo (foto ou áudio), transcrição e situação do processamento de transcrição.

### 4.4 Estoque

- **Insumo:** nome, unidade, quantidade atual, estoque mínimo.
- **Pacote de insumo:** insumo, código do QR, quantidade, lote, validade, situação.
- **Movimentação de estoque:** entrada, saída ou ajuste, quantidade, responsável.
- **Planilha de insumos:** registro da foto enviada da planilha física.

### 4.5 Fila de espera

- **Entrada na fila:** paciente, prioridade (vermelho/amarelo/verde), motivo, dentista preferido, situação.
- **Oferta de horário:** entrada na fila, horário oferecido, dentista, **link opaco** (somente hash armazenado), expiração, situação.
- **Resposta do paciente à oferta:** oferta, resposta (aceitar/recusar), consentimento, momento, **hash do IP** (nunca IP em texto claro).

### 4.6 Transversal

- **Lembrete pós-consulta:** consulta, dentista, canal, situação, enviado em, erro.
- **Registro de auditoria:** quem agiu, ação, entidade afetada, identificador da entidade, momento, metadados opcionais.

### 4.7 Armazenamento de arquivos (buckets privados)

- Fotos de prontuário, áudios de evolução, fotos de planilha de insumos, etiquetas de QR.
- Acesso somente por colaboradores autorizados via políticas de armazenamento; nunca público.

---

## 5. Matriz de acesso por papel

Regras de **navegação** (guarda no layout autenticado) e **políticas no banco** devem ser coerentes. O banco é a última linha de defesa.

| Módulo / área de dados        | admin | dentist | reception | room_assistant | viewer |
| ----------------------------- | :---: | :-----: | :-------: | :------------: | :----: |
| Hoje                          |  RW   |   R     |     R     |       —        |   R    |
| Agenda                        |  RW   |   R*    |    RW     |       —        |   R    |
| Pacientes / prontuário        |  RW   |   RW*   |    RW     |       —        |   R†   |
| Fila Kanban                   |  RW   |   R     |    RW     |       —        |   —    |
| Estoque (listagem/gestão)     |  RW   |   R     |     R     |       R        |   —    |
| Scan QR (`/estoque/scan`)     |  RW   |   —     |     —     |       RW       |   —    |
| Link público da fila          |  —‡   |   —‡    |    —‡     |      —‡        |  —‡    |
| Registro de auditoria (leitura)|  R   |   —     |     —     |       —        |   —    |

Legenda: **R** leitura · **W** escrita · **RW** leitura e escrita · **—** sem acesso · **\*** dentista: escopo preferencialmente ligado ao próprio profissional (políticas preparadas; refinamento na Fase 2/3) · **†** viewer: dados demográficos básicos do paciente, **sem** conteúdo clínico sensível · **‡** rota pública, fora do shell autenticado; políticas específicas na Fase 4.

**Decisão fechada:** recepção **não** acessa Scan QR nesta fase (dispositivo da auxiliar). Admin acessa tudo.

---

## 6. Escopo funcional

### 6.1 Evolução do banco de dados

- Aplicar migrations **por domínio**, na ordem: identidade → pacientes/prontuário → agenda → estoque → fila → lembretes/auditoria → armazenamento.
- Toda entidade persistida com **políticas de acesso ativas** desde a criação.
- Gatilho na criação de conta de autenticação para provisionar perfil inicial (papel padrão configurável no seed; produção via convite/admin).
- Índices e restrições mínimas para integridade (unicidade de CPF de paciente, FKs, enums alinhados aos tipos já definidos em `src/types/clinroma.ts`).

### 6.2 Autenticação

- Tela de **login** em rota dedicada `(auth)/login`, fora do shell de módulos.
- Autenticação via Supabase Auth (e-mail + senha no v1).
- **Limitação de tentativas** de login (proteção contra força bruta; alinhado a `docs/SECURITY.md`).
- Após login bem-sucedido: redirecionamento para `/hoje` (ou rota de retorno segura se informada).
- Logout disponível no shell autenticado (mínimo: ação que encerra sessão e volta ao login).
- Colaborador **inativo** não autentica ou é barrado imediatamente após autenticação.

### 6.3 Guarda de rotas autenticadas

- Rotas em `(app)/*` exigem sessão válida; visitante é redirecionado ao login.
- Layout autenticado resolve **papel do colaborador** e bloqueia módulos não permitidos (página de acesso negado em pt-BR, sem vazar dados).
- Rota pública `/fila/resposta/[token]` **permanece acessível sem login** e **fora** do shell de módulos.
- Middleware existente continua renovando sessão; redirecionamento de não autenticado pode ocorrer no middleware **ou** no layout, mas o comportamento deve ser único e previsível.

### 6.4 Registro de auditoria (infraestrutura)

- Helper reutilizável em `src/lib/audit/` para registrar ações (ator, verbo, entidade, id, meta).
- Helper **não** exige uso em todas as telas nesta fase; consumo pleno na Fase 3 (prontuário). Deve estar testado unitariamente e documentado para features futuras.

### 6.5 Tipos gerados

- Gerar `src/lib/supabase/database.types.ts` a partir do schema aplicado (CLI Supabase).
- Tipos de domínio em `src/types/clinroma.ts` permanecem fonte para enums compartilhados com UI; evitar duplicar enums no SQL de forma divergente.

### 6.6 Seed de desenvolvimento

- Script ou migration de seed **somente para ambiente de desenvolvimento** com:
  - Cinco **dentistas** do piloto Neo Roma (nomes e cores de agenda fictícias ou acordadas com o cliente).
  - Contas de teste **uma por papel** (senhas documentadas no README ou `.env.example`, nunca senhas reais de produção).
  - Vínculo opcional dentista ↔ perfil de dentista quando aplicável.
- Seed idempotente (`on conflict do nothing` ou equivalente) para reexecução segura.

### 6.7 Componentes de UI mínimos para login

- Formulário de login com campo de e-mail, senha, botão entrar, estados de carregamento e erro visíveis (mobile-first, alvo 44×44, fonte 16px nos campos).
- Pode reutilizar botão e input shadcn existentes; adicionar label e componentes shadcn extras **somente se necessário** (ex.: label, card).

---

## 7. Fora de escopo

- CRUD visível de pacientes, consultas, fila, estoque (Fases 2 a 5).
- Calendário, gravador de áudio, leitor QR, transcrição Whisper.
- Envio de lembretes por e-mail (Resend).
- Página pública da fila **funcional** (aceitar/recusar); políticas de dados podem existir, UI continua placeholder.
- Convite por e-mail self-service, OAuth social, MFA.
- Painel admin de gestão de usuários (provisionamento manual via seed/dashboard Supabase no piloto).
- Testes E2E / Playwright; homologação formal `manual-report` (Fase 6).
- Deploy produção Vercel / projeto Supabase de produção separado (Fase 6).
- Correção documental de `docs/SECURITY.md` (referência a `clinic_id` vs single-tenant).

---

## 8. Fluxos

### 8.1 Caminho feliz · Recepção faz login

1. Colaboradora de recepção abre o app em `https://localhost:3000` (ou IP local no celular).
2. Tenta acessar `/agenda` sem sessão; é redirecionada ao login.
3. Informa e-mail e senha válidos do seed.
4. Sistema autentica, renova cookies e redireciona para `/hoje`.
5. Shell exibe navegação com módulos permitidos ao papel recepção (Hoje, Agenda, Pacientes, Fila, Estoque sem Scan).
6. Navega entre módulos permitidos; placeholders continuam visíveis, sem erro de autorização.
7. Encerra sessão; volta ao login; `/agenda` volta a exigir autenticação.

### 8.2 Caminho feliz · Auxiliar acessa Scan QR

1. Auxiliar autentica com papel `room_assistant`.
2. Barra inferior / sidebar mostra Estoque; consegue abrir `/estoque/scan`.
3. Não consegue acessar `/agenda` nem `/pacientes` (acesso negado claro).
4. Leitura direta no banco, com token válido da auxiliar, respeita as mesmas fronteiras.

### 8.3 Caminho feliz · Desenvolvedor aplica schema

1. Desenvolvedor configura `.env.local` com URL, chave anônima e senha do Postgres.
2. Executa dry-run de migrations; revisa delta.
3. Aplica migrations no projeto Supabase de desenvolvimento.
4. Executa seed de desenvolvimento.
5. Gera tipos TypeScript do banco.
6. `npm run lint`, `npm run build` e testes de política passam.

### 8.4 Caminho feliz · Registro de auditoria (smoke)

1. Desenvolvedor invoca o helper de auditoria em contexto server-side autenticado (teste ou action de smoke).
2. Entrada aparece no registro de auditoria com ator, ação, entidade e timestamp.
3. Colaborador sem permissão de leitura de auditoria **não** consegue listar registros via API do banco.

### 8.5 Caminho feliz · Visitante na fila pública

1. Visitante abre `/fila/resposta/exemplo-token` sem cookies de sessão.
2. Página carrega **sem** redirecionamento ao login e **sem** barra de módulos internos.
3. Botões podem permanecer desabilitados (UI Fase 4); rota não quebra.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| E-mail ou senha incorretos | Mensagem genérica em pt-BR ("Credenciais inválidas"); sem revelar se o e-mail existe | Copy única; rate limit |
| Muitas tentativas de login | Bloqueio temporário ou atraso; mensagem clara | Rate limit na borda ou Auth |
| Colaborador inativo | Login recusado ou sessão invalidada com mensagem de conta desativada | Checar flag `ativo` após auth |
| Sessão expirada em `(app)` | Redirecionamento ao login; sem dados parciais sensíveis na tela | Middleware + layout |
| Papel sem permissão para módulo | Página "Acesso negado" (403); links do shell ocultos ou desabilitados para rotas proibidas | Matriz §5; fail secure |
| Token válido + leitura proibida no banco | Operação falha (zero linhas / erro de permissão) | Testes automatizados por papel |
| Variáveis Supabase ausentes | Login indisponível com mensagem de configuração; rotas autenticadas não expõem PHI | Checagem em `lib/env` |
| Seed reexecutado | Sem duplicar dentistas nem contas de teste | Idempotência no seed |
| Conta auth sem perfil | Bloqueio pós-login com orientação ao admin | Trigger + fallback na guarda |
| Dentista sem vínculo de perfil | Registro clínico existe para agenda futura; login de dentista exige perfil vinculado no seed | Documentar no README |
| Link opaco da fila | Apenas hash persistido; nunca token em claro no banco | Migration + revisão SECURITY |
| IP do paciente na resposta da fila | Apenas hash | Migration + revisão SECURITY |
| `service_role` no client | Proibido | Code review; helper admin só server-side |
| Logout incompleto | Cookies limpos; rotas autenticadas voltam a exigir login | Teste manual + unitário se aplicável |
| Redirect aberto pós-login | Validar que `returnTo` é path interno relativo | Allowlist de paths |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Migrations de **todos** os domínios do §4 aplicadas no Supabase de desenvolvimento via `npm run db:push`.
- [ ] Políticas de acesso ativas em **toda** entidade persistida e nos quatro buckets privados.
- [ ] Matriz de papéis do §5 refletida nas políticas (validada por testes).
- [ ] `src/lib/supabase/database.types.ts` gerado e commitado após push.
- [ ] Tela de login funcional com rate limit de tentativas.
- [ ] Rotas `(app)/*` exigem sessão; visitante vai ao login.
- [ ] Guarda por papel no layout `(app)` conforme matriz §5.
- [ ] Rota pública `/fila/resposta/[token]` permanece sem login e fora do shell.
- [ ] Helper de auditoria em `src/lib/audit/` com teste unitário.
- [ ] Seed de desenvolvimento: 5 dentistas + 1 conta por papel; documentado no README.
- [ ] Logout funcional no shell autenticado.
- [ ] `npm run lint`, `npm run format:check`, `npm run build` passam.
- [ ] Testes automatizados de política: para **cada** papel, pelo menos um caso de leitura/escrita **permitida** e um **negada** em entidade sensível (ex.: prontuário, auditoria).
- [ ] Checklist de `docs/SECURITY.md` revisado para itens aplicáveis a auth/RLS (sem `service_role` no client, fail secure, Zod na borda do login).

### Qualidade

- [ ] Copy em pt-BR; sem travessão "—" em textos novos.
- [ ] Nenhum arquivo alterado fora do escopo permitido (§11).
- [ ] Arquivos novos respeitam limite de ~300 linhas; migrations podem ser múltiplos arquivos por domínio.
- [ ] Validação manual: login como recepção, dentista e auxiliar; tentativa de acessar módulo proibido; visitante na rota pública da fila.

### Explicitamente **não** exigido nesta fase

- Dados reais de pacientes ou consultas na UI.
- Cobertura 80% global (meta plena a partir das features de domínio).
- Homologação `manual-report`.
- WhatsApp, Resend, Whisper.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo / pasta | Motivo |
| --------------- | ------ |
| `specs/2026-08-18-fase-1-dados-auth-papeis.md` | Esta spec |
| `supabase/migrations/001_profiles_dentists.sql` | Identidade + RLS + trigger signup |
| `supabase/migrations/002_patients_records.sql` | Pacientes, prontuário, odontograma, anexos + RLS |
| `supabase/migrations/003_appointments.sql` | Consultas + RLS |
| `supabase/migrations/004_stock.sql` | Estoque + RLS |
| `supabase/migrations/005_waitlist.sql` | Fila, ofertas, respostas + RLS |
| `supabase/migrations/006_reminders_audit.sql` | Lembretes, auditoria + RLS |
| `supabase/migrations/007_storage.sql` | Buckets privados + políticas |
| `supabase/migrations/008_seed_dev.sql` (ou `supabase/seed.sql` + config) | Seed idempotente de dev |
| `src/lib/supabase/database.types.ts` | Tipos gerados |
| `src/lib/supabase/admin.ts` | Cliente service role **server-only** (seed/jobs) |
| `src/lib/auth/session.ts` | Resolução de sessão e perfil |
| `src/lib/auth/roles.ts` | Mapa papel → módulos permitidos |
| `src/lib/auth/guard.ts` | Helpers de autorização server-side |
| `src/lib/audit/write-audit-log.ts` | Escrita no registro de auditoria |
| `src/lib/audit/*.test.ts` | Teste do helper |
| `src/app/(auth)/login/page.tsx` | Tela de login |
| `src/app/(auth)/layout.tsx` | Layout mínimo auth (sem AppShell) |
| `src/features/auth/components/login-form.tsx` | Formulário client mínimo |
| `src/features/auth/schemas.ts` | Zod e-mail/senha |
| `src/features/auth/actions.ts` | Server Actions login/logout |
| `src/app/(app)/acesso-negado/page.tsx` | Página 403 amigável |
| `src/lib/auth/*.test.ts` | Testes de mapa de papéis |
| `src/lib/auth/rls-policy.test.ts` (ou `tests/rls/`) | Testes de política por papel |
| `docs/plans/plano-F1.md` | Plano derivado opcional (status implementação) |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `middleware.ts` | Redirecionar não autenticado de `(app)` para login |
| `src/app/(app)/layout.tsx` | Guarda por papel; expor sessão ao shell |
| `src/components/app-shell.tsx` | Logout; ocultar módulos por papel |
| `README.md` | Contas seed, db:push, gen types, papéis |
| `.env.example` | Variáveis adicionais se necessário (ex.: `SUPABASE_SERVICE_ROLE_KEY` server-only) |
| `package.json` | Script `db:types` ou similar, se adicionado |
| `supabase/config.toml` | Seed path, se usar `supabase db seed` |
| `src/lib/env.ts` | Validação de vars obrigatórias quando auth ativa |
| `src/types/clinroma.ts` | Apenas se precisar alinhar tipos compartilhados (sem duplicar enums) |

### Pode incluir no commit (não bloqueia DoD)

| Path | Nota |
| ---- | ---- |
| `src/components/ui/label.tsx`, `card.tsx` | Se necessário para login |
| `docs/plans/plano-F1.md` | Espelho do plano de fase |

### Proibido alterar nesta feature

- Páginas placeholder de negócio além de wiring mínimo de auth no layout/shell (`hoje`, `agenda`, `pacientes`, `fila`, `estoque` sem CRUD).
- `src/app/fila/resposta/**` (salvo fix acidental de redirect).
- Lógica de calendário, áudio, QR, e-mail.
- `docs/SECURITY.md` (salvo spec futura dedicada).
- `.env.local` (nunca commitar).

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Single-tenant; políticas por papel, **sem** identificador de clínica |
| 2 | Login e-mail + senha (Supabase Auth); sem OAuth/MFA no v1 |
| 3 | Migrations **uma por domínio**, ordem 001–007 + seed 008 |
| 4 | Token da fila e IP do paciente: **somente hash** no banco |
| 5 | Recepção **sem** acesso a Scan QR; auxiliar **sem** agenda/pacientes/fila |
| 6 | Pós-login padrão: `/hoje` |
| 7 | Rate limit obrigatório no login |
| 8 | Tipos gerados commitados após cada push de schema |
| 9 | Seed **apenas** desenvolvimento; senhas fictícias documentadas |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Política mal escrita expondo PHI | Testes por papel na Fase 1; revisão cruzada com §5 |
| Divergência guarda UI vs banco | Matriz única §5; testes negativos obrigatórios |
| Trigger de perfil falhar silenciosamente | Fallback na guarda; monitorar contas órfãs |
| Secret service role vazar ao client | `admin.ts` server-only; lint/review |
| Enums SQL ≠ TypeScript | Reutilizar literais de `clinroma.ts` na documentação das migrations |
| Scope creep para CRUD de módulos | DoD explícito: só login + infra |

---

## 14. Referências

- `docs/PLANO.md` · §5 Modelo de dados · §6 Fase 1
- `docs/SECURITY.md`
- `specs/2026-08-17-fase-0-fundacao.md`
- `AGENTS.md` · `.cursor/rules/architecture.mdc`
- `.cursor/skills/supabase-migrations/SKILL.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch dedicada (sugestão: `feature/fase-1-dados-auth-papeis`), sem expandir escopo.
