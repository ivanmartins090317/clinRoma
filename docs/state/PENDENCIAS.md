# Pendências · ClinRoma

Fonte viva do que **ainda falta implementar ou validar**. Atualizar ao concluir cada fase.

Última revisão: **2026-09-02** (FL-04 TC-23 aprovado: recusa de oferta validada; 23/63 aprovados).

---

## Relógio e jobs (operacional)

Contrato do piloto (spec `specs/2026-08-29-relogio-vps-jobs-next-hobby.md`):

- Relógio = VPS Campinas, a cada 5 minutos
- Jobs = as quatro rotinas do app publicado (expiração de ofertas da fila, lembretes pós-consulta, aviso de estoque baixo ao financeiro, mensagens agendadas ao paciente)
- Hospedagem Hobby = sem relógio nativo
- Segredo do relógio = já ok (as duas rotinas vivas comprovam)
- **Enviar agora** = independente do relógio

Código já está em `main`. Relógio da VPS + jobs do app publicado. Esta fatia **não** fecha a Fase 7.

---

## Fase 1 · Fechamento operacional

Itens da F1 já codificados, mas ainda não homologados manualmente:

- [x] Login como admin (`admin@clinroma.dev`): 8 módulos no menu (TC-01, 2026-09-01)
- [x] Login como recepção (`reception@clinroma.dev`) e navegação só nos módulos permitidos (TC-02, 2026-09-01)
- [x] Login como dentista e tentativa de acessar Scan QR (deve negar) (TC-03, 2026-09-01; BG-01: hero "Nova consulta" visível sem escrita)
- [x] Login como auxiliar (`assistant@clinroma.dev`): Estoque + Scan OK; Agenda/Pacientes/Fila negados (TC-04, 2026-09-01; screenshot pendente)
- [x] Login como visualizador (`viewer@clinroma.dev`): cadastro e agenda leitura; sem prontuário clínico, fila, estoque, WhatsApp e Equipe (TC-05, 2026-09-01; screenshot pendente)
- [ ] Visitante em `/fila/resposta/exemplo-token` sem redirect ao login e sem shell interno
- [x] Logout limpa sessão; rota autenticada volta a exigir login (TC-06, 2026-09-01)
- [ ] Rodar `npm run format:check` limpo no repo (ajustar arquivos legados da F0)
- [ ] Regerar `database.types.ts` via `npm run db:types` (requer Docker para Supabase CLI)

---

## Fase 2 · Fechamento operacional

Código entregue (ver `docs/implementation/F2-agenda.md`). Homologação manual pendente:

- [x] Recepção (desktop): criar consulta em slot livre, buscar paciente seed (TC-07, 2026-09-01)
- [x] Recepção: remarcar arrastando com confirmação (TC-08, 2026-09-01)
- [x] Recepção: cancelar consulta (slot liberado; oferta da fila sem encaixe automático) (TC-09, 2026-09-01)
- [x] Recepção: tentar conflito de horário (mesmo dentista) e ver mensagem de bloqueio (TC-10, 2026-09-01)
- [x] Dentista (mobile/viewport estreito): lista do dia filtrada no Dr. Felipe Roma, somente leitura (TC-11, 2026-09-01)
- [x] Visualizador: ver agenda sem ações de escrita (TC-05 e TC-12, 2026-09-01)
- [x] Auxiliar: acesso a `/agenda` negado (403) (TC-04, 2026-09-01)
- [ ] Verificar bundle mobile sem `react-big-calendar` (dynamic import só em `md+`)

**Pronto quando:** recepção marca/remarca/cancela consulta; dentista vê agenda do dia no celular.

---

## Fase 2 · Implementação (concluída)

Referência: `docs/PLANO.md` §6 · `specs/2026-08-18-fase-2-agenda.md`

- [x] `src/features/agenda/` (queries, actions, schemas, domain, componentes)
- [x] Calendário com coluna por dentista (`agenda-calendar.tsx`)
- [x] Visões dia e semana (desktop); lista do dia agrupada por dentista (mobile)
- [x] CRUD consulta: criar, editar, remarcar, cancelar
- [x] Drag-and-drop para remarcar com confirmação
- [x] Bloqueio de conflito de horário (domínio + migration 010)
- [x] `/hoje` com consultas reais do dia
- [x] Import dinâmico do calendário só a partir de `md`
- [x] Seed: pacientes fictícios + consultas (`011_seed_agenda_dev.sql`)
- [x] Documentação: `docs/implementation/F2-agenda.md`, `docs/manual-dev/04-fase-2-agenda.md`

