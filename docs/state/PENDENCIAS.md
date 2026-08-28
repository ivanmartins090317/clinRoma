# Pendências · ClinRoma

Fonte viva do que **ainda falta implementar ou validar**. Atualizar ao concluir cada fase.

Última revisão: **2026-08-28** (F7-05b agendamento pós-cirurgia em código).

---

## Fase 1 · Fechamento operacional

Itens da F1 já codificados, mas ainda não homologados manualmente:

- [ ] Login como recepção (`reception@clinroma.dev`) e navegação só nos módulos permitidos
- [ ] Login como dentista e tentativa de acessar Scan QR (deve negar)
- [ ] Login como auxiliar (`assistant@clinroma.dev`): Estoque + Scan OK; Agenda/Pacientes/Fila negados
- [ ] Visitante em `/fila/resposta/exemplo-token` sem redirect ao login e sem shell interno
- [ ] Logout limpa sessão; `/agenda` volta a exigir login
- [ ] Rodar `npm run format:check` limpo no repo (ajustar arquivos legados da F0)
- [ ] Regerar `database.types.ts` via `npm run db:types` (requer Docker para Supabase CLI)

---

## Fase 2 · Fechamento operacional

Código entregue (ver `docs/implementation/F2-agenda.md`). Homologação manual pendente:

- [ ] Recepção (desktop): criar consulta em slot livre, buscar paciente seed
- [ ] Recepção: remarcar arrastando com confirmação
- [ ] Recepção: cancelar consulta (slot liberado)
- [ ] Recepção: tentar conflito de horário (mesmo dentista) e ver mensagem de bloqueio
- [ ] Dentista (mobile/viewport estreito): lista do dia filtrada no Dr. Felipe Roma, somente leitura
- [ ] Visualizador: ver agenda sem ações de escrita
- [ ] Auxiliar: acesso a `/agenda` negado (403)
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

- [ ] **iPhone real:** fluxo evolução + foto + áudio + transcrição sem reload (§8.5 spec)
- [ ] **Android real:** mesmo fluxo com WebM/Opus
- [ ] Desktop: recepção cadastra paciente; dentista anamnese + odontograma
- [ ] Configurar `OPENAI_API_KEY` no ambiente de dev para transcrição real
- [ ] Visualizador: só cadastro, sem abas clínicas

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
- [x] Página pública `/fila/resposta/[token]` aceitar/recusar
- [x] Aceite cria consulta `confirmed` com validação de conflito
- [x] API pública + cron de expiração
- [x] Resumo fila em `/hoje`
- [x] Atalho oferta pós-cancelamento na agenda
- [x] Testes Vitest de domínio (expiração, token, nome parcial, transições)
- [x] Documentação F4 em `docs/implementation/` e `docs/manual-dev/`

### Fechamento operacional (homologação manual)

- [ ] Recepção: incluir paciente, ofertar horário, copiar link
- [ ] Paciente (mobile/viewport estreita): aceitar link seed → consulta na agenda
- [ ] Cenário recusa: card volta a Aguardando
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
- [ ] Executar FL-01…FL-08 com evidências desktop e mobile
- [ ] iPhone e Android nos fluxos áudio, scan e lembrete
- [ ] Preencher `docs/relatorio-testes-manuais.html` e `docs/evidencias/`
- [ ] Nenhum bug crítico/alto aberto nos fluxos P0
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

**Ordem sugerida:** F7-07 → F7-09 → F7-02 → F7-08 → F7-03 → F7-05/F7-04 → F7-06.

### Fechamento operacional (homologação)

Itens de código prontos, ainda sem validação em dispositivo real (fica no fechamento da Fase 7):

- [ ] **iPhone real:** corrigir transcrição na ficha (F7-01), recarregar e confirmar que o texto permanece
- [ ] **Android real:** mesmo fluxo F7-01
- [ ] **F7-07 desktop/viewport:** cadastrar com segundo telefone + observação; reabrir a ficha; incluir depois; remover o bloco
- [ ] **F7-07 visualizador:** lê o segundo contato no resumo e não edita
- [ ] **F7-09 desktop/viewport:** abrir Maria e ver anamnese vigente + Restauração sem entrar nas abas; toque abre Anamnese / Evoluções
- [ ] **F7-09 visualizador:** vê o cadastro e **não** vê os dois blocos clínicos
- [ ] **F7-02 desktop/viewport:** Maria → Evoluções; `dente 24` mostra só a extração; limpar restaura as duas
- [ ] **F7-02 recepção:** filtra o histórico e **não** vê o formulário de nova evolução
- [ ] **F7-02 visualizador:** não vê aba Evoluções nem o campo de busca
- [ ] **F7-08 desktop:** cruz reconhecível vs PNG; marcar face oclusal do 24; recarregar e o achado permanece
- [ ] **F7-08 viewport estreito:** zoom/rolagem; face tocável no zoom de trabalho (≥ 44 px); painel inferior alcançável
- [ ] **F7-08 achado antigo:** Maria, dente 36 oclusal na cor de restauração, sem migration
- [ ] **F7-08 visualizador:** não vê a aba Odontograma
- [ ] **F7-03 desktop/viewport:** preencher questionário papel na ficha da Maria; recarregar; v1 do seed continua no histórico
- [ ] **F7-03 pré-consulta:** gerar link, abrir sem login, enviar, recarregar o mesmo link (mensagem genérica)
- [ ] **F7-03 tablet:** convite de consultório; página sem menu; validade só no dia
- [ ] **F7-03 visualizador:** não vê aba Anamnese nem botões de convite
- [ ] **F7-03 db:push:** aplicar `022_anamnesis_convites_f7.sql` no remoto (timeout de conexão na entrega)
- [ ] **F7-06:** configurar `FINANCE_ALERT_EMAIL` de teste + Resend; retirar Luva até cruzar o mínimo; um e-mail; segunda retirada sem e-mail extra
- [ ] **F7-06 destino vazio:** sem `FINANCE_ALERT_EMAIL`; cruzar o mínimo; nenhum envio; estoque intacto
- [ ] **F7-06 varredura:** cron com Anestésico do seed; um e-mail; ciclo seguinte não reenvia
- [ ] **F7-04/F7-05 desktop/viewport:** Maria, canal configurado, pós-cirurgia texto livre; recarregar e o registro permanece (número de teste)
- [ ] **F7-04/F7-05 segundo telefone:** paciente sem telefone aproveitável; destino mostra o segundo e a observação
- [ ] **F7-04/F7-05 anamnese:** enviar questionário pré-consulta; tablet **não** dispara; copiar link permanece
- [ ] **F7-04/F7-05 canal ausente:** Enviar agora desabilitado; copiar link na anamnese ok; nenhum disparo imediato
- [ ] **F7-04/F7-05 visualizador:** não vê aba Pós-cirurgia nem botão de enviar WhatsApp
- [ ] **F7-05b desktop/viewport:** Maria, texto + data/hora futura, Agendar envio; recarregar e permanece Agendado
- [ ] **F7-05b cron:** com canal no ar, job vira Enviado (curl local ou esperar 5 min)
- [ ] **F7-05b cancelar:** Agendado → Cancelar; o cron não dispara
- [ ] **F7-05b canal ausente:** Agendar grava; Enviar agora desabilitado
- [ ] **F7-05b horário passado:** recusa na tela

### Pendente com o Felipe (não bloqueia F7-01 a F7-09 em código)

- [ ] E-mail do financeiro (F7-06) · endereço de produção; o código já aceita env vazio
- [ ] 2º telefone obrigatório vs opcional
- [ ] Texto-padrão vs 100% livre no pós-cirurgia
- [ ] Confirmar link de anamnese sempre via WhatsApp
- [x] Provedor WhatsApp do piloto: gateway Web da clínica (código F7-04/F7-05). Inbox fora deste repo. Ops da VPS não é item desta fatia

**Pronto quando:** os oito itens passam no DoD da spec F7; transcrição corrige na UI; cruz bate com a imagem; paciente não vê outras abas na anamnese.

---