---

## Fase 3 · Pacientes e prontuário

Referência: `specs/2026-08-18-fase-3-pacientes-prontuario.md` · `docs/implementation/F3-pacientes-prontuario.md`

### Implementação (concluída)

- [x] `src/features/patients/` (busca, cadastro LGPD, componentes)
- [x] `src/features/records/` (anamnese, odontograma, evolução, gravador, transcrição)
- [x] Migrations `012_patients_records_f3.sql`, `013_seed_records_dev.sql`
- [x] Páginas `/pacientes`, `/pacientes/novo`, `/pacientes/[id]`
- [x] Link **Abrir prontuário** na agenda e Hoje
- [x] API `/api/records/audio-chunk` e `/api/records/transcribe`
- [x] Testes Vitest de domínio (CPF, FDI, anamnese 12m, MIME)
- [x] Documentação F3 em `docs/implementation/` e `docs/manual-dev/`

### Fechamento operacional (homologação manual)

- [x] **iPhone real:** fluxo evolução + foto + áudio + transcrição sem reload (§8.5 spec) (TC-14, 2026-09-01)
- [x] **Android real:** mesmo fluxo com WebM/Opus (TC-15, 2026-09-01; BG-02: card só após reload)
- [x] Desktop: recepção cadastra paciente (TC-13, 2026-09-01); dentista anamnese + odontograma ainda pendente
- [ ] Configurar `OPENAI_API_KEY` no ambiente de dev para transcrição real
- [x] Visualizador: só cadastro, sem abas clínicas (TC-05, 2026-09-01)

**Pronto quando:** dentista documenta atendimento no celular com áudio transcrito; recepção cadastra e localiza pacientes.

---

## Fase 4 · Fila Kanban

Referência: `specs/2026-08-18-fase-4-fila-kanban.md` · `docs/implementation/F4-fila-kanban.md`

### Implementação (concluída)

- [x] `src/features/waitlist/` (queries, actions, schemas, domain, componentes)
- [x] Migrations `014_waitlist_f4.sql`, `015_seed_waitlist_dev.sql`
- [x] Kanban real em `/fila` (desktop DnD + mobile abas/menu)
- [x] CRUD fila com LGPD e unicidade de entrada ativa
- [x] Oferta de horário com token opaco, hash, validade 40 min
- [x] WhatsApp no instante da oferta (`sendWhatsApp`); copiar link como fallback
- [x] Falha de envio grava `patient_messages` `slot_offer` pendente no cron `process-patient-messages`
- [x] Página pública `/fila/resposta/[token]` aceitar/recusar
- [x] Aceite cria consulta `confirmed` com validação de conflito
- [x] API pública + cron de expiração
- [x] Resumo fila em `/hoje`
- [x] Atalho oferta pós-cancelamento na agenda
- [x] Testes Vitest de domínio (expiração, token, nome parcial, transições)
- [x] Documentação F4 em `docs/implementation/` e `docs/manual-dev/`
- [x] Documentação da fatia WhatsApp: `F4-fila-oferta-whatsapp.md`, `18-fase-4-fila-oferta-whatsapp.md`

### Fechamento operacional (homologação manual)

- [x] Recepção: ofertar horário e o link chegar por WhatsApp (TC-21, 2026-09-02; evidência no WhatsApp do paciente, 03/09/2026 09:00 Dr. Bruno Costa)
- [x] Paciente: aceitar o link → consulta confirmada na agenda (TC-22 aprovado em 2026-09-02; aceite, confirmação na tela e agenda validados)
- [ ] Copiar link como fallback (sem WhatsApp)
- [x] Cenário recusa: card volta a Aguardando (TC-23, 2026-09-02)
- [ ] Expiração: cron ou curl manual + link expirado na UI pública
- [ ] Dentista: fila somente leitura
- [ ] Visualizador: `/fila` negado

**Pronto quando:** cancelamento vira consulta confirmada pelo link, sem ligação telefônica.

---

## Fase 5 · Insumos e estoque

Referência: `specs/2026-08-18-fase-5-insumos-estoque.md` · `docs/implementation/F5-insumos-estoque.md`

### Implementação (concluída)

- [x] `src/features/stock/` (queries, actions, schemas, domain, componentes)
- [x] Migrations `016_stock_f5.sql`, `017_seed_stock_dev.sql`
- [x] `/estoque` lista, detalhe, cadastro admin, wizard compra (sem OCR)
- [x] Geração QR + folha imprimível de etiquetas
- [x] `/estoque/scan` câmera, viewfinder, nativo + zxing-wasm, modo contínuo
- [x] Retirada atômica via trigger + validação server-side
- [x] Alertas estoque em `/hoje`
- [x] PWA manifest + ícones + atalho Scan estoque
- [x] Testes Vitest de domínio (saldo, retirada, situação, QR)
- [x] Documentação F5 em `docs/implementation/` e `docs/manual-dev/`

### Fechamento operacional (homologação manual)

- [ ] **iPhone real:** scan `CR-DEV001` → retirada → saldo atualizado (§8.3 spec)
- [ ] **Android real:** mesmo fluxo completo
- [ ] Modo contínuo: 3 pacotes distintos sem voltar à lista
- [ ] Desktop admin: cadastro, etiquetas, alerta Anestésico na Hoje
- [ ] Recepção: `/estoque/scan` negado; alertas visíveis na Hoje
- [ ] Auxiliar: scan OK; cadastro base de insumo negado

**Pronto quando:** auxiliar retira pacote pelo celular e saldo cai automaticamente; recepção vê alertas na Hoje.

---

## Fase 6 · Lembrete e piloto

Referência: `specs/2026-08-18-fase-6-lembrete-piloto.md` · `docs/implementation/F6-lembrete-piloto.md`

### Implementação (concluída)

- [x] `src/features/reminders/` (domínio, lib, queries, actions, UI)
- [x] Migration `018_reminders_f6.sql`
- [x] Enfileiramento ao concluir consulta na agenda
- [x] Integração Resend server-only
- [x] Cron `/api/cron/process-reminders` + `vercel.json`
- [x] Badge lembrete (agenda, Hoje) e painel falhas admin
- [x] Testes Vitest (elegibilidade, retentativa, e-mail)
- [x] `docs/relatorio-testes-manuais.html` (estrutura Neo Roma)
- [x] Documentação F6 em `docs/implementation/` e `docs/manual-dev/`

### Fechamento operacional (homologação manual · antes do cliente)

- [ ] Configurar `RESEND_API_KEY` e `RESEND_FROM_EMAIL` no ambiente de teste
- [ ] **FL-06:** concluir consulta → e-mail em `dentist@clinroma.dev`
- [ ] Executar FL-01…FL-11 (63 TCs, 5 perfis + visitante) com evidências desktop e mobile · **22/63 aprovados** (FL-01 a FL-03; FL-04 TC-21 e TC-22 ok)
- [ ] iPhone e Android nos fluxos áudio, scan, PWA e lembrete
- [ ] Preencher `docs/relatorio-testes-manuais.html` e `docs/evidencias/` (FL-01 a FL-03, TC-21 e TC-22 aprovados; TC-04 e TC-05 sem screenshot)
- [ ] Nenhum bug crítico/alto aberto nos fluxos P0 (BG-01 baixo; BG-02 médio Android reload; BG-03 médio nome no card público; BG-04 fechado; BG-05 alto horário no passado)
- [ ] Deploy produção (Supabase prod + Vercel) conforme checklist manual-dev § Deploy

### Pós-piloto

- [ ] Acompanhamento 5 dias úteis pós go-live
- [ ] Bugs novos rastreados como BG-XX no relatório ou aqui

**Pronto quando:** dentista recebe lembrete por e-mail; homologação manual aprovada; clínica operando em produção.

---

## Fase 7 · Ajustes pós-demo Felipe (2026-08-25)

Referência: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` · `docs/plans/plano-F7.md` · PRD vault (D17–D24)

Felipe gostou da demo (melhor do que esperava). Código da Fase 7 entra por fatia.

### Implementação

- [x] **F7-01** Evolução: transcrição Whisper **editável** (ver `docs/implementation/F7-01-transcricao-editavel.md`)
- [x] **F7-02** Barra de busca no histórico do prontuário (ex.: `dente 24`) (ver `docs/implementation/F7-02-busca-historico.md`)
- [x] **F7-03** Anamnese isolada (link + tablet) com **questionário papel** Sim/Não (ver `docs/implementation/F7-03-anamnese-isolada.md`)
- [x] **F7-09** Card do paciente: resumo da anamnese + último procedimento (ver `docs/implementation/F7-09-card-paciente.md`)
- [x] **F7-04** Automações ao paciente pelo **WhatsApp** (sem inbox neste repo) (ver `docs/implementation/F7-04-05-whatsapp-pos-cirurgia.md`)
- [x] **F7-05** Aba pós-cirurgia: mensagem personalizada → WhatsApp (ver `docs/implementation/F7-04-05-whatsapp-pos-cirurgia.md`)
- [x] **F7-05b** Agendar pós-cirurgia (texto + data/hora; cron dispara na WAHA) (ver `docs/implementation/F7-05b-agendamento-pos-cirurgia.md`)
- [x] **F7-06** Estoque baixo → e-mail do financeiro (ver `docs/implementation/F7-06-estoque-baixo-financeiro.md`)
- [x] **F7-07** Cadastro: segundo telefone + observação (parente / sem WhatsApp) (ver `docs/implementation/F7-07-segundo-telefone.md`)
- [x] **F7-08** Odontograma em **formato de cruz** (FDI, três vistas). Ref: `docs/assets/odontograma-formato-cruz.png` (ver `docs/implementation/F7-08-odontograma-cruz.md`)
- [x] **F7-10** Tela de QR da sessão WhatsApp (ver `docs/implementation/F7-10-tela-qr-whatsapp.md`)

**Ordem sugerida:** F7-07 → F7-09 → F7-02 → F7-08 → F7-03 → F7-05/F7-04 → F7-06.

### Fechamento operacional (homologação)

Itens de código prontos, ainda sem validação em dispositivo real (fica no fechamento da Fase 7):

- [x] **iPhone real:** corrigir transcrição na ficha (F7-01), recarregar e confirmar que o texto permanece (TC-16, 2026-09-02)
- [ ] **Android real:** mesmo fluxo F7-01
- [x] **F7-07 desktop/viewport:** cadastrar com segundo telefone + observação; reabrir a ficha; incluir depois; remover o bloco (TC-13, 2026-09-01)
- [ ] **F7-07 visualizador:** lê o segundo contato no resumo e não edita
- [ ] **F7-09 desktop/viewport:** abrir Maria e ver anamnese vigente + Restauração sem entrar nas abas; toque abre Anamnese / Evoluções
- [x] **F7-09 visualizador:** vê o cadastro e **não** vê os dois blocos clínicos (TC-20, 2026-09-02)
- [x] **F7-02 desktop/viewport:** Maria → Evoluções; `dente 24` mostra só a extração; limpar restaura as duas (TC-17, 2026-09-02)
- [x] **F7-02 recepção:** filtra o histórico e **não** vê o formulário de nova evolução (TC-18, 2026-09-02)
- [x] **F7-02 visualizador:** não vê aba Evoluções nem o campo de busca (TC-20, 2026-09-02)
- [x] **F7-08 desktop:** cruz reconhecível vs PNG; marcar face oclusal do 24; recarregar e o achado permanece (TC-19, 2026-09-02)
- [ ] **F7-08 viewport estreito:** zoom/rolagem; face tocável no zoom de trabalho (≥ 44 px); painel inferior alcançável
- [x] **F7-08 achado antigo:** Maria, dente 36 oclusal na cor de restauração, sem migration (TC-19, 2026-09-02)
- [x] **F7-08 visualizador:** não vê a aba Odontograma (TC-20, 2026-09-02)
- [ ] **F7-03 desktop/viewport:** preencher questionário papel na ficha da Maria; recarregar; v1 do seed continua no histórico
- [ ] **F7-03 pré-consulta:** gerar link, abrir sem login, enviar, recarregar o mesmo link (mensagem genérica)
- [ ] **F7-03 tablet:** convite de consultório; página sem menu; validade só no dia
- [x] **F7-03 visualizador:** não vê aba Anamnese nem botões de convite (TC-20, 2026-09-02)
- [x] **F7-03 db:push:** `022_anamnesis_convites_f7.sql` já estava no remoto (conferido no dry-run 2026-09-01)
- [x] **F7-06:** e-mail de teste (`FINANCE_ALERT_EMAIL`) recebido ao cruzar o mínimo (homologado 2026-09-01)
- [ ] **F7-06:** segunda retirada sem e-mail extra
- [ ] **F7-06 destino vazio:** sem `FINANCE_ALERT_EMAIL`; cruzar o mínimo; nenhum envio; estoque intacto
- [ ] **F7-06 varredura:** cron com Anestésico do seed; um e-mail; ciclo seguinte não reenvia
- [x] **F7-04/F7-05 desktop/viewport:** pós-cirurgia envio imediato com número de teste (homologado 2026-09-01)
- [ ] **F7-04/F7-05 segundo telefone:** paciente sem telefone aproveitável; destino mostra o segundo e a observação
- [ ] **F7-04/F7-05 anamnese:** enviar questionário pré-consulta; tablet **não** dispara; copiar link permanece
- [ ] **F7-04/F7-05 canal ausente:** Enviar agora desabilitado; copiar link na anamnese ok; nenhum disparo imediato
- [x] **F7-04/F7-05 visualizador:** não vê aba Pós-cirurgia nem botão de enviar WhatsApp (TC-20, 2026-09-02)
- [x] **F7-05b desktop/viewport:** agendar envio pós-cirurgia (homologado 2026-09-01)
- [x] **F7-05b cron:** job dispara no horário e vira Enviado (homologado 2026-09-01)
- [ ] **F7-05b cancelar:** Agendado → Cancelar; o cron não dispara
- [ ] **F7-05b canal ausente:** Agendar grava; Enviar agora desabilitado
- [ ] **F7-05b horário passado:** recusa na tela

### Homologação operacional · Tela QR WhatsApp (F7-10)

Código entregue. A fatia **não homologa** sem o aviso do gateway no ar. **Não** fecha a Fase 7.

- [ ] Configurar no gateway o aviso `session.status` da sessão `default` apontando para o app publicado, HMAC = `WHATSAPP_WEBHOOK_SECRET` (diferente do `CRON_SECRET`)
- [x] Homologar o QR com **número de teste** (pareamento e disparo ok, 2026-09-01). Número pessoal do Felipe continua fora
- [x] Recepção: parear pela tela `/whatsapp` e disparar com o canal no ar (homologado 2026-09-01)
- [ ] Admin: desconectar com confirmação; conferir que os disparos param até novo pareamento
- [ ] Dentista: card na Hoje sem link; `/whatsapp` negado
- [ ] Auxiliar e visualizador: sem item, chip, card e tela
- [ ] Chip e card leem o persistido (sem o menu perguntar ao gateway)

### Gestão de acessos · Equipe (F7-11)

Código entregue (ver `docs/implementation/F7-11-gestao-acessos.md`). **Não** fecha a Fase 7.

- [x] Módulo `team` e rota `/equipe` restritos ao admin
- [x] Criar colaborador com convite por e-mail ou senha temporária
- [x] Trocar papel, desativar e reativar acesso; reenviar convite
- [x] Travas no banco: autorrebaixamento e último admin ativo
- [x] `handle_new_user` deixa de aceitar papel do metadata do signup
- [x] Botão de conta no celular com os módulos fora da dock e o Sair que faltava
- [x] **db:push:** `028_team_access_f7.sql` aplicada no remoto em 2026-09-01 (aviso Docker da CLI ignorado)
- [ ] Conferir no painel Supabase se o signup público está desabilitado
- [ ] Confirmar `RESEND_FROM_EMAIL` antes de usar o modo convite por e-mail

Homologação manual pendente:

- [ ] Admin cria colaborador por convite; o link define senha e o login entra
- [ ] Admin cria colaborador com senha temporária; a senha aparece uma vez e o login entra
- [ ] Admin troca papel de um colaborador e o menu dele muda na sessão seguinte
- [ ] Admin desativa colaborador e o login recusa com "Conta desativada"
- [ ] Admin tenta alterar o próprio papel e recebe recusa
- [ ] Admin tenta rebaixar o único admin ativo e recebe recusa
- [ ] Dentista, recepção, auxiliar e visualizador não veem o item Equipe e têm `/equipe` negado
- [x] Celular: botão de conta abre Equipe, WhatsApp e Scan QR para o admin (conferido em 390x844)
- [ ] Celular: botão de conta mostra só WhatsApp para a recepção e só Scan QR para a auxiliar
- [ ] Celular: Sair da conta funciona pelo botão de conta em iPhone e Android real

### Decisões com o Felipe (fechadas em 2026-09-01)

- [x] E-mail do financeiro (F7-06): testes com e-mail de teste; endereço de produção só na entrega à clínica
- [x] 2º telefone **opcional** (rótulo e validação já permitem vazio)
- [x] Pós-cirurgia: **texto-padrão editável**. Dentista altera quando o caso pedir
- [x] Link de anamnese **não** vai sempre por WhatsApp. Tablet da clínica é caminho oficial (F7-03)
- [x] Sem bot de WhatsApp neste momento. Inbox continua fora deste repo. Só disparo
- [x] Provedor WhatsApp do piloto: gateway Web da clínica (código F7-04/F7-05)

**Pronto quando:** os oito itens passam no DoD da spec F7; transcrição corrige na UI; cruz bate com a imagem; paciente não vê outras abas na anamnese.

---
